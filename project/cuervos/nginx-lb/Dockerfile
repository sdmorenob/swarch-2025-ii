FROM nginx:alpine

# Add curl for healthcheck
RUN apk add --no-cache curl

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 9000 9003 9004 9008

CMD ["nginx", "-g", "daemon off;"]