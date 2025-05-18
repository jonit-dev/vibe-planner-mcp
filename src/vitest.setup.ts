import 'reflect-metadata';

// Set NODE_ENV to 'test' for all test runs
process.env.NODE_ENV = 'test';

// Set VIBE_PLANNER_PROJECT_ROOT for tests that might require it (e.g., PlanningService)
if (!process.env.VIBE_PLANNER_PROJECT_ROOT) {
  process.env.VIBE_PLANNER_PROJECT_ROOT = process.cwd();
  console.log(
    `[VIBE-PLANNER Test Setup] VIBE_PLANNER_PROJECT_ROOT set to: ${process.env.VIBE_PLANNER_PROJECT_ROOT}`
  );
}

// You can add other global test setup here, e.g.:
// import { db, initializeSchema } from './services/db'; // Path might need adjustment
// import fs from 'fs';
// import path from 'path';

// beforeAll(async () => {
//   // Ensure schema is initialized for the in-memory database
//   const schemaPath = path.join(process.cwd(), 'docs', 'database-schema.md');
//   if (fs.existsSync(schemaPath)) {
//     const ddlStatements = fs.readFileSync(schemaPath, 'utf-8');
//     const sqlBlocks = [];
//     const regex = /```sql\n([\s\S]*?)\n```/g;
//     let match;
//     while ((match = regex.exec(ddlStatements)) !== null) {
//       sqlBlocks.push(match[1]);
//     }
//     if (sqlBlocks.length > 0) {
//       initializeSchema(sqlBlocks.join('\n---\n'));
//     }
//   } else {
//     console.warn('docs/database-schema.md not found for test setup. Schema not initialized automatically.');
//   }
// });

// afterEach(async () => {
// Clean up data between tests if necessary, e.g. by re-initializing or clearing tables
// For an in-memory DB, often re-initializing schema per test suite or test file is enough,
// or simply letting each test run in a fresh context if db connection is made per test file.
// If db is a singleton, then clearing data is important.

// Example: Clearing all tables (BE CAREFUL WITH THIS - ensure it only runs for test DB)
// if (process.env.NODE_ENV === 'test') {
//   try {
//     db.exec("DELETE FROM task_dependencies;");
//     db.exec("DELETE FROM tasks;");
//     db.exec("DELETE FROM phases;");
//     db.exec("DELETE FROM prds;");
//     console.log("Test database tables cleared after test.");
//   } catch (error) {
//     console.error("Error clearing test database tables:", error);
//   }
// }
// });

console.log(
  '[VIBE-PLANNER] Vitest setup file loaded. reflect-metadata imported.'
);
