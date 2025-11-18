package services

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"

	"RetoFit-App/services/physical_activities_service/internal/app/rest_api/models"
	"RetoFit-App/services/physical_activities_service/internal/app/rest_api/models/dtos"
	"RetoFit-App/services/physical_activities_service/internal/app/rest_api/repositories"
)

type Activity struct {
	ActivityRepo *repositories.Activity
}

func NewActivityService(ActivityRepo *repositories.Activity) *Activity {
	return &Activity{ActivityRepo: ActivityRepo}
}

func (us *Activity) GetAllActivitiesByUser(id int) (*dtos.GetAllActivitiesResponse, *models.ErrorResponse) {
	response := &dtos.GetAllActivitiesResponse{}

	queriedActivities, err := us.ActivityRepo.GetAllActivitiesByUser(id)
	if err != nil {
		return nil, &models.ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: "Internal Server Error",
		}
	}

	response.MapActivitiesResponse(queriedActivities)

	return response, nil
}

func (us *Activity) GetActivity(userId int, ActivityID int) (*dtos.ActivityResponse, *models.ErrorResponse) {
	response := &dtos.ActivityResponse{}

	Activity, err := us.ActivityRepo.FindById(userId, ActivityID)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, &models.ErrorResponse{
				Code:    http.StatusNotFound,
				Message: "Activity Not Found",
			}
		}
		return nil, &models.ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: "Internal Server Error",
		}
	}

	response.MapActivityResponse(Activity)

	return response, nil
}

func (us *Activity) DeleteActivity(userId int, ActivityId int) *models.ErrorResponse {
	Activity, err := us.ActivityRepo.FindById(userId, ActivityId)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return &models.ErrorResponse{
				Code:    http.StatusNotFound,
				Message: "Activity not found",
			}
		}
		return &models.ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: "Internal Server Error",
		}
	}
	err = us.ActivityRepo.DeleteActivity(Activity.IdUsuaio, Activity.IdActividad)
	if err != nil {
		return &models.ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: "Internal Server Error",
		}
	}

	return nil
}

func (us *Activity) CreateActivity(userId int, createActivityRequest *dtos.CreateActivityRequest) (*dtos.CreateActivityResponse, *models.ErrorResponse) {
	activityResponse := &dtos.CreateActivityResponse{}

	activity := createActivityRequest.ToActivity()
	activity.IdUsuaio = userId

	fmt.Println("CreateActivtyRequest: $1, idUser: $2", activity, userId)

	err := us.ActivityRepo.Create(activity)
	if err != nil {
		fmt.Println("Errrrrooooooorrr: al crear la actividad en el repositorio.")
		return nil, &models.ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: "Failed to create Activity",
		}
	}

	go func(act *dtos.CreateActivityRequest, uId int) {
		// Preparamos el cuerpo de la petición para el gamification-service
		gamificationRequest := map[string]interface{}{
			"user_id":      uId,
			"tipo":         act.Tipo,
			"distancia_km": act.DistanciaKm,
			"duracion_min": act.DuracionMin,
			"fecha":        act.Fecha,
		}
		jsonData, err := json.Marshal(gamificationRequest)
		if err != nil {
			fmt.Println("Errrrrooooooorrr: al crear el JSON para el servicio de gamificación.")
			log.Printf("Error creating JSON for gamification service: %v", err)
			return
		}

		// URL del servicio de gamificación (¡debería ser una variable de entorno!)
		gamificationURL := "http://gamification-service:8003/gamification/process-activity"
		resp, err := http.Post(gamificationURL, "application/json", bytes.NewBuffer(jsonData))
		if err != nil {
			log.Printf("Error calling gamification service: %v", err)
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			log.Printf("Gamification service returned a non-OK status: %s", resp.Status)
		} else {
			log.Printf("Successfully notified gamification service for user %d", uId)
		}
	}(createActivityRequest, userId)

	return activityResponse.FromActivity(activity), nil
}

func (us *Activity) UpdateActivity(userID int, ActivityID int, updateActivityRequest *dtos.UpdateActivityRequest) *models.ErrorResponse {
	existingActivity, err := us.ActivityRepo.FindById(userID, ActivityID)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return &models.ErrorResponse{
				Code:    http.StatusNotFound,
				Message: "Activity not found",
			}
		}
		return &models.ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: "Internal Server Error",
		}
	}

	existingActivity = updateActivityRequest.ToActivity()
	existingActivity.IdActividad = ActivityID
	existingActivity.IdUsuaio = userID

	err = us.ActivityRepo.Update(existingActivity)

	if err != nil {
		return &models.ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: "Failed to update Activity",
		}
	}

	return nil
}
