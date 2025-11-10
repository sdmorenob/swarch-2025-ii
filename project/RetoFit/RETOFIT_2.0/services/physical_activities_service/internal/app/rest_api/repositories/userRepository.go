package repositories

import "database/sql"

// User representa el repositorio para las operaciones de usuario.
type User struct {
	DB *sql.DB
}

// NewUserRepository crea una nueva instancia del repositorio de usuario.
func NewUserRepository(db *sql.DB) *User {
	return &User{DB: db}
}

// Create inserta un nuevo usuario en la base de datos.
// Solo necesita el ID para crear la referencia.
func (ur *User) Create(userID int) error {
	query := `INSERT INTO usuarios (id_usuario) VALUES ($1)`

	_, err := ur.DB.Exec(query, userID)
	if err != nil {
		// Aquí podrías manejar errores específicos, como 'duplicate key',
		// pero por ahora lo retornamos para que el servicio lo maneje.
		return err
	}

	return nil
}
