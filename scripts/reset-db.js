const fs = require('fs');
const path = require('path');

// Determine project root assuming the script is in 'scripts/reset-db.js'
const PROJECT_ROOT_PATH = path.resolve(__dirname, '..');
const compiledDbPath = path.join(
  PROJECT_ROOT_PATH,
  'dist',
  'services',
  'db.js'
);

let dbServiceModule;
let db, initializeSchema;

function loadDbService() {
  try {
    // Important: Clear cache if it exists to force re-initialization of db.js
    if (require.cache[compiledDbPath]) {
      delete require.cache[compiledDbPath];
    }
    dbServiceModule = require(compiledDbPath);
    db = dbServiceModule.db;
    initializeSchema = dbServiceModule.initializeSchema;

    if (!db || !initializeSchema) {
      console.error(
        'Database instance (db) or initializeSchema function not found after loading db.js.'
      );
      process.exit(1);
    }
  } catch (e) {
    console.error('Failed to load database service from dist/services/db.js.');
    console.error('Make sure you have built the project (e.g., yarn build).');
    console.error(e);
    process.exit(1);
  }
}

// Initial load
loadDbService();

const getDdlStatements = () => {
  const schemaPath = path.join(PROJECT_ROOT_PATH, 'docs', 'database-schema.md');
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Database schema file not found at ${schemaPath}.`);
  }
  const ddlMarkdown = fs.readFileSync(schemaPath, 'utf-8');
  const sqlBlocks = [];
  const regex = /```sql\n([\s\S]*?)\n```/g;
  let match;
  while ((match = regex.exec(ddlMarkdown)) !== null) {
    sqlBlocks.push(match[1]);
  }
  if (sqlBlocks.length === 0) {
    throw new Error('No SQL DDL found in database-schema.md');
  }
  return sqlBlocks.join('\n');
};

const resetDatabase = () => {
  console.log('Attempting to reset the database...');
  try {
    const dbFilePath = path.join(PROJECT_ROOT_PATH, 'vibeplanner.db');
    const dbShmPath = path.join(PROJECT_ROOT_PATH, 'vibeplanner.db-shm');
    const dbWalPath = path.join(PROJECT_ROOT_PATH, 'vibeplanner.db-wal');

    if (db && typeof db.close === 'function' && db.open) {
      console.log(
        'Closing existing database connection (from initial load)...'
      );
      db.close();
    }

    // Delete existing database files
    [dbFilePath, dbShmPath, dbWalPath].forEach((filePath) => {
      if (fs.existsSync(filePath)) {
        console.log(`Deleting ${filePath}...`);
        fs.unlinkSync(filePath);
      }
    });
    console.log('Old database files deleted (if they existed).');

    // Reload db service to get a fresh connection to the (now non-existent) db file
    // This will trigger the db creation logic within db.js
    console.log('Reloading database service to establish a new connection...');
    loadDbService();

    console.log('Re-initializing database schema with the new connection...');
    const ddl = getDdlStatements();
    // The reloaded initializeSchema will use the newly established db connection
    initializeSchema(ddl);

    console.log('Database reset successfully.');

    // Touch a sentinel file to signal completion for nodemon
    const sentinelFilePath = path.join(PROJECT_ROOT_PATH, '.db_reset_sentinel');
    fs.writeFileSync(
      sentinelFilePath,
      `Reset completed at: ${new Date().toISOString()}`
    );
    console.log(`Sentinel file ${sentinelFilePath} touched.`);
  } catch (error) {
    console.error('Failed to reset database:');
    console.error(error);
    process.exit(1);
  } finally {
    if (db && typeof db.close === 'function' && db.open) {
      console.log('Closing database connection (final)...');
      db.close();
    }
  }
};

resetDatabase();
