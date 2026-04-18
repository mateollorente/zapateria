FROM node:20-alpine AS base

# Fase 1: Dependencias
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Fase 2: Constructor (Build)
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generar los clientes de Prisma primordiales antes de compilar Next
RUN npx prisma generate
RUN npm run build

# Fase 3: Producción en vivo
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Copiar el repositorio buildeado
COPY --from=builder /app ./

EXPOSE 3000

# Lanzamiento estandard en puerto 3000
CMD ["npm", "run", "start"]
