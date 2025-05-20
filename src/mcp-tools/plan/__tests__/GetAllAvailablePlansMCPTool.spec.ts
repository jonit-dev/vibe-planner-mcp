import { beforeEach, describe, expect, it, vi } from 'vitest';
// import { LoggerService } from '../../../services/LoggerService'; // Provided by mock helper
// import { PrdLifecycleService } from '../../../vibeplanner/services/PrdLifecycleService'; // Provided by mock helper
import { createTestPrd } from '../../../__tests__/test-utils/fixtures/prdFixtures'; // Corrected path
import { createMockMcpContext } from '../../../__tests__/test-utils/mocks/mcpMocks'; // Corrected path
import {
  createMockLoggerService,
  createMockPrdLifecycleService,
} from '../../../__tests__/test-utils/mocks/serviceMocks'; // Corrected path
import { PhaseStatus, Prd } from '../../../vibeplanner/types';
import { GetAllAvailablePlansMCPTool } from '../GetAllAvailablePlansMCPTool';

// Mocks using helpers
let mockLoggerService = createMockLoggerService();
let mockPrdLifecycleService = createMockPrdLifecycleService();
const mockContext = createMockMcpContext();

describe('GetAllAvailablePlansMCPTool', () => {
  let getAllPlansTool: GetAllAvailablePlansMCPTool;

  beforeEach(() => {
    vi.resetAllMocks(); // This clears all vi.fn() mocks regardless of where they are defined
    // Re-initialize mocks if they need to be fresh for each test, or if their state is complex
    mockLoggerService = createMockLoggerService();
    mockPrdLifecycleService = createMockPrdLifecycleService();

    getAllPlansTool = new GetAllAvailablePlansMCPTool(
      mockLoggerService,
      mockPrdLifecycleService
    );
  });

  it('should return a list of plans successfully', async () => {
    const mockPlans: Prd[] = [
      createTestPrd({ name: 'Plan 1' }), // Let createTestPrd handle UUID generation
      createTestPrd({ name: 'Plan 2', status: 'in_progress' as PhaseStatus }), // Let createTestPrd handle UUID generation
    ];
    mockPrdLifecycleService.listPrds.mockResolvedValue(mockPlans);

    const result = await getAllPlansTool.execute({}, mockContext);

    expect(mockPrdLifecycleService.listPrds).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockPlans);
    expect(mockLoggerService.info).toHaveBeenCalledWith(
      '[GetAllAvailablePlansMCPTool] Executing to get all available plans'
    );
    expect(mockLoggerService.info).toHaveBeenCalledWith(
      `[GetAllAvailablePlansMCPTool] Successfully retrieved ${mockPlans.length} plans.`
    );
  });

  it('should return an empty list if no plans are available', async () => {
    const mockPlans: Prd[] = [];
    mockPrdLifecycleService.listPrds.mockResolvedValue(mockPlans);

    const result = await getAllPlansTool.execute({}, mockContext);

    expect(mockPrdLifecycleService.listPrds).toHaveBeenCalledTimes(1);
    expect(result).toEqual([]);
    expect(mockLoggerService.info).toHaveBeenCalledWith(
      `[GetAllAvailablePlansMCPTool] Successfully retrieved 0 plans.`
    );
  });

  it('should throw an error if prdLifecycleService.listPrds throws an error', async () => {
    const errorMessage = 'Service error';
    mockPrdLifecycleService.listPrds.mockRejectedValue(new Error(errorMessage));

    await expect(getAllPlansTool.execute({}, mockContext)).rejects.toThrow(
      errorMessage
    );
    expect(mockLoggerService.error).toHaveBeenCalledWith(
      '[GetAllAvailablePlansMCPTool] Error retrieving plans:',
      expect.any(Error)
    );
  });
});
