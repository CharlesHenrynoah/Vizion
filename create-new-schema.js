const fs = require('fs');
const path = require('path');

// Delete existing schema files to start fresh
try {
  const prismaDir = path.join(__dirname, 'prisma');
  if (fs.existsSync(path.join(prismaDir, 'schema.prisma'))) {
    fs.unlinkSync(path.join(prismaDir, 'schema.prisma'));
    console.log('Deleted existing schema.prisma');
  }
  if (fs.existsSync(path.join(prismaDir, 'schema_backup.prisma'))) {
    fs.unlinkSync(path.join(prismaDir, 'schema_backup.prisma'));
    console.log('Deleted existing schema_backup.prisma');
  }
} catch (error) {
  console.error('Error deleting old schema files:', error);
}

// Create new schema file with very simple content
const basicSchema = `// This is your Prisma schema file

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Define your models below
model User {
  id        String   @id @default(cuid())
  firstName String
  lastName  String
  email     String   @unique
  password  String
}
`;

// Write to file directly
const prismaDir = path.join(__dirname, 'prisma');
if (!fs.existsSync(prismaDir)) {
  fs.mkdirSync(prismaDir, { recursive: true });
}

try {
  fs.writeFileSync(path.join(prismaDir, 'schema.prisma'), basicSchema);
  console.log('Created new schema.prisma with basic content');
} catch (error) {
  console.error('Error writing schema file:', error);
}

// Print instructions
console.log('\nTry running:');
console.log('npx prisma generate');
