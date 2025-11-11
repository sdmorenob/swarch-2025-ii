FROM node:18-alpine

WORKDIR /app

# Copiar archivos de configuración de dependencias
COPY package.json package-lock.json* ./

# Instalar dependencias
RUN npm install

# Copiar todo el código fuente
COPY . .

# Exponer el puerto
EXPOSE 3000

# Comando para desarrollo (se sobreescribe en docker-compose, pero lo dejamos como default)
CMD ["npm", "run", "dev"]
