package rest

import (
	"net/http"
	"strings"

	"musicservice/internal/models"
	"musicservice/internal/services"
	"musicservice/pkg/logger"
	"musicservice/pkg/utils"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type PlaylistHandler struct {
	playlistService *services.PlaylistService
	validator       *validator.Validate
}

func NewPlaylistHandler(playlistService *services.PlaylistService) *PlaylistHandler {
	return &PlaylistHandler{
		playlistService: playlistService,
		validator:       validator.New(),
	}
}

// CreatePlaylist godoc
// @Summary Create playlist
// @Description Create a new playlist
// @Tags playlists
// @Accept json
// @Produce json
// @Param playlist body models.CreatePlaylistRequest true "Playlist information"
// @Success 201 {object} SuccessResponse{data=models.Playlist} "Playlist created successfully"
// @Failure 400 {object} ErrorResponse "Invalid request"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /playlists [post]
func (h *PlaylistHandler) CreatePlaylist(c *gin.Context) {
	logger.Infof("CreatePlaylist handler called - Method: %s, Path: %s", c.Request.Method, c.Request.URL.Path)

	var req models.CreatePlaylistRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Errorf("Failed to bind JSON: %v", err)
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request body")
		return
	}

	logger.Infof("Parsed request: %+v", req)

	// Validate request
	if err := h.validator.Struct(req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Validation failed: "+err.Error())
		return
	}

	// Create playlist
	playlist, err := h.playlistService.CreatePlaylist(c.Request.Context(), req)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, playlist, "Playlist created successfully")
}

// GetPlaylist godoc
// @Summary Get playlist details
// @Description Retrieve playlist information. Use include_tracks=true to get full track information
// @Tags playlists
// @Produce json
// @Param id path string true "Playlist ID"
// @Param include_tracks query bool false "Include full track information"
// @Success 200 {object} SuccessResponse{data=models.Playlist} "Playlist retrieved successfully"
// @Failure 400 {object} ErrorResponse "Invalid playlist ID"
// @Failure 404 {object} ErrorResponse "Playlist not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /playlists/{id} [get]
func (h *PlaylistHandler) GetPlaylist(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Playlist ID is required")
		return
	}

	// Check if client wants full playlist with tracks
	includeTracks := c.Query("include_tracks") == "true"

	if includeTracks {
		playlistWithTracks, err := h.playlistService.GetPlaylistWithTracks(c.Request.Context(), id)
		if err != nil {
			if strings.Contains(err.Error(), "not found") {
				utils.ErrorResponse(c, http.StatusNotFound, "Playlist not found")
				return
			}
			utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
			return
		}

		utils.SuccessResponse(c, http.StatusOK, playlistWithTracks, "Playlist with tracks retrieved successfully")
		return
	}

	playlist, err := h.playlistService.GetPlaylist(c.Request.Context(), id)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			utils.ErrorResponse(c, http.StatusNotFound, "Playlist not found")
			return
		}
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, playlist, "Playlist retrieved successfully")
}

// ListPlaylists godoc
// @Summary List playlists
// @Description List playlists with optional filtering and pagination
// @Tags playlists
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20) maximum(100)
// @Param creator_id query string false "Filter by creator ID"
// @Param is_public query bool false "Filter by public/private"
// @Param search query string false "Search in name or description"
// @Success 200 {object} SuccessResponse{data=PlaylistListResponse} "Playlists retrieved successfully"
// @Failure 400 {object} ErrorResponse "Invalid query parameters"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /playlists [get]
func (h *PlaylistHandler) ListPlaylists(c *gin.Context) {
	logger.Infof("ListPlaylists called - Query params: %v", c.Request.URL.RawQuery)

	var filter models.PlaylistFilter

	// Bind query parameters
	if err := c.ShouldBindQuery(&filter); err != nil {
		logger.Errorf("Failed to bind query: %v", err)
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid query parameters")
		return
	}

	logger.Infof("Filter parsed: %+v", filter)

	// Set defaults
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.Limit <= 0 {
		filter.Limit = 20
	}
	if filter.Limit > 100 {
		filter.Limit = 100
	}

	logger.Infof("Filter after defaults: %+v", filter)

	playlists, total, err := h.playlistService.ListPlaylists(c.Request.Context(), filter)

	logger.Infof("Repository returned: playlists=%d, total=%d, err=%v", len(playlists), total, err)

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	// Calculate pagination info
	totalPages := (total + int64(filter.Limit) - 1) / int64(filter.Limit)

	response := gin.H{
		"playlists": playlists,
		"pagination": gin.H{
			"current_page": filter.Page,
			"per_page":     filter.Limit,
			"total_pages":  totalPages,
			"total_items":  total,
			"has_next":     filter.Page < int(totalPages),
			"has_prev":     filter.Page > 1,
		},
	}

	utils.SuccessResponse(c, http.StatusOK, response, "Playlists retrieved successfully")
}

