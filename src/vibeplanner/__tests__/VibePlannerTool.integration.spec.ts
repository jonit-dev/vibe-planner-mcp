import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs';
import path from 'path';
import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { db, initializeSchema } from '../../services/db';
import { PhaseRepository } from '../repositories/PhaseRepository';
import { PrdRepository } from '../repositories/PrdRepository';
import { TaskRepository } from '../repositories/TaskRepository';
import { DataPersistenceService } from '../services/DataPersistenceService';
import { PhaseControlService } from '../services/PhaseControlService';
import { PrdLifecycleService } from '../services/PrdLifecycleService';
import { RepositoryProvider } from '../services/RepositoryProvider';
import { TaskOrchestrationService } from '../services/TaskOrchestrationService';
import { VibePlannerTool } from '../services/VibePlannerTool';
import { Prd, Task } from '../types';

// Helper to load DDL from markdown
const getDdlStatements = () => {
  const schemaPath = path.join(process.cwd(), 'docs', 'database-schema.md');
  if (!fs.existsSync(schemaPath)) {
    throw new Error(
      `Database schema file not found at ${schemaPath}. Make sure you are running tests from the project root.`
    );
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
  return sqlBlocks.join('\n---\n');
};

const ddl = getDdlStatements();

const resetDatabase = () => {
  try {
    // Order matters due to foreign key constraints if they were enforced,
    // but better-sqlite3 doesn't enforce them by default without PRAGMA foreign_keys = ON;
    // Still, good practice to delete in reverse order of creation or from dependent tables first.
    db.exec('DELETE FROM task_dependencies;');
    db.exec('DELETE FROM tasks;');
    db.exec('DELETE FROM phases;');
    db.exec('DELETE FROM prds;');
  } catch (error) {
    // console.warn('Warning: Could not delete all data during resetDatabase', (error as Error).message);
    // This can happen if tables don't exist yet on the very first run, which is fine.
  }
  initializeSchema(ddl); // Re-initialize schema
};

const mockMcpContext = {} as any; // Cast to any to satisfy RequestHandlerExtra for now in tests

describe('VibePlannerTool Integration Tests', () => {
  let vibePlannerTool: VibePlannerTool;
  let localDataPersistenceService: DataPersistenceService;

  beforeEach(async () => {
    process.env.NODE_ENV = 'test';
    resetDatabase();
    container.clearInstances();

    // Register concrete repositories first
    container.registerSingleton(PrdRepository);
    container.registerSingleton(PhaseRepository);
    container.registerSingleton(TaskRepository);

    // Register the new RepositoryProvider
    container.registerSingleton(RepositoryProvider);

    // Register services (DataPersistenceService now depends on RepositoryProvider)
    container.registerSingleton(DataPersistenceService);
    container.registerSingleton(PrdLifecycleService);
    container.registerSingleton(PhaseControlService);
    container.registerSingleton(TaskOrchestrationService);

    container.registerSingleton(VibePlannerTool);

    vibePlannerTool = container.resolve(VibePlannerTool);
    localDataPersistenceService = container.resolve(DataPersistenceService);
  });

  describe('createPlan', () => {
    it('should create a new PRD with the given name and description', async () => {
      const planName = 'My New Test Plan';
      const planDescription =
        'This is a detailed description for the test plan.';

      const mockExtra = {
        signal: new AbortController().signal,
        requestId: 'test-request-id',
        sendNotification: async () => {},
        sendRequest: async () => ({}),
      } as any; // Kept as any for brevity in this example, but could be typed more strictly

      const result: CallToolResult = await vibePlannerTool.createPlan(
        mockExtra,
        {
          name: planName,
          description: planDescription,
        }
      );

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.structuredContent).toBeDefined();

      // Define the expected shape of structuredContent for this specific tool method
      const structuredContent = result.structuredContent as {
        planId: string;
        firstTask?: Task;
      };

      expect(structuredContent.planId).toBeTypeOf('string');

      const prdId = structuredContent.planId;
      const prd = (await localDataPersistenceService.getPrdById(
        prdId
      )) as Prd | null;
      expect(prd).not.toBeNull();
      expect(prd?.name).toBe(planName);
      expect(prd?.description).toBe(planDescription);
      expect(prd?.status).toBe('pending');
    });

    it('should return the first task if available (future test)', () => {
      expect(true).toBe(true);
    });
  });

  // Add more describe blocks for other VibePlannerTool methods (getPlanStatus, getNextTask, etc.)
});
