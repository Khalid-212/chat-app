#!/bin/bash
# Migration script that handles baseline scenarios

echo "Running Prisma migrations..."

# Try to deploy migrations
npx prisma migrate deploy --config=./prisma/prisma.config.ts

# If it fails with P3005 (baseline error), we can manually apply migrations
if [ $? -ne 0 ]; then
  echo "Migration deploy failed. Checking if we need to baseline..."
  echo "Note: If this is a production database with existing tables,"
  echo "you may need to manually apply migrations or baseline the database."
  exit 1
fi

echo "Migrations completed successfully!"

