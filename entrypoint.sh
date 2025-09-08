#!/bin/sh
set -e

echo "⏳ Waiting for Postgres at $DATABASE_URL..."
until pg_isready -h db -U postgres -d notifications; do
  sleep 2
done

echo "✅ Postgres is ready!"

echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy

echo "🌱 Seeding database..."
npm run seed

echo "🌱 Seeding templates..."
npm run seed:templates

echo "🚀 Starting app..."
npm run start:prod