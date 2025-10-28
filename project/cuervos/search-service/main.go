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

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"search-service/grpc"
	"search-service/services"
)

// Note struct removed - now using NoteDTO for REST responses

type SearchRequest struct {
	Query    string   `json:"query" binding:"required"`
	UserID   int      `json:"user_id" binding:"required"`
	Limit    int      `json:"limit,omitempty"`
	Skip     int      `json:"skip,omitempty"`
	Offset   int      `json:"offset,omitempty"`
	Category string   `json:"category,omitempty"`
	Tags     []string `json:"tags,omitempty"`
}

// Define DTOs for REST response (decoupled from Mongo models)
type TagSummary struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Color string `json:"color,omitempty"`
}

type CategorySummary struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Color string `json:"color,omitempty"`
}

type NoteDTO struct {
	ID         string           `json:"id"`
	Title      string           `json:"title"`
	Content    string           `json:"content"`
	UserID     int              `json:"user_id"`
	CategoryID string           `json:"category_id,omitempty"`
	CreatedAt  string           `json:"created_at"`
	UpdatedAt  string           `json:"updated_at"`
	Category   *CategorySummary `json:"category,omitempty"`
	Tags       []TagSummary     `json:"tags,omitempty"`
}

type SearchResponse struct {
	Notes []NoteDTO `json:"notes"`
	Total int64     `json:"total"`
	Query string    `json:"query"`
}

var searchService *services.SearchService

func main() {
	// Configurar direcciones de servicios gRPC
	notesAddr := os.Getenv("NOTES_GRPC_ADDR")
	if notesAddr == "" {
		notesAddr = "notes-service:50051"
	}

	tasksAddr := os.Getenv("TASKS_GRPC_ADDR")
	if tasksAddr == "" {
		tasksAddr = "tasks-service:50052"
	}

	// Inicializar clientes gRPC
	grpcClients, err := grpc.NewGRPCClients(notesAddr, tasksAddr)
	if err != nil {
		log.Fatal("Error initializing gRPC clients:", err)
	}
	defer grpcClients.Close()

	// Inicializar servicio de búsqueda
	searchService = services.NewSearchService(grpcClients)


	// Configurar Gin
	router := gin.Default()

	// Configurar CORS
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization", "X-User-ID"}
	router.Use(cors.New(config))

	// Endpoints REST en raíz para compatibilidad con API Gateway (/search -> /)
	router.POST("/", searchNotes)
	router.GET("/", searchNotesGET)
	// Endpoints REST clásicos para compatibilidad con clientes existentes
	router.POST("/search/notes", searchNotes)
	router.GET("/search/notes", searchNotesGET)

	// Configurar GraphQL
	setupGraphQL(router)

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Obtener puerto
	port := os.Getenv("PORT")
	if port == "" {
		port = "8008"
	}

	log.Printf("Search Service running on port %s", port)
	log.Fatal(router.Run(":" + port))
}

// MongoDB initialization removed - now using gRPC exclusively

// healthCheck permite a orquestadores comprobar si el servicio está sano.
func healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"service": "search-service",
		"time":    time.Now().UTC(),
	})
}

// searchNotes (POST) recibe JSON y usa gRPC hacia notes/tasks
func searchNotes(c *gin.Context) {
	var req SearchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Construir request para gRPC
	skip := req.Skip
	if req.Offset != 0 {
		skip = req.Offset
	}
	grpcReq := services.SearchRequest{
		Query:    req.Query,
		UserID:   int32(req.UserID),
		Category: req.Category,
		Tags:     req.Tags,
		Limit:    int32(req.Limit),
		Skip:     int32(skip),
	}

	resp, err := searchService.UnifiedSearch(context.Background(), grpcReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Mapear solo notas a la forma esperada por el frontend
	notes := make([]NoteDTO, 0)
	for _, r := range resp.Results {
		if r.Type != "note" {
			continue
		}
		var categorySummary *CategorySummary
		if r.Category != nil {
			categorySummary = &CategorySummary{ID: r.Category.ID, Name: r.Category.Name, Color: r.Category.Color}
		}
		tagSummaries := make([]TagSummary, 0, len(r.Tags))
		for _, t := range r.Tags {
			tagSummaries = append(tagSummaries, TagSummary{ID: t.ID, Name: t.Name, Color: t.Color})
		}
		updated := r.UpdatedAt.Format(time.RFC3339)
		notes = append(notes, NoteDTO{
			ID:         r.ID,
			Title:      r.Title,
			Content:    r.Content,
			UserID:     req.UserID,
			CategoryID: func() string { if categorySummary != nil { return categorySummary.ID } ; return "" }(),
			CreatedAt:  updated,
			UpdatedAt:  updated,
			Category:   categorySummary,
			Tags:       tagSummaries,
		})
	}

	c.JSON(http.StatusOK, SearchResponse{Notes: notes, Total: resp.Total, Query: req.Query})
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
	if offsetStr := c.Query("offset"); offsetStr != "" {
		if off, err := strconv.Atoi(offsetStr); err == nil {
			req.Skip = off
		}
	}

	if category := c.Query("category"); category != "" {
		req.Category = category
	}

	// Usar gRPC UnifiedSearch como en el handler POST
	grpcReq := services.SearchRequest{
		Query:    req.Query,
		UserID:   int32(req.UserID),
		Category: req.Category,
		Tags:     req.Tags,
		Limit:    int32(req.Limit),
		Skip:     int32(req.Skip),
	}
	resp, err := searchService.UnifiedSearch(context.Background(), grpcReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Mapear resultados de notas
	notes := make([]NoteDTO, 0)
	for _, r := range resp.Results {
		if r.Type != "note" {
			continue
		}
		var categorySummary *CategorySummary
		if r.Category != nil {
			categorySummary = &CategorySummary{ID: r.Category.ID, Name: r.Category.Name, Color: r.Category.Color}
		}
		tagSummaries := make([]TagSummary, 0, len(r.Tags))
		for _, t := range r.Tags {
			tagSummaries = append(tagSummaries, TagSummary{ID: t.ID, Name: t.Name, Color: t.Color})
		}
		updated := r.UpdatedAt.Format(time.RFC3339)
		notes = append(notes, NoteDTO{
			ID:         r.ID,
			Title:      r.Title,
			Content:    r.Content,
			UserID:     req.UserID,
			CategoryID: func() string { if categorySummary != nil { return categorySummary.ID } ; return "" }(),
			CreatedAt:  updated,
			UpdatedAt:  updated,
			Category:   categorySummary,
			Tags:       tagSummaries,
		})
	}

	c.JSON(http.StatusOK, SearchResponse{Notes: notes, Total: resp.Total, Query: req.Query})
}