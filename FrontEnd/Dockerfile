# --- Etapa 1: Construcción ---
FROM node:22-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Construye la aplicación de Vite (creará la carpeta /dist)
RUN npm run build

# --- Etapa 2: Servidor Web ---
FROM nginx:alpine
# Copia los archivos construidos de la etapa anterior a la carpeta pública de Nginx
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]