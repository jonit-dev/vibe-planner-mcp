import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath =
  process.env.NODE_ENV === 'test'
    ? ':memory:'
    : path.join(process.cwd(), 'vibeplanner.db');

if (process.env.NODE_ENV !== 'test') {
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
}

let dbInstance: Database.Database;

try {
  dbInstance = new Database(dbPath);
  // Enable WAL mode for better concurrency and performance, if not in-memory
  if (dbPath !== ':memory:') {
    dbInstance.pragma('journal_mode = WAL');
  }
  console.log(`SQLite database connected at ${dbPath}`);

  // Initialize schema after connection ONLY IF NOT IN TEST ENV
  // Tests will handle their own schema initialization via resetDatabase in the spec file
  if (process.env.NODE_ENV !== 'test') {
    const schemaPath = path.join(process.cwd(), 'docs', 'database-schema.md');
    if (fs.existsSync(schemaPath)) {
      const ddlStatements = fs.readFileSync(schemaPath, 'utf-8');
      // Basic parsing to extract SQL from Markdown code blocks
      const sqlBlocks = [];
      const regex = /```sql\n([\s\S]*?)\n```/g;
      let match;
      while ((match = regex.exec(ddlStatements)) !== null) {
        sqlBlocks.push(match[1]);
      }
      if (sqlBlocks.length > 0) {
        // Pass dbInstance directly to avoid issues during module initialization
        _initializeSchemaInternal(sqlBlocks.join('\n---\n'), dbInstance);
      } else {
        console.warn(
          'No SQL DDL found in docs/database-schema.md within ```sql code blocks.'
        );
      }
    } else {
      console.warn(
        'docs/database-schema.md not found. Schema not initialized automatically.'
      );
    }
  }
} catch (error) {
  console.error('Failed to connect to SQLite database:', error);
  // Depending on the application's needs, you might want to exit here
  // process.exit(1);
  throw error; // Re-throw to indicate failure, or handle more gracefully
}

export const db = dbInstance;

/**
 * Initializes the database schema by executing DDL statements.
 * @param ddlStatements A string containing the DDL statements to execute.
 * @param instance An optional database instance to use. Defaults to the global db instance.
 */
function _initializeSchemaInternal(
  ddlStatements: string,
  instance: Database.Database
): void {
  try {
    instance.exec(ddlStatements);
    console.log('Database schema initialized successfully (internal call).');
  } catch (error) {
    console.error('Error initializing database schema (internal call):', error);
    throw error; // Re-throw to allow calling code to handle
  }
}

export function initializeSchema(ddlStatements: string): void {
  try {
    db.exec(ddlStatements);
    console.log('Database schema initialized successfully.');
  } catch (error) {
    console.error('Error initializing database schema:', error);
    throw error; // Re-throw to allow calling code to handle
  }
}

// Optional: Add a function to close the database connection if needed for graceful shutdown
export function closeDbConnection(): void {
  if (db && db.open) {
    db.close();
    console.log('Database connection closed.');
  }
}
