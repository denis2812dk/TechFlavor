# Etapa 1: Construcción
FROM node:22-alpine as build
WORKDIR /app

# Recibir la URL de Cloudflare desde GitHub Actions
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Instalar y construir
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: Servidor Web (Nginx)
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]