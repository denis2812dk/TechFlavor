# Usa una imagen ligera de Node
FROM node:22-alpine as build

# Crea el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de dependencias primero (para aprovechar el caché de Docker)
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto del código del backend
COPY . .

# Expone el puerto que usa tu backend (asumiendo que es el 3000, cámbialo si es otro)
EXPOSE 3000

# Comando para iniciar tu servidor (revisa tu package.json si usas otro script como 'npm run start')
CMD ["npm", "start"]