package rest

import (
	"context"
	"net/http"
	"strconv"
	"strings"
	"time"

	"musicservice/pkg/logger"
	"musicservice/pkg/utils"

	"github.com/gin-gonic/gin"
)

// RequestLoggingMiddleware logs HTTP requests
func RequestLoggingMiddleware() gin.HandlerFunc {
	return gin.LoggerWithConfig(gin.LoggerConfig{
		Formatter: func(param gin.LogFormatterParams) string {
			logger.Infof("[%s] %s %s %d %s %s",
				param.TimeStamp.Format("2006/01/02 15:04:05"),
				param.Method,
				param.Path,
				param.StatusCode,
				param.Latency,
				param.ClientIP,
			)
			return ""
		},
	})
}

// ErrorHandlingMiddleware handles panics and errors
func ErrorHandlingMiddleware() gin.HandlerFunc {
	return gin.RecoveryWithWriter(gin.DefaultWriter, func(c *gin.Context, recovered interface{}) {
		if err, ok := recovered.(string); ok {
			logger.Errorf("Panic recovered: %s", err)
			utils.ErrorResponse(c, http.StatusInternalServerError, "Internal server error")
		}
		c.AbortWithStatus(http.StatusInternalServerError)
	})
}

// FileSizeLimitMiddleware limits the size of uploaded files
func FileSizeLimitMiddleware(maxSize int64) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method == "POST" || c.Request.Method == "PUT" {
			// Check Content-Length header
			if contentLength := c.Request.Header.Get("Content-Length"); contentLength != "" {
				if size, err := strconv.ParseInt(contentLength, 10, 64); err == nil {
					if size > maxSize {
						utils.ErrorResponse(c, http.StatusRequestEntityTooLarge,
							"Request body too large. Maximum size: "+utils.FormatFileSize(maxSize))
						c.Abort()
						return
					}
				}
			}

			// Set max bytes for request body
			c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxSize)
		}

		c.Next()
	}
}

// TimeoutMiddleware sets a timeout for requests
func TimeoutMiddleware(timeout time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Set timeout in context
		ctx := c.Request.Context()
		ctx, cancel := context.WithTimeout(ctx, timeout)
		defer cancel()

		c.Request = c.Request.WithContext(ctx)
		c.Next()
	}
}

// ContentTypeMiddleware validates content type for certain endpoints
func ContentTypeMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// For upload endpoints, ensure multipart/form-data
		if c.Request.Method == "POST" && c.FullPath() == "/api/v1/tracks/upload" {
			contentType := c.GetHeader("Content-Type")
			if !strings.Contains(contentType, "multipart/form-data") {
				utils.ErrorResponse(c, http.StatusUnsupportedMediaType,
					"Content-Type must be multipart/form-data for file uploads")
				c.Abort()
				return
			}
		}

		// For JSON endpoints, ensure application/json
		if c.Request.Method == "POST" || c.Request.Method == "PUT" {
			if strings.Contains(c.FullPath(), "/playlists") && !strings.Contains(c.FullPath(), "/tracks") {
				contentType := c.GetHeader("Content-Type")
				if !strings.Contains(contentType, "application/json") {
					utils.ErrorResponse(c, http.StatusUnsupportedMediaType,
						"Content-Type must be application/json")
					c.Abort()
					return
				}
			}
		}

		c.Next()
	}
}

// CORSMiddleware handles CORS headers (already using gin-contrib/cors in main.go, but here's a custom version)
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

// RateLimitingMiddleware implements basic rate limiting (simple in-memory version)
func RateLimitingMiddleware(requestsPerMinute int) gin.HandlerFunc {
	// Simple in-memory rate limiter (not suitable for production with multiple instances)
	clients := make(map[string][]time.Time)

	return func(c *gin.Context) {
		clientIP := c.ClientIP()
		now := time.Now()

		// Clean old entries
		if requests, exists := clients[clientIP]; exists {
			validRequests := []time.Time{}
			for _, requestTime := range requests {
				if now.Sub(requestTime) < time.Minute {
					validRequests = append(validRequests, requestTime)
				}
			}
			clients[clientIP] = validRequests
		}

		// Check rate limit
		if len(clients[clientIP]) >= requestsPerMinute {
			utils.ErrorResponse(c, http.StatusTooManyRequests, "Rate limit exceeded")
			c.Abort()
			return
		}

		// Add current request
		clients[clientIP] = append(clients[clientIP], now)

		c.Next()
	}
}
