const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

try {
  const envFile = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#\s=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim().replace(/(^"|"$)/g, '');
    }
  });
} catch (e) {
  console.log('No .env file found or error reading it.');
}

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'campus_share',
    multipleStatements: true
  });
  
  console.log('Connected to database.');
  
  const migrations = [
    'migrate_avatar.sql'
  ];

  for (const file of migrations) {
    const sqlPath = path.join(__dirname, file);
    if (fs.existsSync(sqlPath)) {
      console.log(`Running migration: ${file}...`);
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await connection.query(sql);
      console.log(`✓ ${file} completed.`);
    }
  }
  
  console.log('All migrations completed successfully!');
  await connection.end();
}

run().catch(err => {
  console.error('Migration failed:', err.message);
});
