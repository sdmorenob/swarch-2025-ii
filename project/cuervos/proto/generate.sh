#!/bin/bash

# Script para generar código gRPC desde archivos .proto
# Requiere protoc y plugins instalados

echo "Generando código gRPC..."

# Crear directorios de salida
mkdir -p ../notes-service/app/grpc/generated
mkdir -p ../tasks-service/app/grpc/generated
mkdir -p ../search-service/grpc/generated

# Generar código Python para Notes Service
echo "Generando código Python para Notes Service..."
python -m grpc_tools.protoc \
  --proto_path=. \
  --python_out=../notes-service/app/grpc/generated \
  --grpc_python_out=../notes-service/app/grpc/generated \
  common.proto notes_search.proto

# Generar código Python para Tasks Service
echo "Generando código Python para Tasks Service..."
python -m grpc_tools.protoc \
  --proto_path=. \
  --python_out=../tasks-service/app/grpc/generated \
  --grpc_python_out=../tasks-service/app/grpc/generated \
  common.proto tasks_search.proto

# Generar código Go para Search Service
echo "Generando código Go para Search Service..."
protoc \
  --proto_path=. \
  --go_out=../search-service/grpc/generated \
  --go_opt=paths=source_relative \
  --go-grpc_out=../search-service/grpc/generated \
  --go-grpc_opt=paths=source_relative \
  common.proto notes_search.proto tasks_search.proto

echo "Código gRPC generado exitosamente!"
echo ""
echo "Archivos generados:"
echo "- Notes Service: notes-service/app/grpc/generated/"
echo "- Tasks Service: tasks-service/app/grpc/generated/"
echo "- Search Service: search-service/grpc/generated/"