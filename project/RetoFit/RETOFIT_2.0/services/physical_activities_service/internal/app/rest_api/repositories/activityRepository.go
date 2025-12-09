package repositories

import (
	"RetoFit-App/services/physical_activities_service/internal/app/rest_api/database"
	"RetoFit-App/services/physical_activities_service/internal/app/rest_api/entities"
	"database/sql"
	"fmt"
)

type Activity struct {
	database.BaseSQLRepository[entities.Activity]
}

func NewActivityRepository(db *sql.DB) *Activity {
	return &Activity{
		BaseSQLRepository: database.BaseSQLRepository[entities.Activity]{DB: db},
	}
}

func mapActivity(rows *sql.Row, u *entities.Activity) error {
	return rows.Scan(&u.IdActividad, &u.Tipo, &u.DistanciaKm, &u.DuracionMin, &u.Fecha, &u.IdUsuaio)
}

func mapActivities(rows *sql.Rows, u *entities.Activity) error {
	return rows.Scan(&u.IdActividad, &u.Tipo, &u.DistanciaKm, &u.DuracionMin, &u.Fecha, &u.IdUsuaio)
}

func (r *Activity) FindById(id int, idActivity int) (*entities.Activity, error) {
	return r.SelectSingle(
		mapActivity,
		"SELECT u.id_actividad, u.tipo, u.distancia_km, u.duracion_min, u.fecha, u.id_usuario FROM actividades u WHERE u.id_usuario = $1 AND u.id_actividad = $2",
		id, idActivity,
	)
}

func (r *Activity) GetAllActivitiesByUser(idUsuario int) ([]*entities.Activity, error) {
	return r.SelectMultiple(
		mapActivities,
		"SELECT u.id_actividad, u.tipo, u.distancia_km, u.duracion_min, u.fecha, u.id_usuario FROM actividades u WHERE u.id_usuario = $1",
		idUsuario,
	)
}

func (r *Activity) Create(activity *entities.Activity) error {
	query := "INSERT INTO actividades (tipo, distancia_km, duracion_min, fecha, id_usuario) VALUES ($1, $2, $3, $4, $5) RETURNING id_actividad"

	var insertedID int

	err := r.DB.QueryRow(query, activity.Tipo, activity.DistanciaKm, activity.DuracionMin, activity.Fecha, activity.IdUsuaio).Scan(&insertedID)

	if err != nil {
		fmt.Println("insertedID: $1", insertedID)
		fmt.Println("Query: $1", query)
		fmt.Println("Error: $1", err)
		fmt.Println("Errrrrooooooorrr: al insertar la actividad en la base de datos.")
		return err
	}

	activity.IdActividad = insertedID
	return nil
}

func (r *Activity) Update(activity *entities.Activity) error {
	_, err := r.ExecuteQuery(
		"UPDATE actividades SET tipo = $1, distancia_km = $2, duracion_min = $3, fecha = $4, id_usuario = $5 WHERE id_actividad = $6",
		activity.Tipo, activity.DistanciaKm, activity.DuracionMin, activity.Fecha, activity.IdUsuaio, activity.IdActividad,
	)

	return err
}

func (r *Activity) DeleteActivity(idUser int, idActivity int) error {
	_, err := r.ExecuteQuery("DELETE FROM actividades WHERE id_usuario = $1 AND id_actividad = $2", idUser, idActivity)

	return err
}
