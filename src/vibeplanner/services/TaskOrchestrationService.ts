import { inject, singleton } from 'tsyringe';
import {
  PhaseStatusSchema,
  Task,
  TaskSchema,
  TaskStatus,
  TaskStatusSchema,
} from '../types';
import { DataPersistenceService } from './DataPersistenceService';
import { PhaseControlService } from './PhaseControlService';

export interface AddTaskDetails {
  name: string;
  description?: string;
  order: number;
  validationCommand?: string;
  // Optional fields that might be part of task creation
  notes?: string;
  dependencies?: string[]; // Task IDs
}

export interface UpdateTaskDetails {
  name?: string;
  description?: string;
  order?: number;
  status?: TaskStatus;
  validationCommand?: string;
  validationOutput?: string;
  notes?: string;
  isValidated?: boolean;
  dependencies?: string[];
  validationOutcome?: 'success' | 'failure';
}

@singleton()
export class TaskOrchestrationService {
  constructor(
    @inject(DataPersistenceService)
    private dataPersistenceService: DataPersistenceService,
    @inject(PhaseControlService)
    private phaseControlService: PhaseControlService
  ) {}

  async addTaskToPhase(
    phaseId: string,
    taskData: AddTaskDetails
  ): Promise<Task> {
    const now = new Date();
    const fullTaskData: Omit<Task, 'id'> = {
      ...taskData,
      phaseId,
      status: TaskStatusSchema.enum.pending,
      isValidated: false,
      creationDate: now,
      updatedAt: now,
      // Ensure all TaskSchema fields are present or optional
      description: taskData.description ?? '',
      dependencies: taskData.dependencies ?? [],
      validationCommand: taskData.validationCommand,
      validationOutput: undefined, // Or some default
      notes: taskData.notes,
    };
    // Validate with Zod before sending to persistence, minus the ID.
    // TaskSchema expects an id, but createNewTaskInPhase will generate it.
    // So we construct what createNewTaskInPhase expects.
    const taskToCreate = {
      name: fullTaskData.name,
      phaseId: fullTaskData.phaseId,
      order: fullTaskData.order,
      status: fullTaskData.status,
      creationDate: fullTaskData.creationDate,
      updatedAt: fullTaskData.updatedAt,
      isValidated: fullTaskData.isValidated,
      description: fullTaskData.description,
      validationCommand: fullTaskData.validationCommand,
      validationOutput: fullTaskData.validationOutput,
      notes: fullTaskData.notes,
    };

    // The createTask method in DataPersistenceService expects Omit<Task, 'id' | 'creationDate' | 'updatedAt' | 'completionDate' | 'dependencies'>
    const createdTask = await this.dataPersistenceService.createTask(
      taskToCreate
    );

    // If dependencies were provided in the original taskData, update them now
    if (
      createdTask &&
      fullTaskData.dependencies &&
      fullTaskData.dependencies.length > 0
    ) {
      await this.dataPersistenceService.updateTaskDependencies(
        createdTask.id,
        fullTaskData.dependencies
      );
      // Re-fetch task to include dependencies
      const taskWithDeps = await this.getTask(createdTask.id);
      if (!taskWithDeps) {
        // This case should ideally not happen if creation and fetching are consistent
        throw new Error('Failed to retrieve task after updating dependencies');
      }
      return taskWithDeps;
    }
    return createdTask;
  }

  async getTask(taskId: string): Promise<Task | null> {
    return this.dataPersistenceService.getTaskById(taskId);
  }

  async getTasksForPhase(
    phaseId: string,
    statusFilter?: TaskStatus[]
  ): Promise<Task[]> {
    // The actual filtering logic will be pushed down to DataPersistenceService
    const tasks = await this.dataPersistenceService.getTasksByPhaseId(
      phaseId,
      statusFilter
    );
    // Ensure tasks are sorted by order if not guaranteed by persistence with filter
    // However, TaskRepository.findByPhaseId already sorts by order. We need to ensure
    // the new version in DataPersistenceService and TaskRepository maintains this with status filtering.
    return tasks.sort((a, b) => a.order - b.order);
  }

