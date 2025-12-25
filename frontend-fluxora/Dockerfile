FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ----------------------------

FROM node:20-alpine

WORKDIR /app

# crear usuario NO root
RUN addgroup -S app && adduser -S app -G app

COPY --from=builder /app ./

USER app

EXPOSE 3000
CMD ["node", "node_modules/next/dist/bin/next", "start"]