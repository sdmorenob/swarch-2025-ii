package utils

import (
	"net/http"
	"musicservice/internal/models"

	"github.com/gin-gonic/gin"
)

// SuccessResponse sends a successful JSON response
func SuccessResponse(c *gin.Context, statusCode int, data interface{}, message string) {
	response := models.APIResponse{
		Success: true,
		Data:    data,
		Message: message,
	}
	c.JSON(statusCode, response)
}

// ErrorResponse sends an error JSON response
func ErrorResponse(c *gin.Context, statusCode int, errorMessage string) {
	response := models.APIResponse{
		Success: false,
		Error:   errorMessage,
	}
	c.JSON(statusCode, response)
}

// ValidationErrorResponse sends a validation error response
func ValidationErrorResponse(c *gin.Context, errors map[string]string) {
	response := gin.H{
		"success": false,
		"error":   "Validation failed",
		"details": errors,
	}
	c.JSON(http.StatusBadRequest, response)
}