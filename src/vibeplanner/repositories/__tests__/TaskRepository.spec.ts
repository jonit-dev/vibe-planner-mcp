import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { beforeEach, describe, expect, it } from 'vitest';
import { db, initializeSchema } from '../../../services/db';
import { Phase, Prd } from '../../types'; // Import Prd and Phase types
import { PhaseRepository } from '../PhaseRepository';
import { PrdRepository } from '../PrdRepository';
import { TaskRepository } from '../TaskRepository';

const getDdlStatements = () => {
  const schemaPath = path.join(process.cwd(), 'docs', 'database-schema.md');
  if (!fs.existsSync(schemaPath))
    throw new Error('database-schema.md not found');
  const ddlMarkdown = fs.readFileSync(schemaPath, 'utf-8');
  const sqlBlocks = [];
  const regex = /```sql\n([\s\S]*?)\n```/g;
  let match;
  while ((match = regex.exec(ddlMarkdown)) !== null) sqlBlocks.push(match[1]);
  if (sqlBlocks.length === 0) throw new Error('No SQL DDL found');
  return sqlBlocks.join('\n---\n');
};

const ddl = getDdlStatements();

const resetDatabase = () => {
  try {
    db.exec('DELETE FROM task_dependencies;');
    db.exec('DELETE FROM tasks;');
    db.exec('DELETE FROM phases;');
    db.exec('DELETE FROM prds;');
  } catch (error) {
    /* console.warn('Could not delete all data'); */
  }
  initializeSchema(ddl);
};

