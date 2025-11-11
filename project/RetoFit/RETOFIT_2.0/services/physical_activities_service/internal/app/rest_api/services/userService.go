package services

//
//import (
//	"log"
//	"net/http"
//
//	"RetoFit-App/services/physical_activities_service/internal/app/rest_api/models"
//	"RetoFit-App/services/physical_activities_service/internal/app/rest_api/models/dtos"
//	"RetoFit-App/services/physical_activities_service/internal/app/rest_api/repositories"
//)
//
//// User representa el servicio para la lógica de negocio de usuarios.
//type User struct {
//	UserRepo *repositories.User
//}
//
//// NewUserService crea una nueva instancia del servicio de usuario.
//func NewUserService(userRepo *repositories.User) *User {
//	return &User{UserRepo: userRepo}
//}
//
//// CreateUser maneja la creación de una referencia de usuario.
//func (us *User) CreateUser(request *dtos.CreateUserRequest) *models.ErrorResponse {
//	err := us.UserRepo.Create(request.UserID)
//	if err != nil {
//		// Aquí puedes verificar si el error es por una clave duplicada
//		// y decidir si quieres retornar un error o no. Por ahora, lo registramos y devolvemos un 500.
//		log.Printf("Error al crear usuario en la base de datos: %v", err)
//		return &models.ErrorResponse{
//			Code:    http.StatusInternalServerError,
//			Message: "Failed to create user reference",
//		}
//	}
//
//	log.Printf("Referencia de usuario creada con éxito para el ID: %d", request.UserID)
//	return nil
//}

import (
	"RetoFit-App/services/physical_activities_service/internal/app/rest_api/grpc"
	pb "RetoFit-App/services/physical_activities_service/internal/app/rest_api/proto"
	"context"
)

type UserService struct {
	grpcClient *grpc.UserClient
}

func NewUserService(gClient *grpc.UserClient) *UserService {
	return &UserService{grpcClient: gClient}
}

func (s *UserService) GetUser(ctx context.Context, id int32) (*pb.UserResponse, error) {
	return s.grpcClient.GetUserByID(ctx, id)
}
