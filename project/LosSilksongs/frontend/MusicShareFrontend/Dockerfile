# Build stage
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build
# Remove env-config.js so it can be mounted from ConfigMap
RUN rm -f /app/dist/env-config.js

FROM nginx:alpine
RUN apk add --no-cache gettext

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template

RUN chmod -R 755 /usr/share/nginx/html

EXPOSE 80

CMD ["/bin/sh", "-c", "USERSERVICE_URL=${USERSERVICE_URL:-localhost} MUSICSERVICE_URL=${MUSICSERVICE_URL:-localhost} SOCIALSERVICE_URL=${SOCIALSERVICE_URL:-localhost} envsubst '${USERSERVICE_URL},${MUSICSERVICE_URL},${SOCIALSERVICE_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]