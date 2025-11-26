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
    "encoding/json"
    "log"
    "net/http"
    "os"
    "strconv"
    "time"

    "github.com/gin-contrib/cors"
    "github.com/gin-gonic/gin"
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promhttp"
    amqp "github.com/rabbitmq/amqp091-go"
    "github.com/redis/go-redis/v9"

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

    // Configurar Redis (opcional) para Cache-Aside
    redisURL := os.Getenv("REDIS_URL")
    var redisClient *redis.Client
    if redisURL != "" {
        addr := redisURL
        // aceptar formato redis://host:port
        if len(addr) > 8 && addr[:8] == "redis://" {
            addr = addr[8:]
        }
        redisClient = redis.NewClient(&redis.Options{Addr: addr})
    }


	// Configurar Gin
	router := gin.Default()

    // Prometheus metrics
    requestCounter := prometheus.NewCounterVec(prometheus.CounterOpts{
        Name: "search_requests_total",
        Help: "Total de solicitudes",
    }, []string{"method", "endpoint", "status"})
    requestDuration := prometheus.NewHistogramVec(prometheus.HistogramOpts{
        Name:    "search_request_duration_seconds",
        Help:    "Duración de solicitudes en segundos",
        Buckets: prometheus.DefBuckets,
    }, []string{"method", "endpoint"})
    cacheHits := prometheus.NewCounterVec(prometheus.CounterOpts{
        Name: "search_cache_hits_total",
        Help: "Total de aciertos de caché",
    }, []string{"source"})
    cacheMisses := prometheus.NewCounterVec(prometheus.CounterOpts{
        Name: "search_cache_misses_total",
        Help: "Total de fallos de caché",
    }, []string{"source"})
    prometheus.MustRegister(requestCounter, requestDuration, cacheHits, cacheMisses)

	router.Use(func(c *gin.Context) {
		start := time.Now()
		c.Next()
		duration := time.Since(start).Seconds()
		endpoint := c.FullPath()
		if endpoint == "" {
			endpoint = c.Request.URL.Path
		}
		method := c.Request.Method
		status := strconv.Itoa(c.Writer.Status())
		requestDuration.WithLabelValues(method, endpoint).Observe(duration)
		requestCounter.WithLabelValues(method, endpoint, status).Inc()
	})

    // Configurar caché en servicio si Redis está disponible
    if redisClient != nil {
        ttlSecs := 120
        if v := os.Getenv("CACHE_TTL_SECONDS"); v != "" {
            if i, err := strconv.Atoi(v); err == nil && i > 0 {
                ttlSecs = i
            }
        }
        searchService.WithCache(redisClient, time.Duration(ttlSecs)*time.Second, cacheHits, cacheMisses)
    }

    // Suscribir invalidación vía RabbitMQ (nota/tarea cambiadas)
    go startCacheInvalidationSubscriber(redisClient, searchService)

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

	// Metrics endpoint
	router.GET("/metrics", gin.WrapH(promhttp.Handler()))

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

    ctx := context.WithValue(context.Background(), "cache_source", "rest")
    resp, err := searchService.UnifiedSearchCached(ctx, grpcReq)
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
    ctx := context.WithValue(context.Background(), "cache_source", "rest")
    resp, err := searchService.UnifiedSearchCached(ctx, grpcReq)
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

// startCacheInvalidationSubscriber suscribe a eventos relevantes y limpia claves de usuario
func startCacheInvalidationSubscriber(redisClient *redis.Client, svc *services.SearchService) {
    if redisClient == nil || svc == nil {
        return
    }
    url := os.Getenv("RABBITMQ_URL")
    if url == "" {
        url = "amqp://rabbitmq:5672"
    }
    conn, err := amqp.Dial(url)
    if err != nil {
        log.Printf("[cache-inv] RabbitMQ connection failed: %v", err)
        return
    }
    ch, err := conn.Channel()
    if err != nil {
        log.Printf("[cache-inv] Channel error: %v", err)
        return
    }
    // Declarar exchange si no existe
    _ = ch.ExchangeDeclare("tasknotes.events", "topic", true, false, false, false, nil)
    // Crear cola exclusiva para search-service
    q, err := ch.QueueDeclare("search-service-cache-invalidation", true, false, false, false, nil)
    if err != nil {
        log.Printf("[cache-inv] Queue declare error: %v", err)
        return
    }
    // Bindings relevantes
    bindings := []string{"note.updated", "note.deleted", "task.updated", "task.deleted"}
    for _, rk := range bindings {
        _ = ch.QueueBind(q.Name, rk, "tasknotes.events", false, nil)
    }
    msgs, err := ch.Consume(q.Name, "", true, false, false, false, nil)
    if err != nil {
        log.Printf("[cache-inv] Consume error: %v", err)
        return
    }

    go func() {
        for d := range msgs {
            // Esperamos JSON con user_id o sub
            var m map[string]interface{}
            if err := json.Unmarshal(d.Body, &m); err == nil {
                var uid int32
                if v, ok := m["user_id"].(float64); ok {
                    uid = int32(v)
                } else if v, ok := m["sub"].(float64); ok {
                    uid = int32(v)
                }
                if uid > 0 {
                    svc.InvalidateUserCache(context.Background(), uid)
                }
            }
        }
    }()
}