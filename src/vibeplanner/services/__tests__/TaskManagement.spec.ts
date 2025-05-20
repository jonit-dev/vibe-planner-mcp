import crypto from 'crypto';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  MockInstance,
  vi,
} from 'vitest'; // Added afterEach
import { mock } from 'vitest-mock-extended'; // Import mock
import { LoggerService } from '../../../services/LoggerService'; // Added import
import { PhaseRepository } from '../../repositories/PhaseRepository';
import { PrdRepository } from '../../repositories/PrdRepository';
import { TaskRepository } from '../../repositories/TaskRepository';
import { Phase, Prd, Task, TaskStatus } from '../../types'; // Prd, Phase, PhaseStatus might be removable
import { DataPersistenceService } from '../DataPersistenceService';
import { RepositoryProvider } from '../RepositoryProvider';

// Hoist the mock functions - these are used in deleteTask
const { mockDbRun, mockDbPrepare, mockDbTransaction } = vi.hoisted(() => {
  const mockDbRunFn = vi.fn();
  const mockDbPrepareFn = vi.fn(() => ({ run: mockDbRunFn }));
  const mockDbTransactionFn = vi.fn((cb) => cb()); // Used by service.deleteTask
  return {
    mockDbRun: mockDbRunFn,
    mockDbPrepare: mockDbPrepareFn,
    mockDbTransaction: mockDbTransactionFn,
  };
});

vi.mock('../../../services/db', () => ({
  db: {
    prepare: mockDbPrepare,
    transaction: mockDbTransaction, // deleteTask uses transaction
    exec: vi.fn(),
  },
  initializeSchema: vi.fn(),
  closeDbConnection: vi.fn(),
}));

vi.mock('../../repositories/PrdRepository');
vi.mock('../../repositories/PhaseRepository');
vi.mock('../../repositories/TaskRepository');

// Helper functions for creating mock data
const createMockPrd = (overrides: Partial<Prd> = {}): Prd => ({
  // Likely not needed
  id: crypto.randomUUID(),
  name: 'Test PRD',
  description: 'A PRD for testing',
  status: 'pending',
  creationDate: new Date(),
  updatedAt: new Date(),
  completionDate: null,
  phases: [],
  ...overrides,
});

const createMockPhase = (overrides: Partial<Phase> = {}): Phase => ({
  // Likely not needed
  id: crypto.randomUUID(),
  prdId: crypto.randomUUID(),
  name: 'Test Phase',
  order: 1,
  description: 'A phase for testing',
  status: 'pending',
  creationDate: new Date(),
  updatedAt: new Date(),
  completionDate: null,
  tasks: [],
  ...overrides,
});

const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: crypto.randomUUID(),
  phaseId: crypto.randomUUID(),
  name: 'Test Task',
  description: 'A task for testing',
  order: 1,
  status: 'pending',
  isValidated: false,
  creationDate: new Date(),
  updatedAt: new Date(),
  completionDate: null,
  dependencies: [],
  ...overrides,
});

