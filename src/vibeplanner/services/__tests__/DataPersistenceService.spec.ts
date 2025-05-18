import fs from 'fs';
import path from 'path';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { closeDbConnection, db, initializeSchema } from '../../../services/db'; // db is already configured for test (in-memory)
import { Phase, PhaseStatus, Prd, TaskStatus } from '../../types';
import { DataPersistenceService } from '../DataPersistenceService';

// Helper to re-initialize schema and clear data for a fresh state
const resetDatabase = () => {
  // Clear existing data from tables
  try {
    db.exec('PRAGMA foreign_keys = OFF;'); // Disable FK constraints for easier clearing
    db.exec('DELETE FROM task_dependencies;');
    db.exec('DELETE FROM tasks;');
    db.exec('DELETE FROM phases;');
    db.exec('DELETE FROM prds;');
    db.exec('PRAGMA foreign_keys = ON;'); // Re-enable FK constraints
  } catch (e) {
    // Tables might not exist yet on the very first run, which is fine.
    // console.warn("Warning: Could not clear all tables, they might not exist yet.", e.message);
  }

  // Re-initialize schema to ensure tables are correctly set up
  const schemaPath = path.join(process.cwd(), 'docs', 'database-schema.md');
  if (fs.existsSync(schemaPath)) {
    const ddlStatements = fs.readFileSync(schemaPath, 'utf-8');
    const sqlBlocks: string[] = [];
    const regex = /```sql\n([\s\S]*?)\n```/g;
    let match;
    while ((match = regex.exec(ddlStatements)) !== null) {
      sqlBlocks.push(match[1]);
    }
    if (sqlBlocks.length > 0) {
      initializeSchema(sqlBlocks.join('\n---\n'));
    } else {
      console.warn(
        '[Test Setup] No SQL DDL found in docs/database-schema.md to initialize.'
      );
    }
  } else {
    throw new Error(
      '[Test Setup] docs/database-schema.md not found. Cannot initialize schema for tests.'
    );
  }
};

