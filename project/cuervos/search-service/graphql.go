package main

import (
    "context"
    "encoding/json"
    "fmt"
    "net/http"
    "os"
    "strings"

    "github.com/golang-jwt/jwt/v5"
    "github.com/gin-gonic/gin"
    "github.com/graphql-go/graphql"
    graphqlhandler "github.com/graphql-go/handler"
    "search-service/services"
)

// performSearchCore is now deprecated - GraphQL resolver uses gRPC directly
// This function is kept for backward compatibility but should not be used
func performSearchCore(ctx context.Context, req SearchRequest) (SearchResponse, error) {
    return SearchResponse{}, fmt.Errorf("performSearchCore is deprecated - use gRPC UnifiedSearch directly")
}

// Definir el tipo CategorySummary para GraphQL
var categorySummaryType = graphql.NewObject(graphql.ObjectConfig{
    Name: "CategorySummary",
    Fields: graphql.Fields{
        "id": &graphql.Field{ Type: graphql.String },
        "name": &graphql.Field{ Type: graphql.String },
        "color": &graphql.Field{ Type: graphql.String },
    },
})

// Definir el tipo TagSummary para GraphQL
var tagSummaryType = graphql.NewObject(graphql.ObjectConfig{
    Name: "TagSummary",
    Fields: graphql.Fields{
        "id": &graphql.Field{ Type: graphql.String },
        "name": &graphql.Field{ Type: graphql.String },
        "color": &graphql.Field{ Type: graphql.String },
    },
})

// Definir el tipo UnifiedSearchResult para GraphQL
var unifiedSearchResultType = graphql.NewObject(graphql.ObjectConfig{
    Name: "UnifiedSearchResult",
    Fields: graphql.Fields{
        "id": &graphql.Field{ Type: graphql.String },
        "type": &graphql.Field{ Type: graphql.String },
        "title": &graphql.Field{ Type: graphql.String },
        "content": &graphql.Field{ Type: graphql.String },
        "user_id": &graphql.Field{ Type: graphql.Int },
        "category": &graphql.Field{ Type: categorySummaryType },
        "tags": &graphql.Field{ Type: graphql.NewList(tagSummaryType) },
        "created_at": &graphql.Field{ Type: graphql.String },
        "updated_at": &graphql.Field{ Type: graphql.String },
        "completed": &graphql.Field{ Type: graphql.Boolean },
        "priority": &graphql.Field{ Type: graphql.String },
        "due_date": &graphql.Field{ Type: graphql.String },
    },
})

// Definir el tipo UnifiedSearchResponse para GraphQL
var unifiedSearchResponseType = graphql.NewObject(graphql.ObjectConfig{
    Name: "UnifiedSearchResponse",
    Fields: graphql.Fields{
        "results": &graphql.Field{ Type: graphql.NewList(unifiedSearchResultType) },
        "total": &graphql.Field{ Type: graphql.Int },
        "notes_count": &graphql.Field{ Type: graphql.Int },
        "tasks_count": &graphql.Field{ Type: graphql.Int },
    },
})

