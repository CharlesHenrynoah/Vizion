const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Ensure prisma directory exists
const prismaDir = path.join(__dirname, 'prisma');
if (!fs.existsSync(prismaDir)) {
  console.log('Creating prisma directory...');
  fs.mkdirSync(prismaDir, { recursive: true });
}

// Create a fresh schema file
const schemaContent = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id             String    @id @default(cuid())
  firstName      String
  lastName       String
  email          String    @unique
  password       String
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  emailVerified  Boolean   @default(false)
  image          String?
  role           Role      @default(USER)
}

enum Role {
  USER
  ADMIN
}
`;

const schemaPath = path.join(prismaDir, 'schema.prisma');
fs.writeFileSync(schemaPath, schemaContent, 'utf8');
console.log('Created schema.prisma file.');

// Create the .env file if it doesn't exist
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  const envContent = `DATABASE_URL='postgresql://neondb_owner:npg_2KpLVjxvC5Gu@ep-rough-snowflake-a58105zn-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require'
JWT_SECRET=your_jwt_secret_key_here
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_next_auth_secret_here
`;
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('Created .env file with database URL.');
}

// Instructions for next steps
console.log('\nSetup complete. Now run:');
console.log('1. npx prisma generate');
console.log('2. npx prisma db push');
