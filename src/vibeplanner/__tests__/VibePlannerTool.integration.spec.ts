import fs from 'fs';
import path from 'path';
import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { db, initializeSchema } from '../../services/db';
import { VibePlannerTool } from '../index';
import { PhaseRepository } from '../repositories/PhaseRepository';
import { PrdRepository } from '../repositories/PrdRepository';
import { TaskRepository } from '../repositories/TaskRepository';
import { DataPersistenceService } from '../services/DataPersistenceService';
import { PhaseControlService } from '../services/PhaseControlService';
import { PrdLifecycleService } from '../services/PrdLifecycleService';
import { RepositoryProvider } from '../services/RepositoryProvider';
import { TaskOrchestrationService } from '../services/TaskOrchestrationService';
import { Prd } from '../types';

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

const mockMcpContext = {}; // Simple mock context for now

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

  describe('startNewPlan', () => {
    it('should create a new PRD with the given name and description', async () => {
      const planName = 'My New Test Plan';
      const planDescription =
        'This is a detailed description for the test plan.';

      const result = await vibePlannerTool.startNewPlan(mockMcpContext, {
        name: planName,
        description: planDescription,
      });

      expect(result).toBeDefined();
      expect(result.planId).toBeTypeOf('string');

      const prd = (await localDataPersistenceService.getPrdById(
        result.planId
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
