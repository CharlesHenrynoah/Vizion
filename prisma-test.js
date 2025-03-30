const fs = require('fs');
const path = require('path');

// Read the schema file
const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
try {
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  console.log('Schema file found and read successfully:');
  console.log('-'.repeat(50));
  console.log(schemaContent);
  console.log('-'.repeat(50));
  
  // Check if datasource is defined
  if (!schemaContent.includes('datasource db {')) {
    console.error('ERROR: datasource section not found in schema!');
  } else {
    console.log('SUCCESS: datasource section found in schema.');
  }
  
  // Check if the file has proper line endings
  if (schemaContent.includes('\r\n')) {
    console.log('NOTE: Schema file uses Windows-style line endings (CRLF)');
  } else if (schemaContent.includes('\n')) {
    console.log('NOTE: Schema file uses Unix-style line endings (LF)');
  }
  
  // Check for any problematic characters
  const nonAsciiMatch = schemaContent.match(/[^\x00-\x7F]/g);
  if (nonAsciiMatch) {
    console.error('WARNING: Schema contains non-ASCII characters:', nonAsciiMatch);
  }
  
} catch (error) {
  console.error('Failed to read schema file:', error.message);
}

// Check the .env file
const envPath = path.join(__dirname, '.env');
try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('\nEnvironment file found:');
  // Only check if DATABASE_URL is present (don't print it for security)
  if (envContent.includes('DATABASE_URL=')) {
    console.log('SUCCESS: DATABASE_URL is defined in .env file');
  } else {
    console.error('ERROR: DATABASE_URL is not defined in .env file');
  }
} catch (error) {
  console.error('Failed to read .env file:', error.message);
}
