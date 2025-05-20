import crypto from 'crypto'; // Import crypto
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestPrd } from '../../../__tests__/test-utils/fixtures/prdFixtures';
import { createMockMcpContext } from '../../../__tests__/test-utils/mocks/mcpMocks';
import {
  createMockLoggerService,
  createMockPrdLifecycleService,
} from '../../../__tests__/test-utils/mocks/serviceMocks';
import { PhaseStatusSchema } from '../../../vibeplanner/types';
import { UpdatePlanStatusMCPTool } from '../UpdatePlanStatusMCPTool';

// Mocks using helpers
let mockLoggerService = createMockLoggerService();
let mockPrdLifecycleService = createMockPrdLifecycleService();
const mockContext = createMockMcpContext();

describe('UpdatePlanStatusMCPTool', () => {
  let updatePlanStatusTool: UpdatePlanStatusMCPTool;
  const planId = crypto.randomUUID(); // Use crypto.randomUUID()

  beforeEach(() => {
    vi.resetAllMocks();
    mockLoggerService = createMockLoggerService();
    mockPrdLifecycleService = createMockPrdLifecycleService();

    updatePlanStatusTool = new UpdatePlanStatusMCPTool(
      mockLoggerService,
      mockPrdLifecycleService
    );
  });

  const getBasePrd = () =>
    createTestPrd({ id: planId, status: PhaseStatusSchema.enum.pending }); // Use a function

  it('should update plan status successfully', async () => {
    const basePrd = getBasePrd();
    const newStatus = PhaseStatusSchema.enum.in_progress;
    const updatedPrdResponse = createTestPrd({
      ...basePrd,
      status: newStatus,
      updatedAt: new Date(),
    });
    mockPrdLifecycleService.updatePrdStatus.mockResolvedValue(
      updatedPrdResponse
    );

    const params = { planId, status: newStatus };
    const result = await updatePlanStatusTool.execute(params, mockContext);

    expect(mockPrdLifecycleService.updatePrdStatus).toHaveBeenCalledWith(
      planId,
      newStatus
    );
    expect(result).toEqual(updatedPrdResponse);
    expect(mockLoggerService.info).toHaveBeenCalledWith(
      `[UpdatePlanStatusMCPTool] Successfully updated status for plan ID: ${planId}`,
      updatedPrdResponse
    );
  });

  it('should return null if planId is not found for status update', async () => {
    const newStatus = PhaseStatusSchema.enum.completed;
    mockPrdLifecycleService.updatePrdStatus.mockResolvedValue(null);

    const params = { planId, status: newStatus };
    const result = await updatePlanStatusTool.execute(params, mockContext);

    expect(result).toBeNull();
    expect(mockLoggerService.warn).toHaveBeenCalledWith(
      `[UpdatePlanStatusMCPTool] Plan ID: ${planId} not found or status update failed. No update performed.`
    );
  });

  it('should throw an error if prdLifecycleService.updatePrdStatus throws an error', async () => {
    const errorMessage = 'Service error during status update';
    const newStatus = PhaseStatusSchema.enum.on_hold;
    mockPrdLifecycleService.updatePrdStatus.mockRejectedValue(
      new Error(errorMessage)
    );

    const params = { planId, status: newStatus };
    await expect(
      updatePlanStatusTool.execute(params, mockContext)
    ).rejects.toThrow(errorMessage);
    expect(mockLoggerService.error).toHaveBeenCalledWith(
      `[UpdatePlanStatusMCPTool] Error updating status for plan ID: ${planId}:`,
      expect.any(Error)
    );
  });

  // It could be beneficial to add a test for invalid status string, but Zod schema validation
  // at the MCP layer or tool inputSchemaShape should ideally catch this before execute.
  // If direct .execute calls can bypass that, then a test here would be useful.
  // For now, assuming Zod handles it based on schema definition.
});
