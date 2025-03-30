const fs = require('fs');
const path = require('path');

// Create content for schema file
const schemaContent = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id             String   @id @default(cuid())
  firstName      String
  lastName       String
  email          String   @unique
  password       String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  emailVerified  Boolean  @default(false)
  image          String?
  role           Role     @default(USER)
}

enum Role {
  USER
  ADMIN
}
`;

// Ensure prisma directory exists
const prismaDir = path.join(__dirname, 'prisma');
if (!fs.existsSync(prismaDir)) {
  fs.mkdirSync(prismaDir, { recursive: true });
}

// Write the schema file
try {
  fs.writeFileSync(path.join(prismaDir, 'schema.prisma'), schemaContent, 'utf8');
  console.log('Successfully wrote schema.prisma file');

  // Create a backup copy with a different name
  fs.writeFileSync(path.join(prismaDir, 'schema_backup.prisma'), schemaContent, 'utf8');
  console.log('Created backup schema file');
} catch (error) {
  console.error('Error writing schema file:', error);
}

// Check if .env exists and has DATABASE_URL
const envPath = path.join(__dirname, '.env');
let envExists = false;

try {
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('DATABASE_URL=')) {
      console.log('.env file exists and contains DATABASE_URL');
      envExists = true;
    } else {
      console.log('.env file exists but does not contain DATABASE_URL');
    }
  } else {
    console.log('.env file does not exist');
  }
} catch (error) {
  console.error('Error checking .env file:', error);
}

// Create or update .env file if needed
if (!envExists) {
  try {
    const envContent = `DATABASE_URL='postgresql://neondb_owner:npg_2KpLVjxvC5Gu@ep-rough-snowflake-a58105zn-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require'
JWT_SECRET=your_jwt_secret_key_here
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_next_auth_secret_here
`;
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('Created/updated .env file with DATABASE_URL');
  } catch (error) {
    console.error('Error writing .env file:', error);
  }
}

console.log('\nTry running these commands now:');
console.log('1. npm install @prisma/client');
console.log('2. npx prisma generate --schema=./prisma/schema.prisma');
console.log('3. If the above still fails, try: npx prisma generate --schema=./prisma/schema_backup.prisma');
