package services

import (
    "context"
    "crypto/sha1"
    "encoding/hex"
    "encoding/json"
    "fmt"
    "sort"
    "strings"
    "time"

    "github.com/redis/go-redis/v9"
    "github.com/prometheus/client_golang/prometheus"

    "search-service/grpc"
    notespb "search-service/grpc/generated/notes"
    "search-service/models"
)

type SearchService struct {
    grpcClients *grpc.GRPCClients
    cache      *redis.Client
    cacheTTL   time.Duration
    cacheHits  *prometheus.CounterVec
    cacheMiss  *prometheus.CounterVec
}

// NewSearchService crea una nueva instancia del servicio de búsqueda
func NewSearchService(grpcClients *grpc.GRPCClients) *SearchService {
    return &SearchService{grpcClients: grpcClients}
}

// WithCache configura Redis y métricas de caché en el servicio
func (s *SearchService) WithCache(client *redis.Client, ttl time.Duration, hits, misses *prometheus.CounterVec) {
    s.cache = client
    s.cacheTTL = ttl
    s.cacheHits = hits
    s.cacheMiss = misses
}

// SearchRequest representa una solicitud de búsqueda
type SearchRequest struct {
	Query    string   `json:"query"`
	UserID   int32    `json:"user_id"`
	Category string   `json:"category,omitempty"`
	Tags     []string `json:"tags,omitempty"`
	Limit    int32    `json:"limit"`
	Skip     int32    `json:"skip"`
}

// UnifiedSearch realiza búsqueda en notas usando gRPC (solo notas)
func (s *SearchService) UnifiedSearch(ctx context.Context, req SearchRequest) (*models.UnifiedSearchResponse, error) {
	// Validaciones
	if req.UserID <= 0 {
		return nil, fmt.Errorf("user_id is required")
	}

	if req.Limit <= 0 {
		req.Limit = 20
	} else if req.Limit > 100 {
		req.Limit = 100
	}

	if req.Skip < 0 {
		req.Skip = 0
	}

	// Preparar request para gRPC de notas
	notesReq := &notespb.SearchNotesRequest{
		Query:    req.Query,
		UserId:   req.UserID,
		Category: req.Category,
		Tags:     req.Tags,
		Limit:    req.Limit,
		Skip:     req.Skip,
	}

	// Buscar notas
	notesResp, err := s.grpcClients.SearchNotes(ctx, notesReq)
	if err != nil {
		return nil, err
	}

	// Convertir resultados de notas
	var allResults []models.UnifiedSearchResult
	if notesResp != nil {
		for _, note := range notesResp.Notes {
			allResults = append(allResults, models.ConvertNoteResult(note))
		}
	}

	// Ordenar resultados por relevancia y fecha
	s.sortResults(allResults, req.Query)

	// Aplicar paginación (ya manejada por el servicio, pero por seguridad)
	totalResults := len(allResults)
	start32 := req.Skip
	end32 := start32 + req.Limit

	start := int(start32)
	end := int(end32)

	if start > totalResults {
		start = totalResults
	}
	if end > totalResults {
		end = totalResults
	}
	if start < 0 {
		start = 0
	}
	if end < start {
		end = start
	}

	paginatedResults := allResults[start:end]

	// Totales
	var totalNotes int64
	if notesResp != nil {
		totalNotes = notesResp.Total
	}

	return &models.UnifiedSearchResponse{
		Results: paginatedResults,
		Total:   totalNotes,
		Notes:   totalNotes,
		Tasks:   0,
	}, nil
}

// sortResults ordena resultados por coincidencia en título, contenido y updatedAt
func (s *SearchService) sortResults(results []models.UnifiedSearchResult, query string) {
	if len(results) == 0 {
		return
	}
	q := strings.ToLower(strings.TrimSpace(query))
	sort.SliceStable(results, func(i, j int) bool {
		ri := results[i]
		rj := results[j]

		// Priorizar coincidencias de título
		it := strings.Contains(strings.ToLower(ri.Title), q)
		jt := strings.Contains(strings.ToLower(rj.Title), q)
		if it != jt {
			return it
		}

		// Luego coincidencias de contenido
		ic := strings.Contains(strings.ToLower(ri.Content), q)
		jc := strings.Contains(strings.ToLower(rj.Content), q)
		if ic != jc {
			return ic
		}

		// Finalmente por fecha de actualización
		return ri.UpdatedAt.After(rj.UpdatedAt)
	})
}

// UnifiedSearchCached aplica Cache-Aside con Redis si está configurado
func (s *SearchService) UnifiedSearchCached(ctx context.Context, req SearchRequest) (*models.UnifiedSearchResponse, error) {
    if s.cache == nil {
        return s.UnifiedSearch(ctx, req)
    }

    key := s.buildCacheKey(req)
    // Intentar obtener de caché
    val, err := s.cache.Get(ctx, key).Result()
    if err == nil && val != "" {
        var resp models.UnifiedSearchResponse
        if jsonErr := json.Unmarshal([]byte(val), &resp); jsonErr == nil {
            if s.cacheHits != nil {
                src, _ := ctx.Value("cache_source").(string)
                if src == "" { src = "core" }
                s.cacheHits.WithLabelValues(src).Inc()
            }
            return &resp, nil
        }
        // Si falla parseo, continuar como miss
    }

    if s.cacheMiss != nil {
        src, _ := ctx.Value("cache_source").(string)
        if src == "" { src = "core" }
        s.cacheMiss.WithLabelValues(src).Inc()
    }

    // Obtener datos frescos
    resp, err := s.UnifiedSearch(ctx, req)
    if err != nil {
        return nil, err
    }

    // Guardar en caché
    if b, mErr := json.Marshal(resp); mErr == nil {
        _ = s.cache.Set(ctx, key, string(b), s.cacheTTL).Err()
    }
    return resp, nil
}

// InvalidateUserCache invalida todas las claves de caché para un usuario
func (s *SearchService) InvalidateUserCache(ctx context.Context, userID int32) {
    if s.cache == nil || userID <= 0 {
        return
    }
    pattern := fmt.Sprintf("search:%d:*", userID)
    var cursor uint64
    for {
        keys, cur, err := s.cache.Scan(ctx, cursor, pattern, 100).Result()
        if err != nil {
            return
        }
        if len(keys) > 0 {
            _ = s.cache.Del(ctx, keys...).Err()
        }
        cursor = cur
        if cursor == 0 {
            break
        }
    }
}

func (s *SearchService) buildCacheKey(req SearchRequest) string {
    // Estructura estable para hashing
    payload := struct {
        Q string   `json:"q"`
        C string   `json:"c"`
        T []string `json:"t"`
        L int32    `json:"l"`
        S int32    `json:"s"`
    }{Q: strings.TrimSpace(req.Query), C: strings.TrimSpace(req.Category), T: append([]string{}, req.Tags...), L: req.Limit, S: req.Skip}
    // Ordenar tags para determinismo
    sort.Strings(payload.T)
    b, _ := json.Marshal(payload)
    h := sha1.Sum(b)
    return fmt.Sprintf("search:%d:%s", req.UserID, hex.EncodeToString(h[:]))
}