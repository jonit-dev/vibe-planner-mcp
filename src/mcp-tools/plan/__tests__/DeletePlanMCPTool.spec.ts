import { beforeEach, describe, expect, it, vi } from 'vitest';
// import { LoggerService } from '../../../services/LoggerService';
// import { PrdLifecycleService } from '../../../vibeplanner/services/PrdLifecycleService';
import { createMockMcpContext } from '../../../__tests__/test-utils/mocks/mcpMocks'; // Corrected path
import {
  createMockLoggerService,
  createMockPrdLifecycleService,
} from '../../../__tests__/test-utils/mocks/serviceMocks'; // Corrected path
import { DeletePlanMCPTool } from '../DeletePlanMCPTool';

// Mocks using helpers
let mockLoggerService = createMockLoggerService();
let mockPrdLifecycleService = createMockPrdLifecycleService();
const mockContext = createMockMcpContext();

describe('DeletePlanMCPTool', () => {
  let deletePlanTool: DeletePlanMCPTool;
  const planId = 'test-plan-id-to-delete';

  beforeEach(() => {
    vi.resetAllMocks();
    mockLoggerService = createMockLoggerService();
    mockPrdLifecycleService = createMockPrdLifecycleService();

    deletePlanTool = new DeletePlanMCPTool(
      mockLoggerService,
      mockPrdLifecycleService
    );
  });

  it('should delete a plan successfully and return success message', async () => {
    mockPrdLifecycleService.deletePrd.mockResolvedValue(true);

    const params = { planId };
    const result = await deletePlanTool.execute(params, mockContext);

    expect(mockPrdLifecycleService.deletePrd).toHaveBeenCalledWith(planId);
    expect(result.success).toBe(true);
    expect(result.message).toBe(`Plan ID: ${planId} successfully deleted.`);
    expect(mockLoggerService.info).toHaveBeenCalledWith(
      `[DeletePlanMCPTool] Successfully deleted plan ID: ${planId}`
    );
  });

  it('should return failure message if plan deletion fails (e.g., not found)', async () => {
    mockPrdLifecycleService.deletePrd.mockResolvedValue(false);

    const params = { planId };
    const result = await deletePlanTool.execute(params, mockContext);

    expect(mockPrdLifecycleService.deletePrd).toHaveBeenCalledWith(planId);
    expect(result.success).toBe(false);
    expect(result.message).toBe(
      `Failed to delete plan ID: ${planId}. It might not exist or an error occurred.`
    );
    expect(mockLoggerService.warn).toHaveBeenCalledWith(
      `[DeletePlanMCPTool] Failed to delete plan ID: ${planId}. It might not exist or an error occurred.`
    );
  });

  it('should throw an error if prdLifecycleService.deletePrd throws an error', async () => {
    const errorMessage = 'Service error during deletion';
    mockPrdLifecycleService.deletePrd.mockRejectedValue(
      new Error(errorMessage)
    );

    const params = { planId };
    await expect(deletePlanTool.execute(params, mockContext)).rejects.toThrow(
      errorMessage
    );
    expect(mockLoggerService.error).toHaveBeenCalledWith(
      `[DeletePlanMCPTool] Error deleting plan ID: ${planId}:`,
      expect.any(Error)
    );
  });
});
