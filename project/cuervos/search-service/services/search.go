package services

import (
	"context"
	"fmt"
	"sort"
	"strings"

	"search-service/grpc"
	notespb "search-service/grpc/generated/notes"
	"search-service/models"
)

type SearchService struct {
	grpcClients *grpc.GRPCClients
}

// NewSearchService crea una nueva instancia del servicio de búsqueda
func NewSearchService(grpcClients *grpc.GRPCClients) *SearchService {
	return &SearchService{
		grpcClients: grpcClients,
	}
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