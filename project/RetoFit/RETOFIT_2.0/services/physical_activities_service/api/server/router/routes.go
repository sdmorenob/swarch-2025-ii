package router

import (
	"RetoFit-App/services/physical_activities_service/internal/app/rest_api/handlers"

	"github.com/gin-gonic/gin"
)

// V--- AQUÍ ESTÁ EL CAMBIO: de handlers.User a handlers.UserHandler ---V
func RegisterPublicEndpoints(router *gin.Engine, activityHandlers *handlers.Activity) {
	// Health check endpoint
	router.GET("/activities/health", activityHandlers.Health)

	// Rutas existentes para Actividades Físicas
	router.GET("/activities/users/:id/activities", activityHandlers.GetAllActivitiesByUser)
	router.GET("/activities/user/:id/activity/:id_activty", activityHandlers.GetActivity)
	router.POST("/activities/users/:id/activities", activityHandlers.CreateActivity)
	router.PUT("/activities/user/:id/update/:id_activity", activityHandlers.UpdateActivity)
	router.DELETE("/activities/user/:id/delete/:id_activity", activityHandlers.DeleteActivity)

	// Nueva ruta para sincronizar/crear usuarios
	// router.POST("/users", userHandlers.CreateUser)
}
