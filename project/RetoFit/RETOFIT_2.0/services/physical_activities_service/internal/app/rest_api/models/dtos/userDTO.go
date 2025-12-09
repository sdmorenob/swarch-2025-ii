package dtos

// CreateUserRequest define la estructura para recibir el ID de un nuevo usuario.
type CreateUserRequest struct {
	UserID int `json:"id_usuario" binding:"required"`
}
