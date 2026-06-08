const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function run() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: 'app_password',
    database: 'campus_share',
    multipleStatements: true
  });
  
  console.log('Connected to database.');
  
  const sqlPath = path.join(__dirname, 'migrate_appointments_exchange_fields.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  console.log('Running migration...');
  await connection.query(sql);
  console.log('Migration completed successfully!');
  
  await connection.end();
}

run().catch(err => {
  console.error('Migration failed:', err);
});
