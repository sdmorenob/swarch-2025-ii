package handlers

//
//import (
//	"net/http"
//
//	"RetoFit-App/services/physical_activities_service/internal/app/rest_api/models/dtos"
//	"RetoFit-App/services/physical_activities_service/internal/app/rest_api/services"
//
//	"github.com/gin-gonic/gin"
//)
//
//type UserHandler struct {
//	UserService *services.User
//}
//
//func NewUserHandler(userService *services.User) *UserHandler {
//	return &UserHandler{UserService: userService}
//}
//
//// CreateUser maneja la petición POST para crear una referencia de usuario.
//func (uh *UserHandler) CreateUser(c *gin.Context) {
//	var request dtos.CreateUserRequest
//
//	// Valida que el JSON de entrada sea correcto
//	if err := c.ShouldBindJSON(&request); err != nil {
//		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
//		return
//	}
//
//	// Llama al servicio para procesar la lógica
//	if errResp := uh.UserService.CreateUser(&request); errResp != nil {
//		c.JSON(errResp.Code, gin.H{"error": errResp.Message})
//		return
//	}
//
//	// Responde con éxito
//	c.JSON(http.StatusCreated, gin.H{"message": "User reference created successfully"})
//}

import (
	pb "RetoFit-App/services/physical_activities_service/internal/app/rest_api/proto"
	"context"

	"RetoFit-App/services/physical_activities_service/internal/app/rest_api/services"

	"time"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type UserHandler struct {
	userService *services.UserService
}

func NewUserHandler(us *services.UserService) *UserHandler {
	return &UserHandler{userService: us}
}

func (h *UserHandler) GetUser(id int32) (*pb.UserResponse, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	// Llamar al servicio gRPC en Python
	user, err := h.userService.GetUser(ctx, id)
	if err != nil {
		if s, ok := status.FromError(err); ok {
			switch s.Code() {
			case codes.NotFound:
				return nil, status.Error(codes.NotFound, "user not found in Python service")
			default:
				return nil, status.Errorf(codes.Internal, "failed to get user: %v", s.Message())
			}
		}
		return nil, status.Errorf(codes.Internal, "gRPC call failed: %v", err)
	}

	return user, nil
}
