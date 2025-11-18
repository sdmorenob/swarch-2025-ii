package rest

import (
	"net/http"
	"strconv"
	"strings"

	"musicservice/internal/models"
	"musicservice/internal/services"
	"musicservice/pkg/utils"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type TrackHandler struct {
	trackService *services.TrackService
	validator    *validator.Validate
}

func NewTrackHandler(trackService *services.TrackService) *TrackHandler {
	return &TrackHandler{
		trackService: trackService,
		validator:    validator.New(),
	}
}

// UploadTrack godoc
// @Summary Upload audio track
// @Description Upload an audio file to the service. Supports MP3, WAV, FLAC, M4A, OGG, AAC formats
// @Tags tracks
// @Accept multipart/form-data
// @Produce json
// @Param file formData file true "Audio file"
// @Param user_id formData string true "User ID"
// @Param tags formData string false "Comma-separated tags (e.g., rock,classic)"
// @Param is_public formData bool false "Whether the track is public"
// @Success 201 {object} SuccessResponse{data=models.Track} "Track uploaded successfully"
// @Failure 400 {object} ErrorResponse "Invalid request"
// @Failure 413 {object} ErrorResponse "File too large"
// @Failure 415 {object} ErrorResponse "Unsupported file type"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /tracks/upload [post]
func (h *TrackHandler) UploadTrack(c *gin.Context) {
	// Parse multipart form
	if err := c.Request.ParseMultipartForm(50 << 20); err != nil { // 50MB max
		utils.ErrorResponse(c, http.StatusBadRequest, "Failed to parse multipart form")
		return
	}

	// Get file from form
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "No file provided")
		return
	}
	defer file.Close()

	// Parse request data
	var req models.TrackUploadRequest
	if err := c.ShouldBind(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request data")
		return
	}

	// Validate request
	if err := h.validator.Struct(req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Validation failed: "+err.Error())
		return
	}

	// Parse tags if provided
	if tagsStr := c.PostForm("tags"); tagsStr != "" {
		req.Tags = strings.Split(tagsStr, ",")
		for i, tag := range req.Tags {
			req.Tags[i] = strings.TrimSpace(tag)
		}
	}

	// Parse is_public
	if isPublicStr := c.PostForm("is_public"); isPublicStr != "" {
		req.IsPublic = isPublicStr == "true"
	}

	// Upload track
	track, err := h.trackService.UploadTrack(c.Request.Context(), file, header, req)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, track, "Track uploaded successfully")
}

// GetTrack godoc
// @Summary Get track details
// @Description Retrieve information about a specific track by ID
// @Tags tracks
// @Produce json
// @Param id path string true "Track ID"
// @Success 200 {object} SuccessResponse{data=models.Track} "Track retrieved successfully"
// @Failure 400 {object} ErrorResponse "Invalid track ID"
// @Failure 404 {object} ErrorResponse "Track not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /tracks/{id} [get]
func (h *TrackHandler) GetTrack(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Track ID is required")
		return
	}

	track, err := h.trackService.GetTrack(c.Request.Context(), id)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			utils.ErrorResponse(c, http.StatusNotFound, "Track not found")
			return
		}
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, track, "Track retrieved successfully")
}

// ListTracks godoc
// @Summary List tracks
// @Description List tracks with optional filtering and pagination
// @Tags tracks
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20) maximum(100)
// @Param user_id query string false "Filter by user ID"
// @Param genre query string false "Filter by genre"
// @Param artist query string false "Filter by artist name"
// @Param is_public query bool false "Filter by public/private"
// @Param search query string false "Search in title, artist, album, or tags"
// @Success 200 {object} SuccessResponse{data=TrackListResponse} "Tracks retrieved successfully"
// @Failure 400 {object} ErrorResponse "Invalid query parameters"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /tracks [get]
func (h *TrackHandler) ListTracks(c *gin.Context) {
	var filter models.TrackFilter

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

	tracks, total, err := h.trackService.ListTracks(c.Request.Context(), filter)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	// Calculate pagination info
	totalPages := (total + int64(filter.Limit) - 1) / int64(filter.Limit)

	response := gin.H{
		"tracks": tracks,
		"pagination": gin.H{
			"current_page": filter.Page,
			"per_page":     filter.Limit,
			"total_pages":  totalPages,
			"total_items":  total,
			"has_next":     filter.Page < int(totalPages),
			"has_prev":     filter.Page > 1,
		},
	}

	utils.SuccessResponse(c, http.StatusOK, response, "Tracks retrieved successfully")
}

// DeleteTrack godoc
// @Summary Delete track
// @Description Delete a track (only the owner can delete)
// @Tags tracks
// @Produce json
// @Param id path string true "Track ID"
// @Param user_id query string true "User ID for authorization"
// @Success 200 {object} SuccessResponse "Track deleted successfully"
// @Failure 400 {object} ErrorResponse "Invalid request"
// @Failure 403 {object} ErrorResponse "Unauthorized"
// @Failure 404 {object} ErrorResponse "Track not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /tracks/{id} [delete]
func (h *TrackHandler) DeleteTrack(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
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

	err := h.trackService.DeleteTrack(c.Request.Context(), id, userID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			utils.ErrorResponse(c, http.StatusNotFound, "Track not found")
			return
		}
		if strings.Contains(err.Error(), "unauthorized") {
			utils.ErrorResponse(c, http.StatusForbidden, "Unauthorized")
			return
		}
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, nil, "Track deleted successfully")
}

// StreamTrack godoc
// @Summary Stream audio track
// @Description Stream audio file for playback. Redirects to the file URL
// @Tags tracks
// @Produce audio/mpeg,audio/wav,audio/flac
// @Param id path string true "Track ID"
// @Success 307 "Redirects to audio file"
// @Failure 400 {object} ErrorResponse "Invalid track ID"
// @Failure 403 {object} ErrorResponse "Track is private"
// @Failure 404 {object} ErrorResponse "Track not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /tracks/{id}/stream [get]
func (h *TrackHandler) StreamTrack(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Track ID is required")
		return
	}

	track, err := h.trackService.GetTrackStream(c.Request.Context(), id)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			utils.ErrorResponse(c, http.StatusNotFound, "Track not found")
			return
		}
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	// Check if track is public or user owns it
	userID := c.GetString("user_id")
	if !track.IsPublic && track.UserID != userID {
		utils.ErrorResponse(c, http.StatusForbidden, "Track is private")
		return
	}

	// Serve the file directly
	c.Header("Content-Type", track.MimeType)
	c.Header("Content-Length", strconv.FormatInt(track.FileSize, 10))
	c.Header("Accept-Ranges", "bytes")

	// For MVP, redirect to file URL
	c.Redirect(http.StatusTemporaryRedirect, track.FileURL)
}