describe('TaskRepository', () => {
  let taskRepository: TaskRepository;
  let phaseRepository: PhaseRepository;
  let prdRepository: PrdRepository;
  let testPrd: Prd;
  let testPhase: Phase;

  beforeEach(async () => {
    resetDatabase();
    taskRepository = new TaskRepository();
    phaseRepository = new PhaseRepository();
    prdRepository = new PrdRepository();

    testPrd = await prdRepository.create({
      name: 'Test PRD for Tasks',
      status: 'pending' as const,
    });
    testPhase = await phaseRepository.create({
      name: 'Test Phase for Tasks',
      prdId: testPrd.id,
      order: 1,
      status: 'pending' as const,
    });
  });

  it('should create a task and find it by id, converting isValidated', async () => {
    const taskData = {
      name: 'Test Task 1',
      description: 'This is a test task',
      status: 'pending' as const,
      isValidated: false, // Will be stored as 0
      order: 1,
      phaseId: testPhase.id,
    };
    const createdTask = await taskRepository.create(taskData);

    expect(createdTask.id).toBeTypeOf('string');
    expect(createdTask.name).toBe(taskData.name);
    expect(createdTask.status).toBe('pending');
    expect(createdTask.isValidated).toBe(false); // Should be boolean false
    expect(createdTask.order).toBe(1);
    expect(createdTask.phaseId).toBe(testPhase.id);
    expect(createdTask.dependencies).toBeUndefined(); // .optional() in schema

    const foundTask = await taskRepository.findById(createdTask.id);
    expect(foundTask).toEqual(createdTask);
    expect(foundTask!.isValidated).toBe(false);

    // Test with isValidated true
    const taskDataValidated = {
      ...taskData,
      name: 'Validated Task',
      isValidated: true,
    };
    const createdValidatedTask = await taskRepository.create(taskDataValidated);
    const foundValidatedTask = await taskRepository.findById(
      createdValidatedTask.id
    );
    expect(foundValidatedTask!.isValidated).toBe(true);
  });

  it('should return null if task not found by id', async () => {
    const foundTask = await taskRepository.findById(crypto.randomUUID());
    expect(foundTask).toBeNull();
  });

  it('should find tasks by phaseId, ordered by "order"', async () => {
    await taskRepository.create({
      name: 'Task B',
      phaseId: testPhase.id,
      order: 2,
      status: 'pending' as const,
      isValidated: false,
    });
    await taskRepository.create({
      name: 'Task A',
      phaseId: testPhase.id,
      order: 1,
      status: 'in_progress' as const,
      isValidated: true,
    });

    const otherPhase = await phaseRepository.create({
      name: 'Other Phase',
      prdId: testPrd.id,
      order: 2,
      status: 'pending' as const,
    });
    await taskRepository.create({
      name: 'Task C',
      phaseId: otherPhase.id,
      order: 1,
      status: 'pending' as const,
      isValidated: false,
    });

    const tasksForTestPhase = await taskRepository.findByPhaseId(testPhase.id);
    expect(tasksForTestPhase).toHaveLength(2);
    expect(tasksForTestPhase[0].name).toBe('Task A');
    expect(tasksForTestPhase[0].order).toBe(1);
    expect(tasksForTestPhase[1].name).toBe('Task B');
    expect(tasksForTestPhase[1].order).toBe(2);
  });

  it('should return an empty array if no tasks found for phaseId', async () => {
    const newPhase = await phaseRepository.create({
      name: 'Empty Phase',
      prdId: testPrd.id,
      order: 2,
      status: 'pending' as const,
    });
    const tasks = await taskRepository.findByPhaseId(newPhase.id);
    expect(tasks).toEqual([]);
  });

  it('should find all tasks (less common, but for completeness)', async () => {
    await taskRepository.create({
      name: 'Task 1',
      phaseId: testPhase.id,
      order: 1,
      status: 'pending' as const,
      isValidated: false,
    });
    const otherPhase = await phaseRepository.create({
      name: 'Other Phase',
      prdId: testPrd.id,
      order: 2,
      status: 'pending' as const,
    });
    await taskRepository.create({
      name: 'Task 2',
      phaseId: otherPhase.id,
      order: 1,
      status: 'in_progress' as const,
      isValidated: true,
    });

    const tasks = await taskRepository.findAll();
    expect(tasks).toHaveLength(2);
    expect(
      tasks.some((t) => t.name === 'Task 1' && t.phaseId === testPhase.id)
    ).toBe(true);
    expect(
      tasks.some((t) => t.name === 'Task 2' && t.phaseId === otherPhase.id)
    ).toBe(true);
  });

  it('should update a task, including isValidated', async () => {
    const createdTask = await taskRepository.create({
      name: 'Initial Task',
      phaseId: testPhase.id,
      order: 1,
      status: 'pending' as const,
      isValidated: false,
    });
    const updateData = {
      name: 'Updated Task',
      status: 'completed' as const,
      isValidated: true,
      order: 2,
    };

    await new Promise((resolve) => setTimeout(resolve, 10));
    const updatedTask = await taskRepository.update(createdTask.id, updateData);

    expect(updatedTask).toBeDefined();
    expect(updatedTask!.name).toBe(updateData.name);
    expect(updatedTask!.status).toBe('completed');
    expect(updatedTask!.isValidated).toBe(true);
    expect(updatedTask!.order).toBe(2);
    expect(updatedTask!.updatedAt.getTime()).toBeGreaterThan(
      createdTask.updatedAt.getTime()
    );
  });

  it('should return null when trying to update a non-existent task', async () => {
    const updatedTask = await taskRepository.update(crypto.randomUUID(), {
      name: 'Non Existent Task',
    });
    expect(updatedTask).toBeNull();
  });

  it('should delete a task', async () => {
    const task1 = await taskRepository.create({
      name: 'To Be Deleted Task',
      phaseId: testPhase.id,
      order: 1,
      status: 'pending' as const,
      isValidated: false,
    });
    await taskRepository.create({
      name: 'To Be Kept Task',
      phaseId: testPhase.id,
      order: 2,
      status: 'pending' as const,
      isValidated: false,
    });

    const deleteResult = await taskRepository.delete(task1.id);
    expect(deleteResult).toBe(true);

    const foundDeleted = await taskRepository.findById(task1.id);
    expect(foundDeleted).toBeNull();

    const tasks = await taskRepository.findByPhaseId(testPhase.id);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].name).toBe('To Be Kept Task');
  });

  it('should return false when trying to delete a non-existent task', async () => {
    const deleteResult = await taskRepository.delete(crypto.randomUUID());
    expect(deleteResult).toBe(false);
  });

  // TODO: Add tests for task dependency methods once implemented in TaskRepository
});
