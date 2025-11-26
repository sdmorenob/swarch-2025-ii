// Módulo Go del microservicio de búsqueda de TaskNotes
module search-service

go 1.21

require (
    github.com/gin-gonic/gin v1.9.1
    github.com/joho/godotenv v1.5.1
    go.mongodb.org/mongo-driver v1.16.1
    github.com/graphql-go/graphql v0.8.0
    github.com/golang-jwt/jwt/v5 v5.2.1
    google.golang.org/grpc v1.66.0
    google.golang.org/protobuf v1.33.0
    github.com/prometheus/client_golang v1.18.0
    github.com/redis/go-redis/v9 v9.4.0
    github.com/rabbitmq/amqp091-go v1.9.0
)