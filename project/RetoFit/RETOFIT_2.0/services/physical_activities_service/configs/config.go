package configs

import (
	"fmt"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

type Config struct {
	Server   serverConfig
	Database databaseConfig
}

type serverConfig struct {
	Address string
}

type databaseConfig struct {
	DatabaseDriver string
	DatabaseSource string
}

func NewConfig() *Config {
	_ = godotenv.Load("./dev.env")

	// Luego lee las variables normalmente
	//serverAddress := os.Getenv("SERVER_ADDRESS")
	//dbDriver := os.Getenv("DB_DRIVER")
	//dbSource := os.Getenv("DB_SOURCE")
	//err := godotenv.Load("dev.env")

	//if err != nil {
	//	fmt.Print(err)
	//	panic("Error loading .env file")
	//}

	c := &Config{
		Server: serverConfig{
			Address: GetEnvOrPanic("SERVER_ADDRESS"),
		},
		Database: databaseConfig{
			DatabaseDriver: GetEnvOrPanic("DB_DRIVER"),
			DatabaseSource: GetEnvOrPanic("DB_SOURCE"),
		},
	}

	return c
}

func GetEnvOrPanic(key string) string {
	value := os.Getenv(key)
	if value == "" {
		panic(fmt.Sprintf("environment variable %s not set", key))
	}

	return value
}

func (conf *Config) CorsNew() gin.HandlerFunc {
	//allowedOrigin := GetEnvOrPanic(constants.EnvKeys.CorsAllowedOrigin)

	return func(c *gin.Context) {
		c.Next()
	}
	//return cors.New(cors.Config{
	//	AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodOptions}, // Añadido OPTIONS
	//	AllowHeaders: []string{
	//		constants.Headers.Origin,
	//		"Content-Type",
	//		"Authorization", // Cabecera para el token JWT
	//	},
	//	ExposeHeaders: []string{constants.Headers.ContentLength},
	//	AllowOrigins: []string{
	//		"*",
	//		//"http://localhost:3000",

	//		//"http://127.0.0.1:3000",
	//	},
	//	AllowCredentials: true,
	//	//AllowOriginFunc: func(origin string) bool {
	//	//	return origin == allowedOrigin
	//	//},
	//	MaxAge: constants.MaxAge,
	//})
}
