
FROM node:20-alpine AS builder

WORKDIR /app

# Install all dependencies
COPY package*.json ./
RUN npm install

# Copy Prisma schema and source code
COPY prisma ./prisma
COPY . .

# Generate Prisma client and run migrations (for production DB, set envs as needed)
RUN npx prisma generate
RUN npx prisma migrate deploy || echo "Migrations may fail in builder if DB is not available, that's OK for CI/CD."

# Build the app
RUN npm run build



# ----------------------
# Production image
# ----------------------
FROM node:20-alpine

WORKDIR /app

# Install Postgres client for pg_isready
RUN apk add --no-cache postgresql-client

# Copy package.json and install only production deps
COPY package*.json ./
RUN npm install

# Copy built code and generated Prisma client from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

# Copy wait-for-postgres script and setup.js
COPY wait-for-postgres.sh ./
COPY setup.js ./

EXPOSE 3000

# Make wait-for-postgres.sh executable
RUN chmod +x wait-for-postgres.sh

# Use wait-for-postgres.sh to wait for DB before running setup.js
ENTRYPOINT ["./wait-for-postgres.sh", "db:5432", "node", "setup.js"]
