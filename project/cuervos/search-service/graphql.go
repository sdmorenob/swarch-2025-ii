package main

import (
    "context"
    "fmt"
    "os"
    "strings"
    "time"

    "github.com/golang-jwt/jwt/v5"
    "github.com/gin-gonic/gin"
    "github.com/graphql-go/graphql"
    graphqlhandler "github.com/graphql-go/handler"
    "go.mongodb.org/mongo-driver/bson"
)

// performSearchCore ejecuta la búsqueda y devuelve el resultado para ser usado por GraphQL.
func performSearchCore(ctx context.Context, req SearchRequest) (SearchResponse, error) {
    // Validaciones
    if len(req.Query) > 1000 {
        return SearchResponse{}, fmt.Errorf("Query too long")
    }
    if req.Limit <= 0 { req.Limit = 20 }
    if req.Limit > 100 { req.Limit = 100 }
    if req.Skip < 0 { req.Skip = 0 }

    // Pipeline de agregación
    pipeline := []bson.M{}
    // Para consultas cortas (p.ej. "p"), $text no suele devolver coincidencias.
    // Hacemos fallback a búsqueda por regex en title/content cuando la query es muy corta.
    useText := len(req.Query) >= 3
    matchStage := bson.M{"user_id": req.UserID}
    if useText {
        matchStage["$text"] = bson.M{"$search": req.Query}
    } else {
        matchStage["$or"] = []bson.M{
            {"title": bson.M{"$regex": req.Query, "$options": "i"}},
            {"content": bson.M{"$regex": req.Query, "$options": "i"}},
        }
    }
    if req.Category != "" {
        if len(req.Category) > 100 { return SearchResponse{}, fmt.Errorf("Category name too long") }
        matchStage["category"] = req.Category
    }
    if len(req.Tags) > 0 {
        if len(req.Tags) > 20 { return SearchResponse{}, fmt.Errorf("Too many tags") }
        for _, tag := range req.Tags { if len(tag) > 50 { return SearchResponse{}, fmt.Errorf("Tag name too long") } }
        matchStage["tags"] = bson.M{"$in": req.Tags}
    }

    pipeline = append(pipeline, bson.M{"$match": matchStage})
    if useText {
        pipeline = append(pipeline, bson.M{"$addFields": bson.M{"score": bson.M{"$meta": "textScore"}}})
        pipeline = append(pipeline, bson.M{"$sort": bson.M{"score": bson.M{"$meta": "textScore"}, "updated_at": -1}})
    } else {
        // Sin textScore, ordenamos por updated_at desc
        pipeline = append(pipeline, bson.M{"$sort": bson.M{"updated_at": -1}})
    }

    // Conteo total
    countPipeline := append(pipeline, bson.M{"$count": "total"})
    countCursor, err := notesCollection.Aggregate(ctx, countPipeline)
    if err != nil { return SearchResponse{}, fmt.Errorf("Failed to count search results") }
    var countResult []bson.M
    if err := countCursor.All(ctx, &countResult); err != nil { return SearchResponse{}, fmt.Errorf("Failed to decode count results") }
    var total int64 = 0
    if len(countResult) > 0 { if count, ok := countResult[0]["total"].(int32); ok { total = int64(count) } }

    if req.Skip > 0 { pipeline = append(pipeline, bson.M{"$skip": req.Skip}) }
    pipeline = append(pipeline, bson.M{"$limit": req.Limit})

    cursor, err := notesCollection.Aggregate(ctx, pipeline)
    if err != nil { return SearchResponse{}, fmt.Errorf("Failed to execute search") }
    defer cursor.Close(ctx)

    var notes []Note
    if err := cursor.All(ctx, &notes); err != nil { return SearchResponse{}, fmt.Errorf("Failed to decode search results") }
    if notes == nil { notes = []Note{} }

    return SearchResponse{Notes: notes, Total: total, Query: req.Query}, nil
}

