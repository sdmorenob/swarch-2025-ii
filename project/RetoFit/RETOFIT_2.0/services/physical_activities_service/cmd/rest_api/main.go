package main

import (
	serve "RetoFit-App/services/physical_activities_service/api/server"
	routes "RetoFit-App/services/physical_activities_service/api/server/router"
	"RetoFit-App/services/physical_activities_service/configs"
	"RetoFit-App/services/physical_activities_service/internal/app/rest_api/database"
	"RetoFit-App/services/physical_activities_service/internal/app/rest_api/grpc"
	"RetoFit-App/services/physical_activities_service/internal/app/rest_api/handlers"
	"RetoFit-App/services/physical_activities_service/internal/app/rest_api/repositories"
	"RetoFit-App/services/physical_activities_service/internal/app/rest_api/services"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func main() {
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix

	config := configs.NewConfig()

	client, err := database.NewSQLClient(database.Config{
		DBDriver:          config.Database.DatabaseDriver,
		DBSource:          config.Database.DatabaseSource,
		MaxOpenConns:      25,
		MaxIdleConns:      25,
		ConnMaxIdleTime:   15 * time.Minute,
		ConnectionTimeout: 5 * time.Second,
	})

	if err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize database client")
		return
	}

	defer func() {
		if err := client.Close(); err != nil {
			log.Error().Msgf("Failed to close database client: %v", err)
		}
	}()

	// Initialize repositories
	activityRepo := repositories.NewActivityRepository(client.DB)

	grpcClient, err := grpc.NewUserClient("users-service:50051") // 👈 puerto gRPC del servicio Python
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to gRPC User service")
		return
	}

	//Initialize services
	activityService := services.NewActivityService(activityRepo)

	// Pass services to handlers
	activityHandler := handlers.NewActivityHandler(activityService, grpcClient)

	//cors := config.CorsNew()

	router := gin.Default()
	//router.Use(cors)

	// Register routes
	// --- INICIO DEL CAMBIO ---
	// Pasar ambos handlers a la función de registro de rutas
	routes.RegisterPublicEndpoints(router, activityHandler)
	// --- FIN DEL CAMBIO ---

	server := serve.NewServer(log.Logger, router, config)
	log.Info().Msg("Physical Activities Service running...")
	server.Serve()
}
