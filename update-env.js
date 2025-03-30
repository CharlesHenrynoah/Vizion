const fs = require('fs');
const path = require('path');

// Create a clean .env file
const envContent = `DATABASE_URL="postgresql://neondb_owner:npg_2KpLVjxvC5Gu@ep-rough-snowflake-a58105zn-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
JWT_SECRET="your_jwt_secret_key_here"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_next_auth_secret_here"
`;

try {
  fs.writeFileSync(path.join(__dirname, '.env'), envContent);
  console.log('Created clean .env file with DATABASE_URL');
} catch (error) {
  console.error('Error writing .env file:', error);
}
