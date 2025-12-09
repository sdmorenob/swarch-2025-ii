// Script para ejecutar la migración SQL de forma segura
// Ejecutar con: node scripts/migrate.js

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Permite certificados auto-firmados (necesario para AWS RDS)
    }
  });

  try {
    console.log('📦 Conectando a la base de datos...');
    await client.connect();
    console.log('✅ Conectado');

    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, '../prisma/migrations/0001_create_posts_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('🔨 Ejecutando migración...');
    await client.query(sql);
    console.log('✅ Migración completada exitosamente');
    console.log('');
    console.log('Tablas creadas:');
    console.log('  - posts');
    console.log('  - comments');
    console.log('  - likes');

  } catch (error) {
    console.error('❌ Error ejecutando la migración:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
