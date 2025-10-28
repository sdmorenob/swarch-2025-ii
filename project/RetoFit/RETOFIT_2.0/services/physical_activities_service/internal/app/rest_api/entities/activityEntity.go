package entities

import "time"

type Activity struct {
	IdActividad int       `json:"id_actividad"`
	Tipo        string    `json:"tipo"`
	DistanciaKm float32   `json:"distancia_km"`
	DuracionMin int       `json:"duracion_min"`
	Fecha       time.Time `json:"fecha"`
	IdUsuaio    int       `json:"id_usuario"`
}
