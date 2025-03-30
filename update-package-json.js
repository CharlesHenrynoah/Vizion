const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, 'package.json');

try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Add or update prisma-related scripts
  packageJson.scripts = packageJson.scripts || {};
  packageJson.scripts['prisma:init'] = 'npx prisma init';
  packageJson.scripts['prisma:generate'] = 'npx prisma generate';
  packageJson.scripts['prisma:studio'] = 'npx prisma studio';
  packageJson.scripts['prisma:push'] = 'npx prisma db push';
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('Updated package.json with Prisma scripts');
} catch (error) {
  console.error('Error updating package.json:', error);
}
