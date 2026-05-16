FROM node:22-alpine
WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar el código
COPY . .

# Exponer el puerto del API
EXPOSE 3000

# Iniciar el servidor (ajusta "npm start" si usas otro comando en tu package.json)
CMD ["npm", "start"]