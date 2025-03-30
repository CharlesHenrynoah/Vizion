const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting Prisma initialization process...');

// Step 1: Create basic environment file
const envContent = `DATABASE_URL="postgresql://neondb_owner:npg_2KpLVjxvC5Gu@ep-rough-snowflake-a58105zn-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
`;

try {
  fs.writeFileSync(path.join(__dirname, '.env'), envContent);
  console.log('Created .env file with DATABASE_URL');
} catch (error) {
  console.error('Error writing .env file:', error);
  process.exit(1);
}

// Step 2: Run prisma init to create a new schema
try {
  console.log('Running prisma init...');
  execSync('npx prisma init', { stdio: 'inherit' });
} catch (error) {
  console.error('Error running prisma init:', error);
  process.exit(1);
}

// Step 3: Update the schema with our models
const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
try {
  const currentSchema = fs.readFileSync(schemaPath, 'utf8');
  
  // Add our models to the schema
  const updatedSchema = currentSchema + `
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
  
  fs.writeFileSync(schemaPath, updatedSchema);
  console.log('Updated schema.prisma with User model');
} catch (error) {
  console.error('Error updating schema:', error);
  process.exit(1);
}

console.log('\nPrisma initialization complete.');
console.log('Try running:');
console.log('npx prisma generate');
