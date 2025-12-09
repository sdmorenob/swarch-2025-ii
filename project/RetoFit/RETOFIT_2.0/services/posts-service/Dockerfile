FROM node:18-alpine

# Instala dependencias para Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copia package files
COPY package*.json ./

# Instala todas las dependencias
RUN npm install

# Copia schema de Prisma
COPY prisma ./prisma/

# Genera cliente de Prisma
RUN npx prisma generate

# Copia el resto del código
COPY . .

EXPOSE 8005

# Usa dev para desarrollo
CMD ["npm", "run", "dev"]