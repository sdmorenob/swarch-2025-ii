//
// TaskNotes Search Service (Go + Gin + MongoDB)
// -------------------------------------------------
// Servicio HTTP independiente para búsqueda de notas.
//
// Responsabilidades:
// - Exponer /health para chequeo de salud
// - Exponer /search (POST y GET) para buscar notas por texto completo
// - Restringir búsqueda por usuario (user_id) y filtros opcionales: categoría, tags
// - Realizar búsqueda textual usando índices de texto en MongoDB
// - Paginación con limit/skip y orden por relevancia (textScore) y updated_at
//
// Integración con la app principal:
// - La app de frontend puede consultar este microservicio directamente
// - Las notas viven en MongoDB (mismo origen de datos que el backend Python)
// - Este servicio no modifica datos, solo lee (read-only)
//
package main

import (
    "context"
    "log"
    "net/http"
    "os"
    "strconv"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/joho/godotenv"
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/bson/primitive"
    "go.mongodb.org/mongo-driver/mongo"
    "go.mongodb.org/mongo-driver/mongo/options"
)

type Note struct {
    ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
    Title     string             `bson:"title" json:"title"`
    Content   string             `bson:"content" json:"content"`
    // IDs almacenados en Mongo; útiles para expansión en el front/otros servicios
    CategoryID string            `bson:"category_id,omitempty" json:"category_id,omitempty"`
    TagIDs     []string          `bson:"tag_ids,omitempty" json:"tag_ids,omitempty"`
    Category  string             `bson:"category,omitempty" json:"category,omitempty"`
    Tags      []string           `bson:"tags,omitempty" json:"tags,omitempty"`
    UserID    int                `bson:"user_id" json:"user_id"`
    CreatedAt time.Time          `bson:"created_at" json:"created_at"`
    UpdatedAt time.Time          `bson:"updated_at" json:"updated_at"`
}

type SearchRequest struct {
	Query    string `json:"query" binding:"required"`
	UserID   int    `json:"user_id" binding:"required"`
	Limit    int    `json:"limit,omitempty"`
	Skip     int    `json:"skip,omitempty"`
	Category string `json:"category,omitempty"`
	Tags     []string `json:"tags,omitempty"`
}

type SearchResponse struct {
	Notes []Note `json:"notes"`
	Total int64  `json:"total"`
	Query string `json:"query"`
}

var mongoClient *mongo.Client
var notesCollection *mongo.Collection

func main() {
    // Carga variables de entorno desde .env si existe (en contenedor se usan envs)
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

    // Inicializa conexión a MongoDB (y prueba con Ping)
	if err := initMongoDB(); err != nil {
		log.Fatal("Failed to connect to MongoDB:", err)
	}
	defer mongoClient.Disconnect(context.Background())

    // Inicializa router Gin con CORS simple
	router := gin.Default()

	// Add CORS middleware
	router.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

    // Rutas HTTP
    router.GET("/health", healthCheck)
    // Reemplazo total: GraphQL en /graphql
    setupGraphQL(router)

    // Arranque del servidor
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	log.Printf("Search service starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, router))
}

// initMongoDB abre cliente, valida conexión y selecciona colección notes.
func initMongoDB() error {
	mongoURL := os.Getenv("MONGODB_URL")
	if mongoURL == "" {
		mongoURL = "mongodb://localhost:27017/tasknotes"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURL))
	if err != nil {
		return err
	}

	// Test the connection
	if err := client.Ping(ctx, nil); err != nil {
		return err
	}

	mongoClient = client
	notesCollection = client.Database("tasknotes").Collection("notes")

	log.Println("Connected to MongoDB successfully")
	return nil
}

// healthCheck permite a orquestadores comprobar si el servicio está sano.
func healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"service": "search-service",
		"time":    time.Now().UTC(),
	})
}

// searchNotes (POST) recibe JSON con query obligatoria y parámetros opcionales.
// Útil cuando el cliente desea enviar un body estructurado.
func searchNotes(c *gin.Context) {
	var req SearchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	performSearch(c, req)
}

