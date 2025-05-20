import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import 'reflect-metadata'; // Required for tsyringe
import { container } from 'tsyringe';
import { PROJECT_ROOT_PATH } from '../constants/pathConstants'; // Added import
import { LoggerService } from './LoggerService'; // Import LoggerService

const logger = container.resolve(LoggerService); // Get logger instance

const dbPath =
  process.env.NODE_ENV === 'test'
    ? ':memory:'
    : path.join(PROJECT_ROOT_PATH, 'vibeplanner.db'); // Changed process.cwd()

if (process.env.NODE_ENV !== 'test') {
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
}

logger.info(
  `[db.ts] TOP LEVEL: PROJECT_ROOT_PATH for main db: ${PROJECT_ROOT_PATH}`
); // Changed process.cwd()
logger.info(`[db.ts] TOP LEVEL: dbPath for main db: ${dbPath}`);

logger.info(
  `[db.ts] Main DB Initialization: PROJECT_ROOT_PATH is ${PROJECT_ROOT_PATH}` // Changed process.cwd()
);
logger.info(`[db.ts] Main DB Initialization: dbPath is ${dbPath}`);
logger.info(
  `[db.ts] About to initialize main dbInstance. PROJECT_ROOT_PATH: ${PROJECT_ROOT_PATH}, Resolved dbPath: ${dbPath}` // Changed process.cwd()
);

let dbInstance: Database.Database;

try {
  dbInstance = new Database(dbPath);
  // Enable WAL mode for better concurrency and performance, if not in-memory
  if (dbPath !== ':memory:') {
    dbInstance.pragma('journal_mode = WAL');
  }
  logger.info(`SQLite database connected at ${dbPath}`);

  // Initialize schema after connection ONLY IF NOT IN TEST ENV
  // Tests will handle their own schema initialization via resetDatabase in the spec file
  if (process.env.NODE_ENV !== 'test') {
    const schemaPath = path.join(
      PROJECT_ROOT_PATH,
      'docs',
      'database-schema.md'
    ); // Changed process.cwd()
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
        logger.warn(
          'No SQL DDL found in docs/database-schema.md within ```sql code blocks.'
        );
      }
    } else {
      logger.warn(
        'docs/database-schema.md not found. Schema not initialized automatically.'
      );
    }
  }
} catch (error) {
  logger.error('Failed to connect to SQLite database:', error as Error);
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
    logger.info('Database schema initialized successfully (internal call).');

    try {
      const checkStmt = instance.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='prds'"
      );
      const tableInfo = checkStmt.get();
      if (tableInfo) {
        logger.info(
          'prds table confirmed to exist after schema initialization.'
        );
      } else {
        logger.error(
          'prds table DOES NOT EXIST after schema initialization, despite exec() succeeding.'
        );
      }
    } catch (diagError) {
      logger.error(
        'Error querying prds table after initialization:',
        diagError as Error
      );
    }
  } catch (error) {
    logger.error(
      'Error initializing database schema (internal call):',
      error as Error
    );
    throw error;
  }
}

export function initializeSchema(ddlStatements: string): void {
  try {
    _initializeSchemaInternal(ddlStatements, db); // Call the internal one for consistency with logging and checks
  } catch (error) {
    logger.error('Error initializing database schema:', error as Error);
    throw error; // Re-throw to allow calling code to handle
  }
}

// Optional: Add a function to close the database connection if needed for graceful shutdown
export function closeDbConnection(): void {
  if (db && db.open) {
    db.close();
    logger.info('Database connection closed.');
  }
}

export const initializeDatabase = (forceCreate = false): Database.Database => {
  logger.info(
    `initializeDatabase function: Called. forceCreate: ${forceCreate}.`
  );
  logger.info(
    `initializeDatabase function: PROJECT_ROOT_PATH is ${PROJECT_ROOT_PATH}`
  ); // Changed process.cwd()

  const dbFilePath = path.resolve(PROJECT_ROOT_PATH, 'vibeplanner.db'); // Changed process.cwd()

  if (process.env.NODE_ENV !== 'test') {
    const dbDir = path.dirname(dbFilePath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  }

  let dbInstance: Database.Database;

  try {
    dbInstance = new Database(dbFilePath);
    // Enable WAL mode for better concurrency and performance, if not in-memory
    if (dbFilePath !== ':memory:') {
      dbInstance.pragma('journal_mode = WAL');
    }
    logger.info(`SQLite database connected at ${dbFilePath}`);

    // Initialize schema after connection ONLY IF NOT IN TEST ENV
    // Tests will handle their own schema initialization via resetDatabase in the spec file
    if (process.env.NODE_ENV !== 'test') {
      const schemaPath = path.join(
        PROJECT_ROOT_PATH,
        'docs',
        'database-schema.md'
      ); // Changed process.cwd()
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
          logger.warn(
            'No SQL DDL found in docs/database-schema.md within ```sql code blocks.'
          );
        }
      } else {
        logger.warn(
          'docs/database-schema.md not found. Schema not initialized automatically.'
        );
      }
    }
  } catch (error) {
    logger.error('Failed to connect to SQLite database:', error as Error);
    // Depending on the application's needs, you might want to exit here
    // process.exit(1);
    throw error; // Re-throw to indicate failure, or handle more gracefully
  }

  return dbInstance;
};
