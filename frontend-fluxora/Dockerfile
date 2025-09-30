FROM node:20-alpine
WORKDIR /app

# Copiar archivos de package
COPY package*.json ./

# Instalar todas las dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Limpiar cache
RUN rm -rf .next

# Build ignorando ESLint y TypeScript
RUN npm run build

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]