// UpdatePlaylist godoc
// @Summary Update playlist
// @Description Update playlist information (only creator or collaborators can update)
// @Tags playlists
// @Accept json
// @Produce json
// @Param id path string true "Playlist ID"
// @Param user_id query string true "User ID for authorization"
// @Param playlist body models.UpdatePlaylistRequest true "Updated playlist information"
// @Success 200 {object} SuccessResponse{data=models.Playlist} "Playlist updated successfully"
// @Failure 400 {object} ErrorResponse "Invalid request"
// @Failure 403 {object} ErrorResponse "Unauthorized"
// @Failure 404 {object} ErrorResponse "Playlist not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /playlists/{id} [put]
func (h *PlaylistHandler) UpdatePlaylist(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Playlist ID is required")
		return
	}

	var req models.UpdatePlaylistRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Get user ID from context (would be set by auth middleware)
	userID := c.GetString("user_id")
	if userID == "" {
		// For MVP, accept user_id from query parameter
		userID = c.Query("user_id")
		if userID == "" {
			utils.ErrorResponse(c, http.StatusBadRequest, "User ID is required")
			return
		}
	}

	// Update playlist
	playlist, err := h.playlistService.UpdatePlaylist(c.Request.Context(), id, req, userID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			utils.ErrorResponse(c, http.StatusNotFound, "Playlist not found")
			return
		}
		if strings.Contains(err.Error(), "unauthorized") {
			utils.ErrorResponse(c, http.StatusForbidden, "Unauthorized")
			return
		}
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, playlist, "Playlist updated successfully")
}

// DeletePlaylist godoc
// @Summary Delete playlist
// @Description Delete a playlist (only creator can delete)
// @Tags playlists
// @Produce json
// @Param id path string true "Playlist ID"
// @Param user_id query string true "User ID for authorization"
// @Success 200 {object} SuccessResponse "Playlist deleted successfully"
// @Failure 400 {object} ErrorResponse "Invalid request"
// @Failure 403 {object} ErrorResponse "Unauthorized"
// @Failure 404 {object} ErrorResponse "Playlist not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /playlists/{id} [delete]
func (h *PlaylistHandler) DeletePlaylist(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Playlist ID is required")
		return
	}

	// Get user ID from context (would be set by auth middleware)
	userID := c.GetString("user_id")
	if userID == "" {
		// For MVP, accept user_id from query parameter
		userID = c.Query("user_id")
		if userID == "" {
			utils.ErrorResponse(c, http.StatusBadRequest, "User ID is required")
			return
		}
	}

	err := h.playlistService.DeletePlaylist(c.Request.Context(), id, userID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			utils.ErrorResponse(c, http.StatusNotFound, "Playlist not found")
			return
		}
		if strings.Contains(err.Error(), "unauthorized") {
			utils.ErrorResponse(c, http.StatusForbidden, "Unauthorized")
			return
		}
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, nil, "Playlist deleted successfully")
}