// searchNotesGET facilita pruebas desde el navegador (parámetros por querystring).
func searchNotesGET(c *gin.Context) {
	query := c.Query("query")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "query parameter is required"})
		return
	}

	userIDStr := c.Query("user_id")
	if userIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id parameter is required"})
		return
	}

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id"})
		return
	}

	req := SearchRequest{
		Query:  query,
		UserID: userID,
		Limit:  20,
		Skip:   0,
	}

	// Parse optional parameters
	if limitStr := c.Query("limit"); limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil {
			req.Limit = limit
		}
	}

	if skipStr := c.Query("skip"); skipStr != "" {
		if skip, err := strconv.Atoi(skipStr); err == nil {
			req.Skip = skip
		}
	}

	if category := c.Query("category"); category != "" {
		req.Category = category
	}

	performSearch(c, req)
}

// performSearch construye un pipeline de agregación para búsqueda de texto.
// - Filtra por user_id (aislamiento por usuario)
// - Filtro opcional por category y tags (con validaciones básicas)
// - Usa $text con $search (requiere índice de texto en Mongo)
// - Agrega score y ordena por score y updated_at desc
// - Devuelve resultados paginados y total aproximado
func performSearch(c *gin.Context, req SearchRequest) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Validate and sanitize input
	if len(req.Query) > 1000 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Query too long"})
		return
	}
	
	if req.Limit <= 0 {
		req.Limit = 20
	}
	if req.Limit > 100 {
		req.Limit = 100
	}
	if req.Skip < 0 {
		req.Skip = 0
	}

    // Construcción del pipeline de agregación para texto completo
	pipeline := []bson.M{}

    // Etapa $match - combinar filtros de usuario, categoría, tags y búsqueda de texto
    // Para consultas muy cortas (p.ej. "p"), usamos regex en title/content.
    useText := len(req.Query) >= 3
    matchStage := bson.M{"user_id": req.UserID}
    if useText {
        // IMPORTANTE: $text debe estar en la primera etapa $match
        matchStage["$text"] = bson.M{"$search": req.Query}
    } else {
        matchStage["$or"] = []bson.M{
            {"title": bson.M{"$regex": req.Query, "$options": "i"}},
            {"content": bson.M{"$regex": req.Query, "$options": "i"}},
        }
    }

	if req.Category != "" {
		// Validate category length and characters
		if len(req.Category) > 100 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Category name too long"})
			return
		}
		matchStage["category"] = req.Category
	}

	if len(req.Tags) > 0 {
		// Validate tags
		if len(req.Tags) > 20 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Too many tags"})
			return
		}
		// Validate each tag
		for _, tag := range req.Tags {
			if len(tag) > 50 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Tag name too long"})
				return
			}
		}
		matchStage["tags"] = bson.M{"$in": req.Tags}
	}

	pipeline = append(pipeline, bson.M{"$match": matchStage})

    if useText {
        // Añadir text score para ordenar por relevancia
        pipeline = append(pipeline, bson.M{
            "$addFields": bson.M{
                "score": bson.M{"$meta": "textScore"},
            },
        })

        // Ordenar por relevancia y fecha de actualización
        pipeline = append(pipeline, bson.M{
            "$sort": bson.M{
                "score": bson.M{"$meta": "textScore"},
                "updated_at": -1,
            },
        })
    } else {
        // Sin textScore, ordenar por fecha actualización
        pipeline = append(pipeline, bson.M{"$sort": bson.M{"updated_at": -1}})
    }

    // Calcular total aproximado (otra agregación con $count)
	countPipeline := append(pipeline, bson.M{"$count": "total"})
	countCursor, err := notesCollection.Aggregate(ctx, countPipeline)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count search results"})
		return
	}

	var countResult []bson.M
	if err := countCursor.All(ctx, &countResult); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode count results"})
		return
	}

	var total int64 = 0
	if len(countResult) > 0 {
		if count, ok := countResult[0]["total"].(int32); ok {
			total = int64(count)
		}
	}

	// Apply pagination
	if req.Skip > 0 {
		pipeline = append(pipeline, bson.M{"$skip": req.Skip})
	}

	if req.Limit <= 0 {
		req.Limit = 20
	}
	if req.Limit > 100 {
		req.Limit = 100
	}
	pipeline = append(pipeline, bson.M{"$limit": req.Limit})

	// Execute search
	cursor, err := notesCollection.Aggregate(ctx, pipeline)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to execute search"})
		return
	}
	defer cursor.Close(ctx)

	var notes []Note
	if err := cursor.All(ctx, &notes); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode search results"})
		return
	}

	if notes == nil {
		notes = []Note{}
	}

	response := SearchResponse{
		Notes: notes,
		Total: total,
		Query: req.Query,
	}

	c.JSON(http.StatusOK, response)
}