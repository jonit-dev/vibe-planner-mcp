import fs from 'fs';
import path from 'path';
import { beforeEach, describe, expect, it } from 'vitest';
import { db, initializeSchema } from '../../services/db';
import { VibePlannerTool } from '../index'; // PlanOverview is also exported here
import { PhaseRepository } from '../repositories/PhaseRepository';
import { PrdRepository } from '../repositories/PrdRepository';
import { TaskRepository } from '../repositories/TaskRepository';
import { DataPersistenceService } from '../services/DataPersistenceService';
import { PhaseControlService } from '../services/PhaseControlService';
import { TaskOrchestrationService } from '../services/TaskOrchestrationService';
import {
  TaskStatusSchema,
  type Task as RequestValidationScopeTask,
  type Task as UpdateTaskScopeTask,
} from '../types'; // Correctly importing TaskStatusSchema

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
    db.exec('DELETE FROM task_dependencies;');
    db.exec('DELETE FROM tasks;');
    db.exec('DELETE FROM phases;');
    db.exec('DELETE FROM prds;');
  } catch (error) {
    // console.warn('Warning: Could not delete all data', (error as Error).message);
  }
  initializeSchema(ddl);
};

const mockMcpContext = {}; // Simple mock context

describe('VibePlannerTool Integration Tests', () => {
  let vibePlannerTool: VibePlannerTool;
  let prdRepository: PrdRepository;
  let phaseRepository: PhaseRepository;
  let taskRepository: TaskRepository;
  let dataPersistenceService: DataPersistenceService;
  let phaseControlService: PhaseControlService;
  let taskOrchestrationService: TaskOrchestrationService;
  // PrdLifecycleService is instantiated by VibePlannerTool internally, no need for a separate instance here for these tests.

  beforeEach(async () => {
    process.env.NODE_ENV = 'test';
    resetDatabase();

    vibePlannerTool = new VibePlannerTool();

    prdRepository = new PrdRepository();
    phaseRepository = new PhaseRepository();
    taskRepository = new TaskRepository();
    dataPersistenceService = new DataPersistenceService(
      prdRepository,
      phaseRepository,
      taskRepository
    );
    phaseControlService = new PhaseControlService(dataPersistenceService);
    taskOrchestrationService = new TaskOrchestrationService(
      dataPersistenceService,
      phaseControlService
    );
  });

  describe('startNewPlan', () => {
    it('should create a new plan (PRD) and return its ID', async () => {
      const planName = 'Test Plan Alpha';
      const planDescription = 'Description for Alpha';
      const result = await vibePlannerTool.startNewPlan(mockMcpContext, {
        name: planName,
        description: planDescription,
      });

      expect(result.planId).toBeTypeOf('string');
      expect(result.firstTask).toBeUndefined();

      const prd = await dataPersistenceService.getPrdById(result.planId);
      expect(prd).not.toBeNull();
      expect(prd?.name).toBe(planName);
      expect(prd?.description).toBe(planDescription);
      expect(prd?.status).toBe('pending');
    });
  });

  describe('getPlanStatus', () => {
    it('should return null if planId does not exist', async () => {
      const status = await vibePlannerTool.getPlanStatus(
        mockMcpContext,
        'non-existent-id'
      );
      expect(status).toBeNull();
    });

    it('should return plan status with empty phases if no phases are created', async () => {
      const { planId } = await vibePlannerTool.startNewPlan(mockMcpContext, {
        name: 'Plan Beta',
        description: 'Description for Beta',
      });

      const planStatus = await vibePlannerTool.getPlanStatus(
        mockMcpContext,
        planId
      );

      expect(planStatus).not.toBeNull();
      expect(planStatus?.id).toBe(planId);
      expect(planStatus?.name).toBe('Plan Beta');
      expect(planStatus?.phases).toBeInstanceOf(Array);
      expect(planStatus?.phases).toHaveLength(0);
    });

    it('should return plan status with phases and tasks', async () => {
      const { planId } = await vibePlannerTool.startNewPlan(mockMcpContext, {
        name: 'Plan Gamma',
        description: 'Description for Gamma',
      });

      // Use the phaseControlService and taskOrchestrationService initialized in beforeEach
      const phase1 = await phaseControlService.addPhaseToPrd(planId, {
        name: 'Phase 1',
        order: 1,
      });

      const task1 = await taskOrchestrationService.addTaskToPhase(phase1.id, {
        name: 'Task 1.1',
        order: 1,
      });
      const task2 = await taskOrchestrationService.addTaskToPhase(phase1.id, {
        name: 'Task 1.2',
        order: 2,
      });

      const planStatus = await vibePlannerTool.getPlanStatus(
        mockMcpContext,
        planId
      );

      expect(planStatus).not.toBeNull();
      expect(planStatus?.id).toBe(planId);
      expect(planStatus?.name).toBe('Plan Gamma');
      expect(planStatus?.phases).toHaveLength(1);

      const overviewPhase = planStatus!.phases[0];
      expect(overviewPhase.id).toBe(phase1.id);
      expect(overviewPhase.name).toBe('Phase 1');
      expect(overviewPhase.tasks).toHaveLength(2);
      expect(overviewPhase.tasks[0].id).toBe(task1.id);
      expect(overviewPhase.tasks[0].name).toBe('Task 1.1');
      expect(overviewPhase.tasks[1].id).toBe(task2.id);
      expect(overviewPhase.tasks[1].name).toBe('Task 1.2');
    });
  });

  describe('getNextTask', () => {
    it('should return null if no plan exists or plan has no tasks', async () => {
      const task = await vibePlannerTool.getNextTask(
        mockMcpContext,
        'non-existent-plan'
      );
      expect(task).toBeNull();

      const { planId } = await vibePlannerTool.startNewPlan(mockMcpContext, {
        name: 'Empty Plan',
        description: 'This plan has no phases or tasks',
      });
      const taskFromEmptyPlan = await vibePlannerTool.getNextTask(
        mockMcpContext,
        planId
      );
      expect(taskFromEmptyPlan).toBeNull();
    });

    it('should return the first pending task in order', async () => {
      const { planId } = await vibePlannerTool.startNewPlan(mockMcpContext, {
        name: 'Plan Delta',
        description: '',
      });
      const phase1 = await phaseControlService.addPhaseToPrd(planId, {
        name: 'P1',
        order: 1,
      });
      const task1_1 = await taskOrchestrationService.addTaskToPhase(phase1.id, {
        name: 'T1.1',
        order: 1,
      });
      await taskOrchestrationService.addTaskToPhase(phase1.id, {
        name: 'T1.2',
        order: 2,
      }); // T1.2

      const nextTask = await vibePlannerTool.getNextTask(
        mockMcpContext,
        planId
      );
      expect(nextTask).not.toBeNull();
      expect(nextTask?.id).toBe(task1_1.id);
      expect(nextTask?.name).toBe('T1.1');
    });

    it('should return the next available task if earlier tasks are completed/validated', async () => {
      const { planId } = await vibePlannerTool.startNewPlan(mockMcpContext, {
        name: 'Plan Epsilon',
        description: '',
      });
      const phase1 = await phaseControlService.addPhaseToPrd(planId, {
        name: 'P1',
        order: 1,
      });

      const task1 = await taskOrchestrationService.addTaskToPhase(phase1.id, {
        name: 'T1',
        order: 1,
      });
      const task2 = await taskOrchestrationService.addTaskToPhase(phase1.id, {
        name: 'T2',
        order: 2,
      });

      // Complete task1
      await vibePlannerTool.updateTaskStatus(
        mockMcpContext,
        task1.id,
        TaskStatusSchema.enum.completed
      );

      let nextTask = await vibePlannerTool.getNextTask(mockMcpContext, planId);
      expect(nextTask?.id).toBe(task2.id);

      // Validate task2 (which also sets it to a form of completion for getNextTask logic)
      await vibePlannerTool.updateTaskStatus(
        mockMcpContext,
        task2.id,
        TaskStatusSchema.enum.validated
      );
      nextTask = await vibePlannerTool.getNextTask(mockMcpContext, planId);
      expect(nextTask).toBeNull(); // No more tasks
    });
    it('should respect task dependencies', async () => {
      const { planId } = await vibePlannerTool.startNewPlan(mockMcpContext, {
        name: 'Plan Zeta',
        description: '',
      });
      const phase1 = await phaseControlService.addPhaseToPrd(planId, {
        name: 'P1',
        order: 1,
      });

      const taskDep = await taskOrchestrationService.addTaskToPhase(phase1.id, {
        name: 'Dependency Task',
        order: 1,
      });
      const mainTask = await taskOrchestrationService.addTaskToPhase(
        phase1.id,
        {
          name: 'Main Task',
          order: 2,
          dependencies: [taskDep.id],
        }
      );

      let nextTask = await vibePlannerTool.getNextTask(mockMcpContext, planId);
      expect(nextTask?.id).toBe(taskDep.id); // Dependency task should come first

      // Complete dependency task
      await vibePlannerTool.updateTaskStatus(
        mockMcpContext,
        taskDep.id,
        TaskStatusSchema.enum.validated
      );

      nextTask = await vibePlannerTool.getNextTask(mockMcpContext, planId);
      expect(nextTask?.id).toBe(mainTask.id); // Now main task should be available
    });
  });

  describe('updateTaskStatus', () => {
    let planId: string;
    let task1: UpdateTaskScopeTask;

    beforeEach(async () => {
      // Setup a plan with a task
      const planResult = await vibePlannerTool.startNewPlan(mockMcpContext, {
        name: 'Plan Eta',
        description: '',
      });
      planId = planResult.planId;
      const phase1 = await phaseControlService.addPhaseToPrd(planId, {
        name: 'P1',
        order: 1,
      });
      task1 = await taskOrchestrationService.addTaskToPhase(phase1.id, {
        name: 'Task To Update',
        order: 1,
      });
    });

    it('should update task status and details correctly', async () => {
      await vibePlannerTool.updateTaskStatus(
        mockMcpContext,
        task1.id,
        TaskStatusSchema.enum.in_progress,
        { notes: 'Work has started' }
      );

      const updatedTask = await taskOrchestrationService.getTask(task1.id);
      expect(updatedTask).not.toBeNull();
      expect(updatedTask?.status).toBe(TaskStatusSchema.enum.in_progress);
      expect(updatedTask?.notes).toBe('Work has started');
    });

    it('should handle validation details and update status accordingly (e.g., to validated)', async () => {
      await vibePlannerTool.updateTaskStatus(
        mockMcpContext,
        task1.id,
        TaskStatusSchema.enum.completed, // User marks as completed first
        {
          validationOutput: 'All tests passed',
          exitCode: 0,
          notes: 'Validation run',
        }
      );
      // The TaskOrchestrationService.updateTask logic should interpret exitCode 0 (with validationCommand present)
      // as success and move to 'validated' and set isValidated to true.
      // For this test to be fully accurate, task1 should have a validationCommand.
      // Let's update task1 to have a validation command first using service directly.
      await taskOrchestrationService.updateTask(task1.id, {
        validationCommand: 'echo tests',
      });

      // Now call the tool method that includes exit code which triggers internal validation interpretation
      await vibePlannerTool.updateTaskStatus(
        mockMcpContext,
        task1.id,
        TaskStatusSchema.enum.completed, // Status might be ignored if exitCode implies validation
        {
          validationOutput: 'All tests passed',
          exitCode: 0,
          notes: 'Validation run',
        }
      );

      const validatedTask = await taskOrchestrationService.getTask(task1.id);
      expect(validatedTask).not.toBeNull();
      expect(validatedTask?.status).toBe(TaskStatusSchema.enum.validated);
      expect(validatedTask?.isValidated).toBe(true);
      expect(validatedTask?.validationOutput).toBe('All tests passed'); // Or processed output
      expect(validatedTask?.notes).toBe('Validation run');
    });

    it('should handle validation failure (e.g., to needs_review or failed)', async () => {
      await taskOrchestrationService.updateTask(task1.id, {
        validationCommand: 'echo fail_tests',
      });

      await vibePlannerTool.updateTaskStatus(
        mockMcpContext,
        task1.id,
        TaskStatusSchema.enum.completed, // Status might be ignored if exitCode implies validation
        {
          validationOutput: 'Some tests failed',
          exitCode: 1,
          notes: 'Validation failed',
        }
      );

      const failedTask = await taskOrchestrationService.getTask(task1.id);
      expect(failedTask).not.toBeNull();
      // Depending on interpretValidationResult, status could be 'needs_review' or 'failed'
      // TaskOrchestrationService sets it to 'needs_review' for non-zero exit code
      expect(failedTask?.status).toBe(TaskStatusSchema.enum.needs_review);
      expect(failedTask?.isValidated).toBe(false);
      expect(failedTask?.validationOutput).toContain('Some tests failed');
      expect(failedTask?.notes).toBe('Validation failed');
    });

    it('should do nothing or log error if task ID is invalid (as method is void)', async () => {
      // VibePlannerTool.updateTaskStatus is void, so we can't assert on its direct return.
      // We check that a console.error was called, or that other tasks were not affected.
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await vibePlannerTool.updateTaskStatus(
        mockMcpContext,
        'invalid-task-id',
        TaskStatusSchema.enum.completed
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to update task invalid-task-id')
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('requestTaskValidation', () => {
    let planId: string;
    let taskWithCommand: RequestValidationScopeTask;
    let taskWithoutCommand: RequestValidationScopeTask;

    beforeEach(async () => {
      const planResult = await vibePlannerTool.startNewPlan(mockMcpContext, {
        name: 'Plan Theta',
        description: '',
      });
      planId = planResult.planId;
      const phase1 = await phaseControlService.addPhaseToPrd(planId, {
        name: 'P1',
        order: 1,
      });
      taskWithCommand = await taskOrchestrationService.addTaskToPhase(
        phase1.id,
        {
          name: 'Task With Validation',
          order: 1,
          validationCommand: 'yarn test:specific',
        }
      );
      taskWithoutCommand = await taskOrchestrationService.addTaskToPhase(
        phase1.id,
        {
          name: 'Task Without Validation',
          order: 2,
        }
      );
    });

    it('should return validation command if task and command exist', async () => {
      const result = await vibePlannerTool.requestTaskValidation(
        mockMcpContext,
        taskWithCommand.id
      );
      expect(result).not.toBeNull();
      expect(result?.validationCommand).toBe('yarn test:specific');
    });

    it('should return null if task exists but has no validation command', async () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});
      const result = await vibePlannerTool.requestTaskValidation(
        mockMcpContext,
        taskWithoutCommand.id
      );
      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          `Task ${taskWithoutCommand.id} found, but has no validation command.`
        )
      );
      consoleWarnSpy.mockRestore();
    });

    it('should return null and log error if task ID is invalid', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const result = await vibePlannerTool.requestTaskValidation(
        mockMcpContext,
        'invalid-task-id'
      );
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Task invalid-task-id not found for validation request.'
        )
      );
      consoleErrorSpy.mockRestore();
    });
  });

  // More tests will follow for other methods...
});