// AddTrackToPlaylist godoc
// @Summary Add track to playlist
// @Description Add a track to a playlist
// @Tags playlists
// @Accept json
// @Produce json
// @Param id path string true "Playlist ID"
// @Param user_id query string true "User ID for authorization"
// @Param request body models.AddTrackToPlaylistRequest true "Track to add"
// @Success 200 {object} SuccessResponse{data=models.Playlist} "Track added successfully"
// @Failure 400 {object} ErrorResponse "Invalid request"
// @Failure 403 {object} ErrorResponse "Unauthorized"
// @Failure 404 {object} ErrorResponse "Playlist or track not found"
// @Failure 409 {object} ErrorResponse "Track already in playlist"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /playlists/{id}/tracks [post]
func (h *PlaylistHandler) AddTrackToPlaylist(c *gin.Context) {
	playlistID := c.Param("id")
	if playlistID == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Playlist ID is required")
		return
	}

	var req models.AddTrackToPlaylistRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate request
	if err := h.validator.Struct(req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Validation failed: "+err.Error())
		return
	}

	// Get user ID from context (would be set by auth middleware)
	userID := c.GetString("user_id")
	if userID == "" {
		// For MVP, accept user_id from query parameter or body
		userID = c.Query("user_id")
		if userID == "" {
			utils.ErrorResponse(c, http.StatusBadRequest, "User ID is required")
			return
		}
	}

	// Add track to playlist
	playlist, err := h.playlistService.AddTrackToPlaylist(c.Request.Context(), playlistID, req.TrackID, userID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			utils.ErrorResponse(c, http.StatusNotFound, err.Error())
			return
		}
		if strings.Contains(err.Error(), "unauthorized") {
			utils.ErrorResponse(c, http.StatusForbidden, err.Error())
			return
		}
		if strings.Contains(err.Error(), "already in the playlist") {
			utils.ErrorResponse(c, http.StatusConflict, err.Error())
			return
		}
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, playlist, "Track added to playlist successfully")
}

// RemoveTrackFromPlaylist godoc
// @Summary Remove track from playlist
// @Description Remove a track from a playlist
// @Tags playlists
// @Produce json
// @Param id path string true "Playlist ID"
// @Param trackId path string true "Track ID"
// @Param user_id query string true "User ID for authorization"
// @Success 200 {object} SuccessResponse{data=models.Playlist} "Track removed successfully"
// @Failure 400 {object} ErrorResponse "Invalid request"
// @Failure 403 {object} ErrorResponse "Unauthorized"
// @Failure 404 {object} ErrorResponse "Playlist or track not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /playlists/{id}/tracks/{trackId} [delete]
func (h *PlaylistHandler) RemoveTrackFromPlaylist(c *gin.Context) {
	playlistID := c.Param("id")
	if playlistID == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Playlist ID is required")
		return
	}

	trackID := c.Param("trackId")
	if trackID == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Track ID is required")
		return
	}

	// Get user ID from context (would be set by auth middleware)
	userID := c.GetString("user_id")
	if userID == "" {
		// For MVP, accept user_id from query parameter
		userID = c.Query("user_id")
		if userID == "" {
			utils.ErrorResponse(c, http.StatusBadRequest, "User ID is required")
			return
		}
	}

	// Remove track from playlist
	playlist, err := h.playlistService.RemoveTrackFromPlaylist(c.Request.Context(), playlistID, trackID, userID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			utils.ErrorResponse(c, http.StatusNotFound, err.Error())
			return
		}
		if strings.Contains(err.Error(), "unauthorized") {
			utils.ErrorResponse(c, http.StatusForbidden, err.Error())
			return
		}
		if strings.Contains(err.Error(), "not in the playlist") {
			utils.ErrorResponse(c, http.StatusNotFound, err.Error())
			return
		}
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, playlist, "Track removed from playlist successfully")
}

// GetUserPlaylists godoc
// @Summary Get user playlists
// @Description Get all playlists created by a specific user
// @Tags playlists
// @Produce json
// @Param userId path string true "User ID"
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20) maximum(100)
// @Success 200 {object} SuccessResponse{data=PlaylistListResponse} "User playlists retrieved successfully"
// @Failure 400 {object} ErrorResponse "Invalid request"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /users/{userId}/playlists [get]
func (h *PlaylistHandler) GetUserPlaylists(c *gin.Context) {
	userID := c.Param("userId")
	if userID == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "User ID is required")
		return
	}

	var filter models.PaginationQuery

	// Bind query parameters
	if err := c.ShouldBindQuery(&filter); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid query parameters")
		return
	}

	// Set defaults
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.Limit <= 0 {
		filter.Limit = 20
	}
	if filter.Limit > 100 {
		filter.Limit = 100
	}

	playlists, total, err := h.playlistService.GetUserPlaylists(c.Request.Context(), userID, filter)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	// Calculate pagination info
	totalPages := (total + int64(filter.Limit) - 1) / int64(filter.Limit)

	response := gin.H{
		"playlists": playlists,
		"pagination": gin.H{
			"current_page": filter.Page,
			"per_page":     filter.Limit,
			"total_pages":  totalPages,
			"total_items":  total,
			"has_next":     filter.Page < int(totalPages),
			"has_prev":     filter.Page > 1,
		},
	}

	utils.SuccessResponse(c, http.StatusOK, response, "User playlists retrieved successfully")
}
