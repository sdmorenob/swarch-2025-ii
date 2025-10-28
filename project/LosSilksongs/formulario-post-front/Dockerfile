# Etapa de build
FROM node:20-alpine AS build
WORKDIR /app
COPY . .

# Etapa de producción
FROM nginx:stable-alpine
COPY --from=build /app /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