// setupGraphQL configura el esquema y expone /graphql con soporte de GraphiQL.
func setupGraphQL(router *gin.Engine) {
    // Tipos
    noteType := graphql.NewObject(graphql.ObjectConfig{
        Name: "Note",
        Fields: graphql.Fields{
            "id": &graphql.Field{Type: graphql.String, Resolve: func(p graphql.ResolveParams) (interface{}, error) {
                n := p.Source.(Note)
                if n.ID.IsZero() { return "", nil }
                return n.ID.Hex(), nil
            }},
            "title": &graphql.Field{Type: graphql.String, Resolve: func(p graphql.ResolveParams) (interface{}, error) { n := p.Source.(Note); return n.Title, nil }},
            "content": &graphql.Field{Type: graphql.String, Resolve: func(p graphql.ResolveParams) (interface{}, error) { n := p.Source.(Note); return n.Content, nil }},
            // IDs crudos guardados en Mongo; útiles para enriquecer en el cliente
            "categoryId": &graphql.Field{Type: graphql.String, Resolve: func(p graphql.ResolveParams) (interface{}, error) { n := p.Source.(Note); if n.CategoryID == "" { return nil, nil }; return n.CategoryID, nil }},
            "tagIds": &graphql.Field{Type: graphql.NewList(graphql.String), Resolve: func(p graphql.ResolveParams) (interface{}, error) { n := p.Source.(Note); return n.TagIDs, nil }},
            "category": &graphql.Field{Type: graphql.String, Resolve: func(p graphql.ResolveParams) (interface{}, error) { n := p.Source.(Note); if n.Category == "" { return nil, nil }; return n.Category, nil }},
            "tags": &graphql.Field{Type: graphql.NewList(graphql.String), Resolve: func(p graphql.ResolveParams) (interface{}, error) { n := p.Source.(Note); return n.Tags, nil }},
            "userId": &graphql.Field{Type: graphql.Int, Resolve: func(p graphql.ResolveParams) (interface{}, error) { n := p.Source.(Note); return n.UserID, nil }},
            "createdAt": &graphql.Field{Type: graphql.String, Resolve: func(p graphql.ResolveParams) (interface{}, error) { n := p.Source.(Note); return n.CreatedAt.Format(time.RFC3339), nil }},
            "updatedAt": &graphql.Field{Type: graphql.String, Resolve: func(p graphql.ResolveParams) (interface{}, error) { n := p.Source.(Note); return n.UpdatedAt.Format(time.RFC3339), nil }},
        },
    })

    searchResponseType := graphql.NewObject(graphql.ObjectConfig{
        Name: "SearchResponse",
        Fields: graphql.Fields{
            "notes": &graphql.Field{Type: graphql.NewList(noteType)},
            "total": &graphql.Field{Type: graphql.Int},
            "query": &graphql.Field{Type: graphql.String},
        },
    })

    searchRequestInput := graphql.NewInputObject(graphql.InputObjectConfig{
        Name: "SearchRequestInput",
        Fields: graphql.InputObjectConfigFieldMap{
            "query":    &graphql.InputObjectFieldConfig{Type: graphql.NewNonNull(graphql.String)},
            "userId":   &graphql.InputObjectFieldConfig{Type: graphql.NewNonNull(graphql.Int)},
            "limit":    &graphql.InputObjectFieldConfig{Type: graphql.Int},
            "skip":     &graphql.InputObjectFieldConfig{Type: graphql.Int},
            "category": &graphql.InputObjectFieldConfig{Type: graphql.String},
            "tags":     &graphql.InputObjectFieldConfig{Type: graphql.NewList(graphql.String)},
        },
    })

    queryType := graphql.NewObject(graphql.ObjectConfig{
        Name: "Query",
        Fields: graphql.Fields{
            "searchNotes": &graphql.Field{
                Type: searchResponseType,
                Args: graphql.FieldConfigArgument{
                    "input": &graphql.ArgumentConfig{Type: graphql.NewNonNull(searchRequestInput)},
                },
                Resolve: func(p graphql.ResolveParams) (interface{}, error) {
                    in := p.Args["input"].(map[string]interface{})
                    req := SearchRequest{ Query: in["query"].(string), UserID: in["userId"].(int), Limit: 20, Skip: 0 }
                    if authHeader, ok := p.Context.Value("authHeader").(string); ok {
                        if uid, ok2 := extractUserIDFromJWT(authHeader); ok2 {
                            req.UserID = uid
                        }
                    }
                    if v, ok := in["limit"]; ok { req.Limit = v.(int) }
                    if v, ok := in["skip"]; ok { req.Skip = v.(int) }
                    if v, ok := in["category"]; ok { req.Category = v.(string) }
                    if v, ok := in["tags"]; ok {
                        arr := v.([]interface{})
                        tags := make([]string, 0, len(arr))
                        for _, t := range arr { if s, ok := t.(string); ok { tags = append(tags, s) } }
                        req.Tags = tags
                    }
                    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
                    defer cancel()
                    res, err := performSearchCore(ctx, req)
                    if err != nil { return nil, err }
                    return map[string]interface{}{ "notes": res.Notes, "total": res.Total, "query": res.Query }, nil
                },
            },
        },
    })

    schema, err := graphql.NewSchema(graphql.SchemaConfig{Query: queryType})
    if err != nil { panic(err) }

    h := graphqlhandler.New(&graphqlhandler.Config{Schema: &schema, Pretty: true, GraphiQL: true})
    router.Any("/graphql", func(c *gin.Context) {
        ctx := context.WithValue(c.Request.Context(), "authHeader", c.GetHeader("Authorization"))
        req := c.Request.Clone(ctx)
        h.ServeHTTP(c.Writer, req)
    })
}

func extractUserIDFromJWT(authHeader string) (int, bool) {
    parts := strings.SplitN(authHeader, " ", 2)
    if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") { return 0, false }
    tokenStr := strings.TrimSpace(parts[1])

    secret := os.Getenv("JWT_SECRET")
    if secret != "" {
        token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) { return []byte(secret), nil })
        if err != nil || !token.Valid { return 0, false }
        if claims, ok := token.Claims.(jwt.MapClaims); ok {
            if uid, ok := claims["user_id"]; ok { if v, ok := toInt(uid); ok { return v, true } }
            if sub, ok := claims["sub"]; ok { if v, ok := toInt(sub); ok { return v, true } }
        }
        return 0, false
    }

    parser := jwt.NewParser()
    token, _, err := parser.ParseUnverified(tokenStr, jwt.MapClaims{})
    if err != nil { return 0, false }
    if claims, ok := token.Claims.(jwt.MapClaims); ok {
        if uid, ok := claims["user_id"]; ok { if v, ok := toInt(uid); ok { return v, true } }
        if sub, ok := claims["sub"]; ok { if v, ok := toInt(sub); ok { return v, true } }
    }
    return 0, false
}

func toInt(v interface{}) (int, bool) {
    switch t := v.(type) {
    case float64:
        return int(t), true
    case int:
        return t, true
    case string:
        if t == "" { return 0, false }
        var out int
        _, err := fmt.Sscanf(t, "%d", &out)
        if err != nil { return 0, false }
        return out, true
    default:
        return 0, false
    }
}