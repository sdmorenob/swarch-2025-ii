package grpc

import (
    "context"
    "crypto/tls"
    "crypto/x509"
    "fmt"
    "log"
    "os"
    "time"

    "google.golang.org/grpc"
    "google.golang.org/grpc/credentials"
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
    // Helper para crear credenciales por servicio, permitiendo SNI por separado
    makeCreds := func(serverNameEnv string) (credentials.TransportCredentials, error) {
        enableTLS := os.Getenv("GRPC_TLS_ENABLE") == "true"
        if !enableTLS {
            return insecure.NewCredentials(), nil
        }

        caPath := os.Getenv("GRPC_TLS_CA_CERT")
        clientCert := os.Getenv("GRPC_TLS_CLIENT_CERT")
        clientKey := os.Getenv("GRPC_TLS_CLIENT_KEY")

        // Cargar CA
        certPool := x509.NewCertPool()
        if caPath != "" {
            caBytes, err := os.ReadFile(caPath)
            if err != nil {
                return nil, fmt.Errorf("failed to read CA cert: %v", err)
            }
            if ok := certPool.AppendCertsFromPEM(caBytes); !ok {
                return nil, fmt.Errorf("failed to append CA cert")
            }
        }

        tlsCfg := &tls.Config{RootCAs: certPool}

        // Cliente mTLS si hay cert+key
        if clientCert != "" && clientKey != "" {
            cert, err := tls.LoadX509KeyPair(clientCert, clientKey)
            if err != nil {
                return nil, fmt.Errorf("failed to load client cert/key: %v", err)
            }
            tlsCfg.Certificates = []tls.Certificate{cert}
        }

        // SNI/ServerName por servicio
        if sni := os.Getenv(serverNameEnv); sni != "" {
            tlsCfg.ServerName = sni
        }
        return credentials.NewTLS(tlsCfg), nil
    }

    notesCreds, err := makeCreds("GRPC_TLS_SERVER_NAME_NOTES")
    if err != nil {
        return nil, err
    }
    tasksCreds, err := makeCreds("GRPC_TLS_SERVER_NAME_TASKS")
    if err != nil {
        return nil, err
    }

    // Conectar a Notes Service
    notesConn, err := grpc.Dial(notesAddr, grpc.WithTransportCredentials(notesCreds), grpc.WithTimeout(10*time.Second))
    if err != nil {
        return nil, fmt.Errorf("failed to connect to notes service: %v", err)
    }

    // Conectar a Tasks Service
    tasksConn, err := grpc.Dial(tasksAddr, grpc.WithTransportCredentials(tasksCreds), grpc.WithTimeout(10*time.Second))
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