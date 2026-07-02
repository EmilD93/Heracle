const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

const connectionString = 'postgresql://neondb_owner:npg_sHaA3gnKIWD7@ep-misty-recipe-ash2378m.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require'

async function setupDatabase() {
  const client = new Client({ connectionString })
  
  try {
    console.log('Connecting to Neon database...')
    await client.connect()
    console.log('Connected successfully!')

    // Read SQL files
    const initSql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8')
    const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8')

    console.log('Dropping existing tables...')
    await client.query(`
      DROP TABLE IF EXISTS notification_logs CASCADE;
      DROP TABLE IF EXISTS notification_jobs CASCADE;
      DROP TABLE IF EXISTS registrations CASCADE;
      DROP TABLE IF EXISTS events CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `)

    console.log('Running init.sql (creating tables)...')
    await client.query(initSql)
    console.log('Tables created successfully!')

    console.log('Running seed.sql (inserting test data)...')
    await client.query(seedSql)
    console.log('Test data inserted successfully!')

  } catch (err) {
    console.error('Error setting up database:', err)
  } finally {
    await client.end()
    console.log('Connection closed.')
  }
}

setupDatabase()
