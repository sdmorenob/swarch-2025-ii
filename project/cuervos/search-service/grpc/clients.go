package grpc

import (
	"context"
	"fmt"
	"log"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	notespb "search-service/grpc/generated/notes"
	taskspb "search-service/grpc/generated/tasks"
)

type GRPCClients struct {
	NotesClient notespb.NotesSearchServiceClient
	TasksClient taskspb.TasksSearchServiceClient
	notesConn   *grpc.ClientConn
	tasksConn   *grpc.ClientConn
}

// NewGRPCClients crea nuevos clientes gRPC para Notes y Tasks services
func NewGRPCClients(notesAddr, tasksAddr string) (*GRPCClients, error) {
	// Configuración de conexión
	opts := []grpc.DialOption{
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithTimeout(10 * time.Second),
	}

	// Conectar a Notes Service
	notesConn, err := grpc.Dial(notesAddr, opts...)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to notes service: %v", err)
	}

	// Conectar a Tasks Service
	tasksConn, err := grpc.Dial(tasksAddr, opts...)
	if err != nil {
		notesConn.Close()
		return nil, fmt.Errorf("failed to connect to tasks service: %v", err)
	}

	return &GRPCClients{
		NotesClient: notespb.NewNotesSearchServiceClient(notesConn),
		TasksClient: taskspb.NewTasksSearchServiceClient(tasksConn),
		notesConn:   notesConn,
		tasksConn:   tasksConn,
	}, nil
}

// Close cierra las conexiones gRPC
func (c *GRPCClients) Close() {
	if c.notesConn != nil {
		c.notesConn.Close()
	}
	if c.tasksConn != nil {
		c.tasksConn.Close()
	}
}

// SearchNotes busca notas usando gRPC
func (c *GRPCClients) SearchNotes(ctx context.Context, req *notespb.SearchNotesRequest) (*notespb.SearchNotesResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	resp, err := c.NotesClient.SearchNotes(ctx, req)
	if err != nil {
		log.Printf("Error searching notes via gRPC: %v", err)
		return nil, err
	}

	return resp, nil
}

// SearchTasks busca tareas usando gRPC
func (c *GRPCClients) SearchTasks(ctx context.Context, req *taskspb.SearchTasksRequest) (*taskspb.SearchTasksResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	resp, err := c.TasksClient.SearchTasks(ctx, req)
	if err != nil {
		log.Printf("Error searching tasks via gRPC: %v", err)
		return nil, err
	}

	return resp, nil
}