describe('DataPersistenceService - Task Management', () => {
  let service: DataPersistenceService;
  let mockPrdRepository: {
    /* ... */ create: MockInstance;
    findById: MockInstance;
    findAll: MockInstance;
    update: MockInstance;
    delete: MockInstance;
  }; // Keep for consistency
  let mockPhaseRepository: {
    /* ... */ create: MockInstance;
    findById: MockInstance;
    findByPrdId: MockInstance;
    update: MockInstance;
    delete: MockInstance;
  }; // Keep for consistency
  let mockTaskRepository: {
    create: MockInstance;
    findById: MockInstance;
    findByPhaseId: MockInstance;
    update: MockInstance;
    delete: MockInstance;
    getDependencies: MockInstance;
    addDependency: MockInstance;
    removeDependency: MockInstance;
  };
  let mockRepositoryProvider: RepositoryProvider;
  let getTaskDependenciesSpy: MockInstance<[taskId: string], Promise<string[]>>;
  let mockLoggerService: LoggerService; // Added mock logger variable

  beforeEach(() => {
    vi.clearAllMocks(); // Clears all mocks, including hoisted ones like mockDbRun
    mockLoggerService = mock<LoggerService>(); // Created mock LoggerService

    mockPrdRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    mockPhaseRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByPrdId: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    mockTaskRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByPhaseId: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getDependencies: vi.fn(),
      addDependency: vi.fn(),
      removeDependency: vi.fn(),
    };

    mockRepositoryProvider = {
      prdRepository: mockPrdRepository as unknown as PrdRepository,
      phaseRepository: mockPhaseRepository as unknown as PhaseRepository,
      taskRepository: mockTaskRepository as unknown as TaskRepository,
    } as RepositoryProvider;

    service = new DataPersistenceService(
      mockRepositoryProvider,
      mockLoggerService
    ); // Added mockLoggerService
  });

  // Task Management tests (original lines 557-794)
  let testPhaseId: string; // Specific to task tests

  beforeEach(() => {
    // This beforeEach for testPhaseId needs to be inside this describe block
    testPhaseId = crypto.randomUUID();
  });

  afterEach(() => {
    // This was in the original Task Management describe block
    if (getTaskDependenciesSpy) getTaskDependenciesSpy.mockRestore();
  });

  it('should create a Task successfully', async () => {
    const taskData = {
      name: 'Implement Feature X',
      description: 'Details for X',
      order: 1,
      phaseId: testPhaseId, // Uses testPhaseId
      status: 'pending' as TaskStatus,
      isValidated: false,
    };
    const returnedTaskFromRepo = createMockTask({
      ...taskData,
      dependencies: [],
    });

    mockTaskRepository.create.mockResolvedValue(returnedTaskFromRepo);
    const serviceTask = await service.createTask(taskData);

    expect(mockTaskRepository.create).toHaveBeenCalledWith(taskData);
    expect(serviceTask).toEqual(returnedTaskFromRepo);
  });

  it('should get a Task by ID and populate its dependencies', async () => {
    const taskId = crypto.randomUUID();
    const mockTaskFromRepo = createMockTask({
      id: taskId,
      phaseId: testPhaseId, // Uses testPhaseId
      dependencies: undefined,
    });
    const mockDependencyIds = [crypto.randomUUID()];

    mockTaskRepository.findById.mockResolvedValue(mockTaskFromRepo);
    getTaskDependenciesSpy = vi.spyOn(
      service as any,
      'getTaskDependencies'
    ) as MockInstance<[string], Promise<string[]>>;
    getTaskDependenciesSpy.mockResolvedValue(mockDependencyIds);

    const fetchedTask = await service.getTaskById(taskId);

    expect(mockTaskRepository.findById).toHaveBeenCalledWith(taskId);
    expect(getTaskDependenciesSpy).toHaveBeenCalledWith(taskId);
    expect(fetchedTask).not.toBeNull();
    expect(fetchedTask?.id).toBe(taskId);
    expect(fetchedTask?.dependencies).toEqual(mockDependencyIds);
  });

  it('should return null when getting a non-existent Task by ID', async () => {
    const nonExistentId = 'non-existent-task';
    mockTaskRepository.findById.mockResolvedValue(null);
    const task = await service.getTaskById(nonExistentId);
    expect(mockTaskRepository.findById).toHaveBeenCalledWith(nonExistentId);
    expect(task).toBeNull();
  });

  it('should get Tasks by Phase ID and populate their dependencies', async () => {
    const task1Id = crypto.randomUUID();
    const task2Id = crypto.randomUUID();
    const mockTask1FromRepo = createMockTask({
      id: task1Id,
      phaseId: testPhaseId, // Uses testPhaseId
      name: 'Task 1',
      order: 1,
      dependencies: undefined,
    });
    const mockTask2FromRepo = createMockTask({
      id: task2Id,
      phaseId: testPhaseId, // Uses testPhaseId
      name: 'Task 2',
      order: 2,
      status: 'in_progress',
      isValidated: true,
      dependencies: undefined,
    });
    const mockTasksFromRepo = [mockTask1FromRepo, mockTask2FromRepo];
    const mockDepsForTask1 = [crypto.randomUUID()];
    const mockDepsForTask2: string[] = [];

    mockTaskRepository.findByPhaseId.mockResolvedValue(mockTasksFromRepo);
    getTaskDependenciesSpy = vi.spyOn(
      service as any,
      'getTaskDependencies'
    ) as MockInstance<[string], Promise<string[]>>;
    getTaskDependenciesSpy.mockImplementation(async (id: string) => {
      if (id === task1Id) return mockDepsForTask1;
      if (id === task2Id) return mockDepsForTask2;
      return [];
    });

    const tasks = await service.getTasksByPhaseId(testPhaseId); // Uses testPhaseId

    expect(mockTaskRepository.findByPhaseId).toHaveBeenCalledWith(
      testPhaseId,
      undefined
    );
    expect(getTaskDependenciesSpy).toHaveBeenCalledWith(task1Id);
    expect(getTaskDependenciesSpy).toHaveBeenCalledWith(task2Id);
    expect(tasks.length).toBe(2);
    expect(tasks[0].name).toBe('Task 1');
    expect(tasks[0].dependencies).toEqual(mockDepsForTask1);
    expect(tasks[1].name).toBe('Task 2');
    expect(tasks[1].dependencies).toEqual(mockDepsForTask2);
  });

  it('should get Tasks by Phase ID with status filter', async () => {
    const statusFilter: TaskStatus[] = ['pending', 'in_progress'];
    const mockFilteredTask = createMockTask({
      phaseId: testPhaseId, // Uses testPhaseId
      name: 'Task A Pending',
      status: 'pending',
      dependencies: undefined,
    });
    const mockFilteredTasksFromRepo: Task[] = [mockFilteredTask];

    mockTaskRepository.findByPhaseId.mockImplementation(
      async (id: string, statuses?: TaskStatus[]) => {
        if (id === testPhaseId && statuses === statusFilter) {
          return mockFilteredTasksFromRepo;
        }
        return [];
      }
    );

    getTaskDependenciesSpy = vi.spyOn(
      service as any,
      'getTaskDependencies'
    ) as MockInstance<[string], Promise<string[]>>;
    getTaskDependenciesSpy.mockResolvedValue([]);

    const tasks = await service.getTasksByPhaseId(testPhaseId, statusFilter); // Uses testPhaseId

    expect(mockTaskRepository.findByPhaseId).toHaveBeenCalledWith(
      testPhaseId,
      statusFilter
    );
    if (mockFilteredTasksFromRepo.length > 0 && mockFilteredTasksFromRepo[0]) {
      expect(getTaskDependenciesSpy).toHaveBeenCalledWith(
        mockFilteredTasksFromRepo[0]!.id
      );
    }
    expect(tasks.length).toBe(mockFilteredTasksFromRepo.length);
    if (tasks.length > 0 && tasks[0]) {
      expect(tasks[0]?.status).toBe('pending');
    }
  });

  it('should update a Task successfully and re-populate dependencies', async () => {
    const taskId = crypto.randomUUID();
    const updates = {
      name: 'Updated Task Name',
      status: 'completed' as TaskStatus,
    };
    const updatedTaskFromRepo = createMockTask({
      ...updates,
      id: taskId,
      phaseId: testPhaseId, // Uses testPhaseId
      dependencies: undefined,
      updatedAt: new Date(Date.now() + 1000),
    });
    const mockDependencyIds = [crypto.randomUUID()];

    mockTaskRepository.update.mockResolvedValue(updatedTaskFromRepo);
    getTaskDependenciesSpy = vi.spyOn(
      service as any,
      'getTaskDependencies'
    ) as MockInstance<[string], Promise<string[]>>;
    getTaskDependenciesSpy.mockResolvedValue(mockDependencyIds);

    const updatedTask = await service.updateTask(taskId, updates);

    expect(mockTaskRepository.update).toHaveBeenCalledWith(taskId, updates);
    expect(getTaskDependenciesSpy).toHaveBeenCalledWith(taskId);
    expect(updatedTask).not.toBeNull();
    expect(updatedTask?.name).toBe(updates.name);
    expect(updatedTask?.dependencies).toEqual(mockDependencyIds);
  });

  it('should return null when updating a non-existent task', async () => {
    const nonExistentId = 'non-existent-task';
    const updates = { name: 'New Task Name' };
    mockTaskRepository.update.mockResolvedValue(null);
    const result = await service.updateTask(nonExistentId, updates);
    expect(mockTaskRepository.update).toHaveBeenCalledWith(
      nonExistentId,
      updates
    );
    expect(result).toBeNull();
  });

  it('should delete a Task successfully, including its dependencies from task_dependencies table', async () => {
    const taskId = crypto.randomUUID();
    // The service.deleteTask method uses db.transaction, which calls the callback.
    // The callback then uses db.prepare(...).run(...) and taskRepository.delete(...)
    // We need mockDbPrepare to return an object with a run method.
    // mockDbRun is the vi.fn() that should be called by run().
    // mockDbTransaction will execute the callback passed to it.

    mockTaskRepository.delete.mockResolvedValue(true); // Simulate successful deletion from Task table

    const result = await service.deleteTask(taskId);

    // expect(mockDbTransaction).toHaveBeenCalled(); // No longer called directly by deleteTask SUT
    expect(mockDbPrepare).toHaveBeenCalledWith(
      'DELETE FROM task_dependencies WHERE taskId = ? OR dependencyId = ?'
    );
    expect(mockDbRun).toHaveBeenCalledWith(taskId, taskId);
    expect(mockTaskRepository.delete).toHaveBeenCalledWith(taskId);
    expect(result).toBe(true);
  });

  it('should return false when deleting a non-existent task from repository', async () => {
    const nonExistentId = 'non-existent-task';
    mockTaskRepository.delete.mockResolvedValue(false); // Simulate task not found in Task table

    const result = await service.deleteTask(nonExistentId);

    // expect(mockDbTransaction).toHaveBeenCalled(); // No longer called directly by deleteTask SUT
    expect(mockDbPrepare).toHaveBeenCalledWith(
      'DELETE FROM task_dependencies WHERE taskId = ? OR dependencyId = ?'
    );
    expect(mockDbRun).toHaveBeenCalledWith(nonExistentId, nonExistentId); // Still try to delete dependencies
    expect(mockTaskRepository.delete).toHaveBeenCalledWith(nonExistentId);
    expect(result).toBe(false); // Result is based on taskRepository.delete
  });
});