  async updateTask(
    taskId: string,
    updates: UpdateTaskDetails
  ): Promise<Task | null> {
    const task = await this.getTask(taskId);
    if (!task) {
      return null;
    }

    // Separate validationOutcome from other updates
    const { validationOutcome, ...otherUpdates } = updates;
    // Initialize processedUpdates with updates that are actual Task fields
    const processedUpdates: Partial<
      | Omit<Task, 'id' | 'creationDate' | 'phaseId'>
      | { status?: TaskStatus; isValidated?: boolean }
    > = { ...otherUpdates };

    // Handle validation outcome
    if (validationOutcome) {
      if (validationOutcome === 'success') {
        processedUpdates.status = TaskStatusSchema.enum.validated;
        processedUpdates.isValidated = true;
      } else {
        // 'failure'
        processedUpdates.status = TaskStatusSchema.enum.needs_review;
        processedUpdates.isValidated = false;
      }
    } else if (updates.status === TaskStatusSchema.enum.validated) {
      // If status is directly set to validated, ensure isValidated is true
      // This also handles the case where `updates.isValidated` might be false/undefined but status is 'validated'
      processedUpdates.isValidated = true;
    } else if (
      updates.status &&
      updates.status !== TaskStatusSchema.enum.validated &&
      updates.isValidated === undefined
    ) {
      // If status is being changed to something other than validated, and isValidated is not explicitly set in the updates,
      // and the task was previously validated, then mark it as not validated anymore.
      if (task.status === TaskStatusSchema.enum.validated) {
        processedUpdates.isValidated = false;
      }
    } else if (updates.isValidated !== undefined) {
      // If isValidated is explicitly provided in updates (and not handled by validationOutcome or direct validated status setting)
      // ensure it's part of processedUpdates.
      processedUpdates.isValidated = updates.isValidated;
    }

    // Merge updates with existing task data for Zod validation
    // Ensure `updatedAt` is part of the final object for validation if it's a required field in TaskSchema after merge
    const updatedTaskDataForValidation = {
      ...task,
      ...processedUpdates,
      updatedAt: new Date(),
    };

    const validationResult = TaskSchema.safeParse(updatedTaskDataForValidation);
    if (!validationResult.success) {
      console.error(
        'Validation failed for task update:',
        validationResult.error
      );
      throw new Error(
        `Invalid task data for update: ${validationResult.error.message}`
      );
    }

    // Pass only the processed updates to the persistence service
    // DataPersistenceService.updateTask expects Partial<Omit<Task, 'id' | 'creationDate' | 'updatedAt' | 'phaseId' | 'dependencies'>>
    // We need to ensure `processedUpdates` conforms to this or a compatible subset.
    // The current `processedUpdates` might include fields like `status`, `isValidated`, `name`, `description`, `order`, `validationCommand`, `validationOutput`, `notes`.
    // `updatedAt` will be handled by persistence layer or should be added to `processedUpdates` if expected by `dataPersistenceService.updateTask`.
    // For now, assuming `dataPersistenceService.updateTask` can handle these fields.
    // If `dataPersistenceService.updateTask` requires `updatedAt`, it should be: { ...processedUpdates, updatedAt: new Date() }
    // However, typically `updatedAt` is set by the persistence layer itself.

    return this.dataPersistenceService.updateTask(taskId, processedUpdates);
  }

  async getNextTaskForPlan(prdId: string): Promise<Task | null> {
    const phases = await this.phaseControlService.getPhasesForPrd(prdId);
    if (!phases || phases.length === 0) {
      return null;
    }

    // Sort phases by order
    phases.sort((a, b) => a.order - b.order);

    for (const phase of phases) {
      if (
        phase.status === PhaseStatusSchema.enum.pending ||
        phase.status === PhaseStatusSchema.enum.in_progress
      ) {
        const tasks = await this.getTasksForPhase(phase.id);
        if (!tasks || tasks.length === 0) {
          continue;
        }
        // Sort tasks by order
        tasks.sort((a, b) => a.order - b.order);

        for (const task of tasks) {
          if (
            task.status === TaskStatusSchema.enum.pending ||
            task.status === TaskStatusSchema.enum.in_progress
          ) {
            // Check dependencies
            if (task.dependencies && task.dependencies.length > 0) {
              let allDependenciesMet = true;
              for (const depId of task.dependencies) {
                const depTask = await this.getTask(depId);
                if (
                  !depTask ||
                  (depTask.status !== TaskStatusSchema.enum.completed &&
                    !depTask.isValidated)
                ) {
                  allDependenciesMet = false;
                  break;
                }
              }
              if (allDependenciesMet) {
                return task;
              }
            } else {
              // No dependencies, this task is next
              return task;
            }
          }
        }
      }
    }
    return null; // No actionable task found
  }
}
