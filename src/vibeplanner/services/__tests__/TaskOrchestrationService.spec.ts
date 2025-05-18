import crypto from 'crypto';
import { beforeEach, describe, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import {
  Phase,
  PhaseSchema,
  PhaseStatusSchema,
  Task,
  TaskSchema,
  TaskStatusSchema,
} from '../../types';
import { DataPersistenceService } from '../DataPersistenceService';
import { PhaseControlService } from '../PhaseControlService';
import { TaskOrchestrationService } from '../TaskOrchestrationService';

// Mock services
const mockDataPersistenceService = mock<DataPersistenceService>();
const mockPhaseControlService = mock<PhaseControlService>();

// Use a factory to provide the mocked service instance for tsyringe
vi.mock('../DataPersistenceService', () => ({
  DataPersistenceService: vi.fn(() => mockDataPersistenceService),
}));
vi.mock('../PhaseControlService', () => ({
  PhaseControlService: vi.fn(() => mockPhaseControlService),
}));

describe('TaskOrchestrationService', () => {
  let taskOrchestrationService: TaskOrchestrationService;
  let samplePhaseId: string;
  let samplePrdId: string;

  beforeEach(() => {
    vi.clearAllMocks();
    taskOrchestrationService = new TaskOrchestrationService(
      mockDataPersistenceService,
      mockPhaseControlService
    );
    samplePhaseId = crypto.randomUUID();
    samplePrdId = crypto.randomUUID();
  });

  const createMockTask = (details: Partial<Task> = {}): Task => {
    const now = new Date();
    return TaskSchema.parse({
      id: crypto.randomUUID(),
      name: 'Sample Task',
      description: 'Sample task description',
      order: 1,
      status: TaskStatusSchema.enum.pending,
      isValidated: false,
      phaseId: samplePhaseId,
      creationDate: now,
      updatedAt: now,
      completionDate: null,
      dependencies: [],
      ...details,
    });
  };

  const createMockPhase = (details: Partial<Phase> = {}): Phase => {
    const now = new Date();
    return PhaseSchema.parse({
      id: samplePhaseId, // Default to samplePhaseId for consistency
      name: 'Sample Phase',
      description: 'Sample phase description',
      order: 1,
      status: PhaseStatusSchema.enum.pending,
      prdId: samplePrdId,
      tasks: [],
      creationDate: now,
      updatedAt: now,
      completionDate: null,
      ...details,
    });
  };

  describe('addTaskToPhase', () => {
    it('should add a task to a phase and call DataPersistenceService.createTask', async () => {
      const taskDetails: AddTaskDetails = {
        name: 'New Task',
        order: 1,
        description: 'New Task Desc',
      };
      const mockCreatedTask = createMockTask({
        ...taskDetails,
        phaseId: samplePhaseId,
      });

      mockDataPersistenceService.createTask.mockResolvedValue(mockCreatedTask);

      const task = await taskOrchestrationService.addTaskToPhase(
        samplePhaseId,
        taskDetails
      );

      expect(mockDataPersistenceService.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          name: taskDetails.name,
          order: taskDetails.order,
          description: taskDetails.description,
          phaseId: samplePhaseId,
          status: TaskStatusSchema.enum.pending,
          isValidated: false,
        })
      );
      expect(task).toEqual(mockCreatedTask);
    });

    it('should add a task with dependencies and call updateTaskDependencies', async () => {
      const depId1 = crypto.randomUUID();
      const taskDetails: AddTaskDetails = {
        name: 'Task With Deps',
        order: 2,
        dependencies: [depId1],
      };
      const createdTaskNoDeps = createMockTask({
        name: taskDetails.name,
        order: taskDetails.order,
        phaseId: samplePhaseId,
        dependencies: [], // createTask initially returns without deps
      });
      const finalTaskWithDeps = createMockTask({
        ...createdTaskNoDeps,
        dependencies: [depId1],
      });

      mockDataPersistenceService.createTask.mockResolvedValue(
        createdTaskNoDeps
      );
      mockDataPersistenceService.updateTaskDependencies.mockResolvedValue(
        undefined
      );
      // Mock getTask to return the task with dependencies after updateTaskDependencies is called
      mockDataPersistenceService.getTaskById.mockResolvedValue(
        finalTaskWithDeps
      );

      const task = await taskOrchestrationService.addTaskToPhase(
        samplePhaseId,
        taskDetails
      );

      expect(mockDataPersistenceService.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          name: taskDetails.name,
          order: taskDetails.order,
        })
      );
      expect(
        mockDataPersistenceService.updateTaskDependencies
      ).toHaveBeenCalledWith(createdTaskNoDeps.id, [depId1]);
      expect(mockDataPersistenceService.getTaskById).toHaveBeenCalledWith(
        createdTaskNoDeps.id
      );
      expect(task).toEqual(finalTaskWithDeps);
      expect(task.dependencies).toEqual([depId1]);
    });

    it('should throw an error if DataPersistenceService.createTask fails', async () => {
      const taskDetails: AddTaskDetails = {
        name: 'New Task Fail',
        order: 1,
      };
      const expectedError = new Error('Create task failed');
      mockDataPersistenceService.createTask.mockRejectedValue(expectedError);

      await expect(
        taskOrchestrationService.addTaskToPhase(samplePhaseId, taskDetails)
      ).rejects.toThrow(expectedError);
    });
  });

  describe('getTask', () => {
    it('should get a task by ID using DataPersistenceService', async () => {
      const taskId = crypto.randomUUID();
      const mockTask = createMockTask({ id: taskId });
      mockDataPersistenceService.getTaskById.mockResolvedValue(mockTask);

      const task = await taskOrchestrationService.getTask(taskId);

      expect(mockDataPersistenceService.getTaskById).toHaveBeenCalledWith(
        taskId
      );
      expect(task).toEqual(mockTask);
    });

    it('should return null if task not found', async () => {
      const taskId = 'non-existent-task';
      mockDataPersistenceService.getTaskById.mockResolvedValue(null);
      const task = await taskOrchestrationService.getTask(taskId);
      expect(task).toBeNull();
    });
  });

  describe('getTasksForPhase', () => {
    it('should get tasks for a phase using DataPersistenceService', async () => {
      const mockTasks = [
        createMockTask(),
        createMockTask({ name: 'Task 2', order: 2 }),
      ];
      mockDataPersistenceService.getTasksByPhaseId.mockResolvedValue(mockTasks);

      const tasks = await taskOrchestrationService.getTasksForPhase(
        samplePhaseId
      );

      expect(mockDataPersistenceService.getTasksByPhaseId).toHaveBeenCalledWith(
        samplePhaseId,
        undefined
      );
      expect(tasks).toEqual(mockTasks);
      expect(tasks.length).toBe(2);
    });

    it('should return an empty array if no tasks found for a phase', async () => {
      mockDataPersistenceService.getTasksByPhaseId.mockResolvedValue([]);
      const tasks = await taskOrchestrationService.getTasksForPhase(
        samplePhaseId
      );
      expect(mockDataPersistenceService.getTasksByPhaseId).toHaveBeenCalledWith(
        samplePhaseId,
        undefined
      );
      expect(tasks).toEqual([]);
    });
  });

  describe('updateTask', () => {
    it('should update task details using DataPersistenceService', async () => {
      const taskId = crypto.randomUUID();
      const initialTask = createMockTask({
        id: taskId,
        status: TaskStatusSchema.enum.pending,
      });
      const updates: UpdateTaskDetails = {
        name: 'Updated Task Name',
        status: TaskStatusSchema.enum.completed,
        isValidated: true,
      };
      const mockUpdatedTask = TaskSchema.parse({
        ...initialTask,
        ...updates,
        updatedAt: new Date(), // Actual date will vary, so we check structure
      });

      mockDataPersistenceService.getTaskById.mockResolvedValue(initialTask);
      mockDataPersistenceService.updateTask.mockResolvedValue(mockUpdatedTask);

      const task = await taskOrchestrationService.updateTask(taskId, updates);

      expect(mockDataPersistenceService.getTaskById).toHaveBeenCalledWith(
        taskId
      );
      expect(mockDataPersistenceService.updateTask).toHaveBeenCalledWith(
        taskId,
        updates
      );
      expect(task).toEqual(mockUpdatedTask);
      expect(task?.name).toBe(updates.name);
      expect(task?.status).toBe(updates.status);
      expect(task?.isValidated).toBe(updates.isValidated);
    });

    it('should return null if task to update is not found', async () => {
      const taskId = 'non-existent-task-id';
      const updates: UpdateTaskDetails = {
        name: 'Updated Task Name',
      };
      mockDataPersistenceService.getTaskById.mockResolvedValue(null);

      const task = await taskOrchestrationService.updateTask(taskId, updates);

      expect(mockDataPersistenceService.getTaskById).toHaveBeenCalledWith(
        taskId
      );
      expect(mockDataPersistenceService.updateTask).not.toHaveBeenCalled();
      expect(task).toBeNull();
    });

    it('should throw an error if update data is invalid', async () => {
      const taskId = crypto.randomUUID();
      const initialTask = createMockTask({ id: taskId });
      const invalidUpdates = {
        order: 'not-a-number', // Invalid type for order
      } as unknown as UpdateTaskDetails;

      mockDataPersistenceService.getTaskById.mockResolvedValue(initialTask);

      await expect(
        taskOrchestrationService.updateTask(taskId, invalidUpdates)
      ).rejects.toThrow(/Invalid task data for update/);
      expect(mockDataPersistenceService.updateTask).not.toHaveBeenCalled();
    });
  });

  describe('getNextTaskForPlan', () => {
    it('should return the first pending task in the first pending/ongoing phase', async () => {
      const phase1 = createMockPhase({
        id: crypto.randomUUID(),
        order: 1,
        status: PhaseStatusSchema.enum.completed,
      });
      const phase2 = createMockPhase({
        id: crypto.randomUUID(),
        order: 2,
        status: PhaseStatusSchema.enum.pending,
      });
      const phase3 = createMockPhase({
        id: crypto.randomUUID(),
        order: 3,
        status: PhaseStatusSchema.enum.pending,
      });

      const task1_phase1 = createMockTask({
        phaseId: phase1.id,
        order: 1,
        status: TaskStatusSchema.enum.completed,
      });

      const task1_phase2 = createMockTask({
        phaseId: phase2.id,
        order: 1,
        status: TaskStatusSchema.enum.pending,
      });
      const task2_phase2 = createMockTask({
        phaseId: phase2.id,
        order: 2,
        status: TaskStatusSchema.enum.pending,
      });

      const task1_phase3 = createMockTask({
        phaseId: phase3.id,
        order: 1,
        status: TaskStatusSchema.enum.pending,
      });

      mockPhaseControlService.getPhasesForPrd.mockResolvedValue([
        phase1,
        phase2,
        phase3,
      ]);
      mockDataPersistenceService.getTasksByPhaseId.mockImplementation(
        async (phaseId: string) => {
          if (phaseId === phase1.id) return [task1_phase1];
          if (phaseId === phase2.id) return [task1_phase2, task2_phase2];
          if (phaseId === phase3.id) return [task1_phase3];
          return [];
        }
      );

      const nextTask = await taskOrchestrationService.getNextTaskForPlan(
        samplePrdId
      );

      expect(mockPhaseControlService.getPhasesForPrd).toHaveBeenCalledWith(
        samplePrdId
      );
      expect(mockDataPersistenceService.getTasksByPhaseId).toHaveBeenCalledWith(
        phase2.id,
        undefined
      );
      expect(nextTask).toEqual(task1_phase2);
    });

    it('should skip completed tasks and return the next pending one in order', async () => {
      const phase1 = createMockPhase({
        id: crypto.randomUUID(),
        order: 1,
        status: PhaseStatusSchema.enum.in_progress,
      });
      const task1_phase1 = createMockTask({
        phaseId: phase1.id,
        order: 1,
        status: TaskStatusSchema.enum.completed,
      });
      const task2_phase1 = createMockTask({
        phaseId: phase1.id,
        order: 2,
        status: TaskStatusSchema.enum.pending,
      });
      const task3_phase1 = createMockTask({
        phaseId: phase1.id,
        order: 3,
        status: TaskStatusSchema.enum.pending,
      });

      mockPhaseControlService.getPhasesForPrd.mockResolvedValue([phase1]);
      mockDataPersistenceService.getTasksByPhaseId.mockResolvedValue([
        task1_phase1,
        task2_phase1,
        task3_phase1,
      ]);

      const nextTask = await taskOrchestrationService.getNextTaskForPlan(
        samplePrdId
      );
      expect(nextTask).toEqual(task2_phase1);
    });

    it('should return the first pending task in an ongoing phase if previous phases are done', async () => {
      const phase1 = createMockPhase({
        id: crypto.randomUUID(),
        order: 1,
        status: PhaseStatusSchema.enum.completed,
      });
      const phase2 = createMockPhase({
        id: crypto.randomUUID(),
        order: 2,
        status: PhaseStatusSchema.enum.in_progress,
      });

      const task1_phase2 = createMockTask({
        phaseId: phase2.id,
        order: 1,
        status: TaskStatusSchema.enum.pending,
      });

      mockPhaseControlService.getPhasesForPrd.mockResolvedValue([
        phase1,
        phase2,
      ]);
      mockDataPersistenceService.getTasksByPhaseId.mockImplementation(
        async (pId: string) => (pId === phase2.id ? [task1_phase2] : [])
      );

      const nextTask = await taskOrchestrationService.getNextTaskForPlan(
        samplePrdId
      );
      expect(nextTask).toEqual(task1_phase2);
    });

    it('should return null if no phases exist for the PRD', async () => {
      mockPhaseControlService.getPhasesForPrd.mockResolvedValue([]);
      const nextTask = await taskOrchestrationService.getNextTaskForPlan(
        samplePrdId
      );
      expect(nextTask).toBeNull();
    });

    it('should return null if all phases are completed', async () => {
      const phase1 = createMockPhase({
        status: PhaseStatusSchema.enum.completed,
      });
      mockPhaseControlService.getPhasesForPrd.mockResolvedValue([phase1]);
      const nextTask = await taskOrchestrationService.getNextTaskForPlan(
        samplePrdId
      );
      expect(nextTask).toBeNull();
    });

    it('should return null if a pending phase has no tasks', async () => {
      const phase1 = createMockPhase({
        status: PhaseStatusSchema.enum.pending,
      });
      mockPhaseControlService.getPhasesForPrd.mockResolvedValue([phase1]);
      mockDataPersistenceService.getTasksByPhaseId.mockResolvedValue([]); // No tasks for this phase

      const nextTask = await taskOrchestrationService.getNextTaskForPlan(
        samplePrdId
      );
      expect(nextTask).toBeNull();
      expect(mockDataPersistenceService.getTasksByPhaseId).toHaveBeenCalledWith(
        phase1.id,
        undefined
      );
    });

    it('should return null if all tasks in pending/ongoing phases are completed or not pending/ongoing', async () => {
      const phase1 = createMockPhase({
        order: 1,
        status: PhaseStatusSchema.enum.pending,
      });
      const task1_phase1 = createMockTask({
        phaseId: phase1.id,
        order: 1,
        status: TaskStatusSchema.enum.completed,
      });
      const task2_phase1 = createMockTask({
        phaseId: phase1.id,
        order: 2,
        status: TaskStatusSchema.enum.blocked,
      });

      mockPhaseControlService.getPhasesForPrd.mockResolvedValue([phase1]);
      mockDataPersistenceService.getTasksByPhaseId.mockResolvedValue([
        task1_phase1,
        task2_phase1,
      ]);

      const nextTask = await taskOrchestrationService.getNextTaskForPlan(
        samplePrdId
      );
      expect(nextTask).toBeNull();
    });

    it('should respect task dependencies: return task if dependencies are met (completed or validated)', async () => {
      const phase1 = createMockPhase({
        id: crypto.randomUUID(),
        order: 1,
        status: PhaseStatusSchema.enum.pending,
      });
      const depTask1 = createMockTask({
        id: crypto.randomUUID(),
        phaseId: phase1.id,
        order: 1,
        status: TaskStatusSchema.enum.completed,
      });
      const depTask2 = createMockTask({
        id: crypto.randomUUID(),
        phaseId: phase1.id,
        order: 2,
        status: TaskStatusSchema.enum.pending,
        isValidated: true,
      });
      const targetTask = createMockTask({
        phaseId: phase1.id,
        order: 3,
        status: TaskStatusSchema.enum.pending,
        dependencies: [depTask1.id, depTask2.id],
      });

      mockPhaseControlService.getPhasesForPrd.mockResolvedValue([phase1]);
      // The main loop iterates tasks from getTasksByPhaseId. For this test, targetTask is the candidate.
      mockDataPersistenceService.getTasksByPhaseId.mockResolvedValue([
        targetTask,
      ]);
      mockDataPersistenceService.getTaskById.mockImplementation(
        async (taskId: string) => {
          if (taskId === depTask1.id) return depTask1;
          if (taskId === depTask2.id) return depTask2;
          // if (taskId === targetTask.id) return targetTask; // targetTask is already from getTasksByPhaseId
          return null;
        }
      );

      const nextTask = await taskOrchestrationService.getNextTaskForPlan(
        samplePrdId
      );
      expect(nextTask).toEqual(targetTask);
    });

    it('should respect task dependencies: not return task if a dependency is not met', async () => {
      const phase1 = createMockPhase({
        id: crypto.randomUUID(),
        order: 1,
        status: PhaseStatusSchema.enum.pending,
      });
      const depTask1 = createMockTask({
        id: crypto.randomUUID(),
        phaseId: phase1.id,
        order: 1,
        status: TaskStatusSchema.enum.completed,
      }); // Met dependency
      const depTask2 = createMockTask({
        id: crypto.randomUUID(),
        phaseId: phase1.id,
        order: 2,
        status: TaskStatusSchema.enum.pending,
        isValidated: false,
      }); // Unmet dependency
      const targetTask = createMockTask({
        phaseId: phase1.id,
        order: 3,
        status: TaskStatusSchema.enum.pending,
        dependencies: [depTask1.id, depTask2.id],
      });
      const unrelatedTask = createMockTask({
        phaseId: phase1.id,
        order: 4,
        status: TaskStatusSchema.enum.pending,
      }); // Next available

      mockPhaseControlService.getPhasesForPrd.mockResolvedValue([phase1]);
      // Main loop iterates targetTask then unrelatedTask
      mockDataPersistenceService.getTasksByPhaseId.mockResolvedValue([
        targetTask,
        unrelatedTask,
      ]);
      mockDataPersistenceService.getTaskById.mockImplementation(
        async (taskId: string) => {
          if (taskId === depTask1.id) return depTask1;
          if (taskId === depTask2.id) return depTask2;
          return null;
        }
      );

      const nextTask = await taskOrchestrationService.getNextTaskForPlan(
        samplePrdId
      );
      expect(nextTask).toEqual(unrelatedTask);
    });

    it('should return the first available task if a task with unmet dependencies is followed by a task with no dependencies', async () => {
      const phase1 = createMockPhase({
        id: crypto.randomUUID(),
        order: 1,
        status: PhaseStatusSchema.enum.pending,
      });
      const depTaskUnmet = createMockTask({
        id: crypto.randomUUID(),
        phaseId: phase1.id,
        order: 1,
        status: TaskStatusSchema.enum.pending,
        isValidated: false,
      });
      const taskWithUnmetDep = createMockTask({
        phaseId: phase1.id,
        order: 2,
        status: TaskStatusSchema.enum.pending,
        dependencies: [depTaskUnmet.id],
      });
      const taskWithoutDep = createMockTask({
        phaseId: phase1.id,
        order: 3,
        status: TaskStatusSchema.enum.pending,
      });

      mockPhaseControlService.getPhasesForPrd.mockResolvedValue([phase1]);
      // Main loop iterates taskWithUnmetDep then taskWithoutDep
      mockDataPersistenceService.getTasksByPhaseId.mockResolvedValue([
        taskWithUnmetDep,
        taskWithoutDep,
      ]);
      mockDataPersistenceService.getTaskById.mockImplementation(
        async (taskId: string) => {
          if (taskId === depTaskUnmet.id) return depTaskUnmet;
          return null;
        }
      );

      const nextTask = await taskOrchestrationService.getNextTaskForPlan(
        samplePrdId
      );
      expect(nextTask).toEqual(taskWithoutDep);
    });

    it('should correctly handle phase and task ordering for getNextTaskForPlan', async () => {
      const phase1Id = crypto.randomUUID();
      const phase2Id = crypto.randomUUID();

      const p1 = createMockPhase({
        id: phase1Id,
        order: 1,
        status: PhaseStatusSchema.enum.pending,
      });
      const p2 = createMockPhase({
        id: phase2Id,
        order: 2,
        status: PhaseStatusSchema.enum.pending,
      });

      const t1p1 = createMockTask({
        id: crypto.randomUUID(),
        phaseId: phase1Id,
        order: 1,
        status: TaskStatusSchema.enum.completed,
      });
      const t2p1 = createMockTask({
        id: crypto.randomUUID(),
        phaseId: phase1Id,
        order: 2,
        status: TaskStatusSchema.enum.pending,
      });
      const t1p2 = createMockTask({
        id: crypto.randomUUID(),
        phaseId: phase2Id,
        order: 1,
        status: TaskStatusSchema.enum.pending,
      });

      mockPhaseControlService.getPhasesForPrd.mockResolvedValue([p2, p1]); // Deliberately unsorted
      mockDataPersistenceService.getTasksByPhaseId.mockImplementation(
        async (phaseId: string, statusFilter?: TaskStatus[]) => {
          if (phaseId === phase1Id) return [t2p1, t1p1]; // Deliberately unsorted
          if (phaseId === phase2Id) return [t1p2];
          return [];
        }
      );

      const nextTask = await taskOrchestrationService.getNextTaskForPlan(
        samplePrdId
      );
      expect(nextTask).toEqual(t2p1);
    });
  });
});
