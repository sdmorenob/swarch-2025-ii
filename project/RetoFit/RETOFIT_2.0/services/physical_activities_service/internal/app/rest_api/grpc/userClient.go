package grpc

import (
	"context"
	"fmt"
	"time"

	pb "RetoFit-App/services/physical_activities_service/internal/app/rest_api/proto"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type UserClient struct {
	client pb.UserServiceClient
}

func NewUserClient(address string) (*UserClient, error) {
	conn, err := grpc.NewClient(address, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		fmt.Printf("Error al conectar al servicio Python de usuarios: %v\n", err)
		return nil, err
		//log.Fatalf("No se pudo conectar al servicio Python: %v", err)
	}
	return &UserClient{
		client: pb.NewUserServiceClient(conn),
	}, nil
}

func (c *UserClient) GetUserByID(ctx context.Context, id int32) (*pb.UserResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	req := &pb.UserRequest{Id: id}
	return c.client.GetUser(ctx, req)

}
