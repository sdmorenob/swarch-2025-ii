package handlers

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"

	"RetoFit-App/services/physical_activities_service/internal/app/rest_api/grpc"
	"RetoFit-App/services/physical_activities_service/internal/app/rest_api/models/dtos"
	"RetoFit-App/services/physical_activities_service/internal/app/rest_api/services"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"

	"github.com/rs/zerolog/log"
)

type Activity struct {
	ActivityService *services.Activity
	UserClient      *grpc.UserClient
}

func NewActivityHandler(activityService *services.Activity, userClient *grpc.UserClient) *Activity {
	return &Activity{
		ActivityService: activityService,
		UserClient:      userClient,
	}
}

// Health endpoint para verificar que el servicio esta funcionando
func (h *Activity) Health(ctx *gin.Context) {
	ctx.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"service": "physical-activities-service",
		"message": "Service is running",
	})
}

func (h *Activity) GetAllActivitiesByUser(ctx *gin.Context) {
	userId, errId := strconv.Atoi(ctx.Param("id"))

	if errId != nil {
		ctx.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "User ID not valid"})

		return
	}

	resp, errRGCP := h.UserClient.GetUserByID(ctx, int32(userId))
	if errRGCP != nil {
		log.Error().
			Err(errRGCP).
			Msg("Error al obtener usuario por gRPC")
		ctx.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("User %d not found in Python service", userId)})
		return
	}

	fmt.Printf("✅ Usuario recibido de Python: %+v\n", resp)
	log.Info().Msg("✅ Usuario recibido de Python")

	allActivities, err := h.ActivityService.GetAllActivitiesByUser(userId)
	fmt.Println("Obteniendo las actividades para el usuario ID:", allActivities)
	log.Info().Msg("Obteniendo las actividades para el usuario")

	if err != nil {
		fmt.Println("Error al obtener las actividades:", err)
		// Si no es un ErrorResponse, responder con genérico
		ctx.AbortWithStatusJSON(err.Code, gin.H{"error": err.Message})
		return
	}
	fmt.Println("Status: $1", allActivities)
	ctx.JSON(http.StatusOK, allActivities)
}

func (h *Activity) GetActivity(ctx *gin.Context) {
	activityID, err := strconv.Atoi(ctx.Param("id_activty"))
	userID, errUser := strconv.Atoi(ctx.Param("id"))

	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Activity ID not valid"})

		return
	}

	if errUser != nil {
		ctx.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "User ID not valid"})

		return
	}

	Activity, ActivityErr := h.ActivityService.GetActivity(userID, activityID)
	if ActivityErr != nil {
		ctx.AbortWithStatusJSON(ActivityErr.Code, ActivityErr)

		return
	}

	ctx.JSON(http.StatusOK, Activity)
}

func (h *Activity) DeleteActivity(ctx *gin.Context) {
	activityID, err := strconv.Atoi(ctx.Param("id_activity"))
	userID, errUser := strconv.Atoi(ctx.Param("id"))

	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Activity ID not valid"})

		return
	}

	if errUser != nil {
		ctx.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Activity ID not valid"})

		return
	}

	deleteError := h.ActivityService.DeleteActivity(userID, activityID)
	if deleteError != nil {
		ctx.AbortWithStatusJSON(deleteError.Code, deleteError)

		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Activity deleted"})
}

func (h *Activity) CreateActivity(ctx *gin.Context) {
	var createActivityRequest dtos.CreateActivityRequest

	userId, errId := strconv.Atoi(ctx.Param("id"))

	if errId != nil {
		ctx.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "User ID not valid"})
		fmt.Println("Errrrrooooooorrr: id de usuario no válido.")

		return
	}

	if err := ctx.ShouldBindJSON(&createActivityRequest); err != nil {
		fmt.Println("Errrrrooooooorrr: should bind json falló.")
		var ve validator.ValidationErrors
		if errors.As(err, &ve) {
			out := make(map[string]string)
			for _, fe := range ve {
				out[fe.Field()] = msgForTag(fe)
			}
			ctx.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"errors": out})

			fmt.Println("Errrrrooooooorrr: validation errors found.")
			return
		}
		ctx.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": err.Error()})

		fmt.Println("Errrrrooooooorrr: other error on binding JSON.")
		return
	}

	createActivityResponse, signupError := h.ActivityService.CreateActivity(userId, &createActivityRequest)
	if signupError != nil {
		fmt.Println("Errrrrooooooorrr: error al crear la actividad.")
		ctx.AbortWithStatusJSON(signupError.Code, signupError)

		return
	}

	ctx.JSON(http.StatusCreated, createActivityResponse)
}

func (h *Activity) UpdateActivity(ctx *gin.Context) {
	ActivityID, err := strconv.Atoi(ctx.Param("id_activity"))
	UserID, errUser := strconv.Atoi(ctx.Param("id"))

	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Activity ID not valid"})

		return
	}

	if errUser != nil {
		ctx.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "User ID not valid"})

		return
	}

	var updateActivityRequest dtos.UpdateActivityRequest

	if err := ctx.ShouldBindJSON(&updateActivityRequest); err != nil {
		var ve validator.ValidationErrors
		if errors.As(err, &ve) {
			out := make(map[string]string)
			for _, fe := range ve {
				out[fe.Field()] = msgForTag(fe)
			}
			ctx.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"errors": out})

			return
		}
		ctx.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": err.Error()})

		return
	}

	updateError := h.ActivityService.UpdateActivity(UserID, ActivityID, &updateActivityRequest)
	if updateError != nil {
		ctx.AbortWithStatusJSON(updateError.Code, updateError)

		return
	}

	ctx.JSON(http.StatusNoContent, gin.H{"message": "Activity updated"})
}

func msgForTag(fe validator.FieldError) string {
	switch fe.Tag() {
	case "required":
		return "This field is required"
	case "min":
		return fmt.Sprintf("Minimum length is %s", fe.Param())
	case "custom_password":
		return "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character"
	default:
		return "Invalid value"
	}
}