describe('DataPersistenceService', () => {
  let service: DataPersistenceService;

  beforeEach(async () => {
    resetDatabase(); // Reset DB before each test
    service = new DataPersistenceService();
  });

  afterAll(() => {
    closeDbConnection(); // Close connection after all tests in this file
  });

  describe('PRD Management', () => {
    it('should create a PRD successfully', async () => {
      const prdData = { name: 'Test PRD', description: 'A PRD for testing' };
      const prd = await service.createPrd(prdData);
      expect(prd.id).toBeTypeOf('string');
      expect(prd.name).toBe(prdData.name);
      expect(prd.description).toBe(prdData.description);
      expect(prd.creationDate).toBeInstanceOf(Date);
      expect(prd.updatedAt).toBeInstanceOf(Date);
      expect(prd.phases).toEqual([]);
    });

    it('should get a PRD by ID', async () => {
      const prdData = { name: 'Test PRD Get', description: 'Fetch me' };
      const createdPrd = await service.createPrd(prdData);
      const fetchedPrd = await service.getPrdById(createdPrd.id);
      expect(fetchedPrd).not.toBeNull();
      expect(fetchedPrd?.id).toBe(createdPrd.id);
      expect(fetchedPrd?.name).toBe(prdData.name);
    });

    it('should return null for non-existent PRD ID', async () => {
      const fetchedPrd = await service.getPrdById('non-existent-id');
      expect(fetchedPrd).toBeNull();
    });

    it('should get all PRDs', async () => {
      await service.createPrd({ name: 'PRD 1', description: 'First PRD' });
      await new Promise((resolve) => setTimeout(resolve, 10));
      await service.createPrd({ name: 'PRD 2', description: 'Second PRD' });
      const prds = await service.getAllPrds();
      expect(prds.length).toBe(2);
      expect(prds[0].name).toBe('PRD 2'); // Ordered by creationDate DESC
      expect(prds[1].name).toBe('PRD 1');
    });

    it('should update a PRD successfully', async () => {
      const prdData = { name: 'Original PRD', description: 'Original desc' };
      const prd = await service.createPrd(prdData);
      const updates = { name: 'Updated PRD Name', description: 'Updated desc' };
      const originalUpdatedAt = prd.updatedAt;

      // Allow a small delay for updatedAt to change
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updatedPrd = await service.updatePrd(prd.id, updates);

      expect(updatedPrd).not.toBeNull();
      expect(updatedPrd?.id).toBe(prd.id);
      expect(updatedPrd?.name).toBe(updates.name);
      expect(updatedPrd?.description).toBe(updates.description);
      expect(updatedPrd?.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });

    it('should delete a PRD successfully', async () => {
      const prd = await service.createPrd({
        name: 'To Delete',
        description: 'Delete me',
      });
      const result = await service.deletePrd(prd.id);
      expect(result).toBe(true);
      const fetchedPrd = await service.getPrdById(prd.id);
      expect(fetchedPrd).toBeNull();
    });
  });

  describe('Phase Management', () => {
    let testPrd: Prd;
    beforeEach(async () => {
      testPrd = await service.createPrd({
        name: 'Phase Test PRD',
        description: 'PRD for phase tests',
      });
    });

    it('should create a Phase successfully', async () => {
      const phaseData = {
        name: 'Design Phase',
        description: 'Phase for design work',
        order: 1,
        prdId: testPrd.id,
        status: 'pending' as PhaseStatus,
      };
      const phase = await service.createPhase(phaseData);
      expect(phase.id).toBeTypeOf('string');
      expect(phase.name).toBe(phaseData.name);
      expect(phase.prdId).toBe(testPrd.id);
      expect(phase.tasks).toEqual([]);
    });

    it('should get a Phase by ID', async () => {
      const phaseData = {
        name: 'Dev Phase',
        order: 1,
        prdId: testPrd.id,
        status: 'in_progress' as PhaseStatus,
      };
      const createdPhase = await service.createPhase(phaseData);
      const fetchedPhase = await service.getPhaseById(createdPhase.id);
      expect(fetchedPhase).not.toBeNull();
      expect(fetchedPhase?.id).toBe(createdPhase.id);
    });

    it('should get Phases by PRD ID', async () => {
      await service.createPhase({
        name: 'Phase A',
        order: 1,
        prdId: testPrd.id,
        status: 'pending' as PhaseStatus,
      });
      await service.createPhase({
        name: 'Phase B',
        order: 2,
        prdId: testPrd.id,
        status: 'pending' as PhaseStatus,
      });
      const phases = await service.getPhasesByPrdId(testPrd.id);
      expect(phases.length).toBe(2);
      expect(phases[0].name).toBe('Phase A');
      expect(phases[1].name).toBe('Phase B');
    });

    it('should update a Phase successfully', async () => {
      const phase = await service.createPhase({
        name: 'Initial Phase',
        order: 1,
        prdId: testPrd.id,
        status: 'pending' as PhaseStatus,
      });
      const updates = {
        name: 'Updated Phase Name',
        status: 'completed' as PhaseStatus,
      };
      const originalUpdatedAt = phase.updatedAt;
      await new Promise((resolve) => setTimeout(resolve, 10));
      const updatedPhase = await service.updatePhase(phase.id, updates);
      expect(updatedPhase?.name).toBe(updates.name);
      expect(updatedPhase?.status).toBe(updates.status);
      expect(updatedPhase?.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });

    it('should delete a Phase successfully', async () => {
      const phase = await service.createPhase({
        name: 'Phase To Delete',
        order: 1,
        prdId: testPrd.id,
        status: 'pending' as PhaseStatus,
      });
      const result = await service.deletePhase(phase.id);
      expect(result).toBe(true);
      const fetchedPhase = await service.getPhaseById(phase.id);
      expect(fetchedPhase).toBeNull();
    });
  });

  describe('Task Management', () => {
    let testPrd: Prd;
    let testPhase: Phase;
    beforeEach(async () => {
      testPrd = await service.createPrd({
        name: 'Task Test PRD',
        description: 'PRD for task tests',
      });
      testPhase = await service.createPhase({
        name: 'Task Test Phase',
        order: 1,
        prdId: testPrd.id,
        status: 'pending' as PhaseStatus,
      });
    });

    it('should create a Task successfully', async () => {
      const taskData = {
        name: 'Implement Feature X',
        description: 'Details for X',
        order: 1,
        phaseId: testPhase.id,
        status: 'pending' as TaskStatus,
      };
      const task = await service.createTask(taskData);
      expect(task.id).toBeTypeOf('string');
      expect(task.name).toBe(taskData.name);
      expect(task.phaseId).toBe(testPhase.id);
      expect(task.dependencies).toEqual([]);
    });

    it('should get a Task by ID', async () => {
      const taskData = {
        name: 'Test Task Get',
        order: 1,
        phaseId: testPhase.id,
        status: 'pending' as TaskStatus,
      };
      const createdTask = await service.createTask(taskData);
      const fetchedTask = await service.getTaskById(createdTask.id);
      expect(fetchedTask).not.toBeNull();
      expect(fetchedTask?.id).toBe(createdTask.id);
    });

    it('should get Tasks by Phase ID', async () => {
      await service.createTask({
        name: 'Task 1',
        order: 1,
        phaseId: testPhase.id,
        status: 'pending' as TaskStatus,
      });
      await service.createTask({
        name: 'Task 2',
        order: 2,
        phaseId: testPhase.id,
        status: 'pending' as TaskStatus,
      });
      const tasks = await service.getTasksByPhaseId(testPhase.id);
      expect(tasks.length).toBe(2);
      expect(tasks[0].name).toBe('Task 1');
    });

    it('should update a Task successfully, including dependencies', async () => {
      const task1 = await service.createTask({
        name: 'Task One',
        order: 1,
        phaseId: testPhase.id,
        status: 'pending' as TaskStatus,
      });
      const task2 = await service.createTask({
        name: 'Task Two (Dependency)',
        order: 2,
        phaseId: testPhase.id,
        status: 'pending' as TaskStatus,
      });

      const updates = {
        name: 'Task One Updated',
        status: 'in_progress' as TaskStatus,
        dependencies: [task2.id],
      };
      const originalUpdatedAt = task1.updatedAt;
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updatedTask = await service.updateTask(task1.id, updates);
      expect(updatedTask?.name).toBe(updates.name);
      expect(updatedTask?.status).toBe(updates.status);
      expect(updatedTask?.dependencies).toEqual([task2.id]);
      expect(updatedTask?.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );

      // Check if dependency was actually set
      const fetchedTask1 = await service.getTaskById(task1.id);
      expect(fetchedTask1?.dependencies).toEqual([task2.id]);
    });

    it('should update task dependencies correctly', async () => {
      const taskA = await service.createTask({
        name: 'Task A',
        order: 1,
        phaseId: testPhase.id,
        status: 'pending' as TaskStatus,
      });
      const taskB = await service.createTask({
        name: 'Task B',
        order: 2,
        phaseId: testPhase.id,
        status: 'pending' as TaskStatus,
      });
      const taskC = await service.createTask({
        name: 'Task C',
        order: 3,
        phaseId: testPhase.id,
        status: 'pending' as TaskStatus,
      });

      // Set initial dependencies for taskA: B
      await service.updateTaskDependencies(taskA.id, [taskB.id]);
      let fetchedTaskA = await service.getTaskById(taskA.id);
      expect(fetchedTaskA?.dependencies).toEqual([taskB.id]);

      // Update dependencies for taskA: C (should replace B)
      await service.updateTaskDependencies(taskA.id, [taskC.id]);
      fetchedTaskA = await service.getTaskById(taskA.id);
      expect(fetchedTaskA?.dependencies).toEqual([taskC.id]);

      // Clear dependencies for taskA
      await service.updateTaskDependencies(taskA.id, []);
      fetchedTaskA = await service.getTaskById(taskA.id);
      expect(fetchedTaskA?.dependencies).toEqual([]);
    });

    it('should delete a Task successfully', async () => {
      const task = await service.createTask({
        name: 'Task To Delete',
        order: 1,
        phaseId: testPhase.id,
        status: 'pending' as TaskStatus,
      });
      const result = await service.deleteTask(task.id);
      expect(result).toBe(true);
      const fetchedTask = await service.getTaskById(task.id);
      expect(fetchedTask).toBeNull();
    });
  });

  describe('Cascade Deletes', () => {
    it('deleting a PRD should cascade delete its Phases and Tasks', async () => {
      const prd = await service.createPrd({ name: 'Cascade PRD' });
      const phase1 = await service.createPhase({
        name: 'Cascade Phase 1',
        prdId: prd.id,
        order: 1,
        status: 'pending' as PhaseStatus,
      });
      const task1_1 = await service.createTask({
        name: 'Cascade Task 1.1',
        phaseId: phase1.id,
        order: 1,
        status: 'pending' as TaskStatus,
      });

      const result = await service.deletePrd(prd.id);
      expect(result).toBe(true);

      expect(await service.getPrdById(prd.id)).toBeNull();
      expect(await service.getPhaseById(phase1.id)).toBeNull();
      expect(await service.getTaskById(task1_1.id)).toBeNull();
    });

    it('deleting a Phase should cascade delete its Tasks', async () => {
      const prd = await service.createPrd({ name: 'Cascade Phase PRD' });
      const phase = await service.createPhase({
        name: 'Cascade Phase For Task Deletion',
        prdId: prd.id,
        order: 1,
        status: 'pending' as PhaseStatus,
      });
      const task1 = await service.createTask({
        name: 'Cascade Task To Be Deleted 1',
        phaseId: phase.id,
        order: 1,
        status: 'pending' as TaskStatus,
      });
      const task2 = await service.createTask({
        name: 'Cascade Task To Be Deleted 2',
        phaseId: phase.id,
        order: 2,
        status: 'pending' as TaskStatus,
      });

      const result = await service.deletePhase(phase.id);
      expect(result).toBe(true);

      expect(await service.getPhaseById(phase.id)).toBeNull();
      expect(await service.getTaskById(task1.id)).toBeNull();
      expect(await service.getTaskById(task2.id)).toBeNull();
    });
  });
});