// Definir el schema de GraphQL
var schema, _ = graphql.NewSchema(graphql.SchemaConfig{
    Query: graphql.NewObject(graphql.ObjectConfig{
        Name: "Query",
        Fields: graphql.Fields{
            "search": &graphql.Field{
                Type: unifiedSearchResponseType,
                Args: graphql.FieldConfigArgument{
                    "query": &graphql.ArgumentConfig{ Type: graphql.String },
                    "user_id": &graphql.ArgumentConfig{ Type: graphql.NewNonNull(graphql.Int) },
                    "category": &graphql.ArgumentConfig{ Type: graphql.String },
                    "tags": &graphql.ArgumentConfig{ Type: graphql.NewList(graphql.String) },
                    "limit": &graphql.ArgumentConfig{ Type: graphql.Int, DefaultValue: 20 },
                    "skip": &graphql.ArgumentConfig{ Type: graphql.Int, DefaultValue: 0 },
                },
                Resolve: func(params graphql.ResolveParams) (interface{}, error) {
                    if searchService == nil {
                        return nil, fmt.Errorf("search service not initialized")
                    }

                    query, _ := params.Args["query"].(string)
                    category, _ := params.Args["category"].(string)
                    limit, _ := params.Args["limit"].(int)
                    skip, _ := params.Args["skip"].(int)

                    // user_id como int32
                    var uid int32
                    if v, ok := params.Args["user_id"]; ok {
                        if i, ok2 := toInt(v); ok2 {
                            uid = int32(i)
                        } else {
                            return nil, fmt.Errorf("invalid user_id")
                        }
                    } else {
                        return nil, fmt.Errorf("user_id is required")
                    }

                    var tags []string
                    if tagsArg, ok := params.Args["tags"].([]interface{}); ok {
                        for _, tag := range tagsArg {
                            if tagStr, ok := tag.(string); ok {
                                tags = append(tags, tagStr)
                            }
                        }
                    }

                    // Crear request de búsqueda
                    searchReq := services.SearchRequest{
                        Query:    query,
                        UserID:   uid,
                        Category: category,
                        Tags:     tags,
                        Limit:    int32(limit),
                        Skip:     int32(skip),
                    }

                    // Realizar búsqueda usando gRPC
                    response, err := searchService.UnifiedSearch(context.Background(), searchReq)
                    if err != nil {
                        return nil, err
                    }

                    return response, nil
                },
            },
        },
    }),
})

func graphqlHandler(w http.ResponseWriter, r *http.Request) {
    h := graphqlhandler.New(&graphqlhandler.Config{ Schema: &schema, Pretty: true })

    // Inyectar user_id a partir del JWT (si está presente)
    authHeader := r.Header.Get("Authorization")
    if authHeader != "" {
        if userID, ok := extractUserIDFromJWT(authHeader); ok {
            // Adjuntar user_id como header para facilitar acceso en resolvers si se requiere
            r.Header.Set("X-User-ID", fmt.Sprintf("%d", userID))
        }
    }

    h.ServeHTTP(w, r)
}

// setupGraphQL registra el endpoint /graphql en Gin
func setupGraphQL(router *gin.Engine) {
    router.POST("/graphql", func(c *gin.Context) {
        graphqlHandler(c.Writer, c.Request)
    })
    router.GET("/graphql", func(c *gin.Context) {
        graphqlHandler(c.Writer, c.Request)
    })
}

// extractUserIDFromJWT extrae el user_id desde el JWT en Authorization: Bearer <token>
func extractUserIDFromJWT(authHeader string) (int, bool) {
    parts := strings.Split(authHeader, " ")
    if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" { return 0, false }

    tokenStr := parts[1]
    // Asegurar que existe KEY_JWT en entorno
    jwtKey := os.Getenv("KEY_JWT")
    if jwtKey == "" { return 0, false }

    // Parsear JWT y extraer claim de user_id (según el backend Python)
    token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
        return []byte(jwtKey), nil
    })
    if err != nil || !token.Valid { return 0, false }

    claims, ok := token.Claims.(jwt.MapClaims)
    if !ok { return 0, false }

    // El backend Python suele poner el id en "sub" o "user_id"
    if sub, ok := claims["sub"].(float64); ok { return int(sub), true }
    if uid, ok := claims["user_id"].(float64); ok { return int(uid), true }

    return 0, false
}

// toInt castea una interfaz a int
func toInt(v interface{}) (int, bool) {
    switch val := v.(type) {
    case int:
        return val, true
    case float64:
        return int(val), true
    case string:
        var i int
        if err := json.Unmarshal([]byte(val), &i); err == nil {
            return i, true
        }
        return 0, false
    default:
        return 0, false
    }
}