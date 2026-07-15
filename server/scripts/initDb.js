const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDb() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME || 'crimson_connect';

  console.log(`Connecting to MySQL server at ${host} as ${user}...`);

  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      user,
      password,
      multipleStatements: true
    });

    console.log(`Creating database "${database}" if not exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    await connection.query(`USE \`${database}\`;`);

    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    console.log(`Reading schema file from ${schemaPath}...`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing database schema...');
    await connection.query(schemaSql);

    const seedPath = path.join(__dirname, '../../database/seed.sql');
    if (fs.existsSync(seedPath)) {
      console.log(`Reading seed file from ${seedPath}...`);
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      console.log('Executing seed data...');
      await connection.query(seedSql);
    }
    console.log('Database successfully initialized and seeded.');

  } catch (err) {
    console.error('Error during database initialization:', err.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  initDb();
}

module.exports = initDb;
