package dtos

import (
	"RetoFit-App/services/physical_activities_service/internal/app/rest_api/entities"
	"time"
)

type ActivityResponse struct {
	IdActividad int       `json:"id_actividad"`
	Tipo        string    `json:"tipo"`
	DistanciaKm float32   `json:"distancia_km"`
	DuracionMin int       `json:"duracion_min"`
	Fecha       time.Time `json:"fecha"`
	IdUsuaio    int       `json:"id_usuario"`
}

type GetAllActivitiesResponse struct {
	Activities []*ActivityResponse `json:"activities"`
}

type CreateActivityRequest struct {
	Tipo        string    `json:"tipo" binding:"required,min=3"`
	DistanciaKm float32   `json:"distancia_km" binding:"required,min=0"`
	DuracionMin int       `json:"duracion_min" binding:"required,min=0"`
	Fecha       time.Time `json:"fecha"`
	IdUsuaio    int       `json:"id_usuario"`
}

type UpdateActivityRequest struct {
	IdActividad int       `json:"id_actividad"`
	Tipo        string    `json:"tipo" binding:"required,min=3"`
	DistanciaKm float32   `json:"distancia_km" binding:"required,min=0"`
	DuracionMin int       `json:"duracion_min" binding:"required,min=0"`
	Fecha       time.Time `json:"fecha"`
}

type CreateActivityResponse struct {
	Tipo        string    `json:"tipo"`
	DistanciaKm float32   `json:"distancia_km"`
	DuracionMin int       `json:"duracion_min"`
	Fecha       time.Time `json:"fecha"`
	Message     string    `json:"message" binding:"required"`
}

func (r *GetAllActivitiesResponse) MapActivitiesResponse(Activities []*entities.Activity) {
	for _, Activities := range Activities {
		Activity := &ActivityResponse{
			IdActividad: Activities.IdActividad,
			Tipo:        Activities.Tipo,
			DistanciaKm: Activities.DistanciaKm,
			DuracionMin: Activities.DuracionMin,
			Fecha:       Activities.Fecha,
			IdUsuaio:    Activities.IdUsuaio,
		}
		r.Activities = append(r.Activities, Activity)
	}
}

func (r *ActivityResponse) MapActivityResponse(Activity *entities.Activity) {
	r.IdActividad = Activity.IdActividad
	r.Tipo = Activity.Tipo
	r.DistanciaKm = Activity.DistanciaKm
	r.DuracionMin = Activity.DuracionMin
	r.Fecha = Activity.Fecha
	r.IdUsuaio = Activity.IdUsuaio
}

func (ur *CreateActivityRequest) ToActivity() *entities.Activity {
	return &entities.Activity{
		Tipo:        ur.Tipo,
		DistanciaKm: ur.DistanciaKm,
		DuracionMin: ur.DuracionMin,
		Fecha:       ur.Fecha,
		IdUsuaio:    ur.IdUsuaio,
	}
}

func (ur *UpdateActivityRequest) ToActivity() *entities.Activity {
	return &entities.Activity{
		IdActividad: ur.IdActividad,
		Tipo:        ur.Tipo,
		DistanciaKm: ur.DistanciaKm,
		DuracionMin: ur.DuracionMin,
		Fecha:       ur.Fecha,
	}
}

func (ur *CreateActivityResponse) FromActivity(Activity *entities.Activity) *CreateActivityResponse {
	return &CreateActivityResponse{
		Tipo:        ur.Tipo,
		DistanciaKm: ur.DistanciaKm,
		DuracionMin: ur.DuracionMin,
		Fecha:       ur.Fecha,
		Message:     "Activity created successfully.",
	}
}
