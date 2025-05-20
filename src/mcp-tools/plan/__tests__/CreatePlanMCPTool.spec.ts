import { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import {
  ServerNotification,
  ServerRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoggerService } from '../../../services/LoggerService';
import { PrdLifecycleService } from '../../../vibeplanner/services/PrdLifecycleService';
import { TaskOrchestrationService } from '../../../vibeplanner/services/TaskOrchestrationService';
import { CreatePlanInput, PhaseStatus, Prd } from '../../../vibeplanner/types';
import { CreatePlanMCPTool } from '../CreatePlanMCPTool';

// Mocks for services, not entire modules to avoid issues with default exports or class structures.
const mockLoggerService = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  setContext: vi.fn(),
};

const mockPrdLifecycleService = {
  initializePrd: vi.fn(),
  getPrd: vi.fn(),
  updatePrd: vi.fn(),
  deletePrd: vi.fn(),
  addPhaseToPrd: vi.fn(),
  getPrdWithOrderedPhases: vi.fn(),
};

const mockTaskOrchestrationService = {
  getNextTaskForPlan: vi.fn(),
  // Add other methods if CreatePlanMCPTool starts using them
};

describe('CreatePlanMCPTool', () => {
  let createPlanTool: CreatePlanMCPTool;

  const mockContext = {} as RequestHandlerExtra<
    ServerRequest,
    ServerNotification
  >;

  beforeEach(() => {
    vi.resetAllMocks(); // Reset all mocks before each test

    createPlanTool = new CreatePlanMCPTool(
      mockLoggerService as unknown as LoggerService,
      mockPrdLifecycleService as unknown as PrdLifecycleService,
      mockTaskOrchestrationService as unknown as TaskOrchestrationService
    );
  });

  it('should create a plan successfully', async () => {
    const params: CreatePlanInput = {
      name: 'Test Plan',
      description: 'Test Description',
      sourceTool: 'test-tool',
      status: 'pending' as PhaseStatus,
    };
    const mockPrdResponse: Prd = {
      id: 'plan-123',
      name: 'Test Plan',
      description: 'Test Description',
      phases: [],
      creationDate: new Date(),
      updatedAt: new Date(),
      status: 'pending',
    };

    mockPrdLifecycleService.initializePrd.mockResolvedValue(mockPrdResponse);
    mockTaskOrchestrationService.getNextTaskForPlan.mockResolvedValue(null);

    const result = await createPlanTool.execute(params, mockContext);

    expect(mockPrdLifecycleService.initializePrd).toHaveBeenCalledWith({
      name: params.name,
      description: params.description,
      sourceTool: params.sourceTool,
      status: params.status,
    });
    expect(
      mockTaskOrchestrationService.getNextTaskForPlan
    ).toHaveBeenCalledWith(mockPrdResponse.id);
    expect(result.planId).toBe(mockPrdResponse.id);
    expect(result.message).toContain('Plan plan-123 created successfully');
  });

  it('should throw an error if plan name is empty', async () => {
    const params: CreatePlanInput = { name: '', description: '' };
    await expect(createPlanTool.execute(params, mockContext)).rejects.toThrow(
      'Plan name is required and cannot be empty.'
    );
  });

  it('should throw an error if plan name is only whitespace', async () => {
    const params: CreatePlanInput = { name: '   ', description: '' };
    await expect(createPlanTool.execute(params, mockContext)).rejects.toThrow(
      'Plan name is required and cannot be empty.'
    );
  });

  it('should throw an error if prdLifecycleService.initializePrd returns no PRD (null)', async () => {
    const params: CreatePlanInput = {
      name: 'Test Plan',
      description: 'Valid description',
    };
    mockPrdLifecycleService.initializePrd.mockResolvedValue(null as any); // Simulate null return

    await expect(createPlanTool.execute(params, mockContext)).rejects.toThrow(
      'Failed to initialize PRD. Service returned no PRD object.'
    );
  });

  it('should throw an error if prdLifecycleService.initializePrd throws', async () => {
    const params: CreatePlanInput = {
      name: 'Test Plan',
      description: 'Valid description',
    };
    const errorMessage = 'PRD service error';
    mockPrdLifecycleService.initializePrd.mockRejectedValue(
      new Error(errorMessage)
    );

    await expect(createPlanTool.execute(params, mockContext)).rejects.toThrow(
      errorMessage
    );
  });

  it('should log a warning if taskOrchestrationService.getNextTaskForPlan throws', async () => {
    const params: CreatePlanInput = {
      name: 'Test Plan',
      description: 'Valid description',
    };
    const mockPrdResponse: Prd = {
      id: 'plan-456',
      name: 'Test Plan',
      description: 'Valid description',
      phases: [],
      creationDate: new Date(),
      updatedAt: new Date(),
      status: 'pending',
    };
    const taskErrorMessage = 'Task service error';
    mockPrdLifecycleService.initializePrd.mockResolvedValue(mockPrdResponse);
    mockTaskOrchestrationService.getNextTaskForPlan.mockRejectedValue(
      new Error(taskErrorMessage)
    );

    const result = await createPlanTool.execute(params, mockContext);

    expect(mockLoggerService.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        '[createPlan] Error fetching first task for new plan plan-456: Task service error'
      ),
      expect.any(Error)
    );
    expect(result.planId).toBe(mockPrdResponse.id);
    expect(result.message).toContain('Plan plan-456 created successfully');
  });

  it('should succeed even if taskOrchestrationService.getNextTaskForPlan returns null', async () => {
    const params: CreatePlanInput = {
      name: 'Test Plan No Tasks',
      description: 'Valid description',
    };
    const mockPrdResponse: Prd = {
      id: 'plan-789',
      name: 'Test Plan No Tasks',
      description: 'Valid description',
      phases: [],
      creationDate: new Date(),
      updatedAt: new Date(),
      status: 'pending',
    };
    mockPrdLifecycleService.initializePrd.mockResolvedValue(mockPrdResponse);
    mockTaskOrchestrationService.getNextTaskForPlan.mockResolvedValue(null);

    const result = await createPlanTool.execute(params, mockContext);
    expect(result.planId).toBe(mockPrdResponse.id);
    expect(result.message).toContain('Plan plan-789 created successfully');
    expect(mockLoggerService.warn).not.toHaveBeenCalled();
  });
});
