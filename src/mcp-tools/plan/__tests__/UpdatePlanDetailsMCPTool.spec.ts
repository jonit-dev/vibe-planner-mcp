import crypto from 'crypto'; // Import crypto
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestPrd } from '../../../__tests__/test-utils/fixtures/prdFixtures';
import { createMockMcpContext } from '../../../__tests__/test-utils/mocks/mcpMocks';
import {
  createMockLoggerService,
  createMockPrdLifecycleService,
} from '../../../__tests__/test-utils/mocks/serviceMocks';
import { UpdatePlanDetailsMCPTool } from '../UpdatePlanDetailsMCPTool';

// Mocks using helpers
let mockLoggerService = createMockLoggerService();
let mockPrdLifecycleService = createMockPrdLifecycleService();
const mockContext = createMockMcpContext();

describe('UpdatePlanDetailsMCPTool', () => {
  let updatePlanDetailsTool: UpdatePlanDetailsMCPTool;
  const planId = crypto.randomUUID(); // Use crypto.randomUUID()

  beforeEach(() => {
    vi.resetAllMocks();
    mockLoggerService = createMockLoggerService();
    mockPrdLifecycleService = createMockPrdLifecycleService();

    updatePlanDetailsTool = new UpdatePlanDetailsMCPTool(
      mockLoggerService,
      mockPrdLifecycleService
    );
  });

  const getBasePrd = () =>
    createTestPrd({
      // Use a function to get a fresh basePrd with the consistent planId
      id: planId,
      name: 'Original Name',
      description: 'Original Description',
    });

  it('should update plan name successfully', async () => {
    const basePrd = getBasePrd();
    const newName = 'New Plan Name';
    const updatedPrdResponse = createTestPrd({
      ...basePrd,
      name: newName,
      updatedAt: new Date(),
    });
    mockPrdLifecycleService.updatePrdDetails.mockResolvedValue(
      updatedPrdResponse
    );

    const params = { planId, name: newName };
    const result = await updatePlanDetailsTool.execute(params, mockContext);

    expect(mockPrdLifecycleService.updatePrdDetails).toHaveBeenCalledWith(
      planId,
      { name: newName, description: undefined }
    );
    expect(result).toEqual(updatedPrdResponse);
    expect(mockLoggerService.info).toHaveBeenCalledWith(
      `[UpdatePlanDetailsMCPTool] Successfully updated details for plan ID: ${planId}`,
      updatedPrdResponse
    );
  });

  it('should update plan description successfully', async () => {
    const basePrd = getBasePrd();
    const newDescription = 'New Plan Description';
    const updatedPrdResponse = createTestPrd({
      ...basePrd,
      description: newDescription,
      updatedAt: new Date(),
    });
    mockPrdLifecycleService.updatePrdDetails.mockResolvedValue(
      updatedPrdResponse
    );

    const params = { planId, description: newDescription };
    const result = await updatePlanDetailsTool.execute(params, mockContext);

    expect(mockPrdLifecycleService.updatePrdDetails).toHaveBeenCalledWith(
      planId,
      { name: undefined, description: newDescription }
    );
    expect(result).toEqual(updatedPrdResponse);
  });

  it('should update both plan name and description successfully', async () => {
    const basePrd = getBasePrd();
    const newName = 'Updated Name Again';
    const newDescription = 'Updated Description Again';
    const updatedPrdResponse = createTestPrd({
      ...basePrd,
      name: newName,
      description: newDescription,
      updatedAt: new Date(),
    });
    mockPrdLifecycleService.updatePrdDetails.mockResolvedValue(
      updatedPrdResponse
    );

    const params = { planId, name: newName, description: newDescription };
    const result = await updatePlanDetailsTool.execute(params, mockContext);

    expect(mockPrdLifecycleService.updatePrdDetails).toHaveBeenCalledWith(
      planId,
      { name: newName, description: newDescription }
    );
    expect(result).toEqual(updatedPrdResponse);
  });

  it('should throw an error if neither name nor description is provided', async () => {
    const params = { planId }; // No name or description
    await expect(
      updatePlanDetailsTool.execute(params, mockContext)
    ).rejects.toThrow('No name or description provided for update.');
    expect(mockPrdLifecycleService.updatePrdDetails).not.toHaveBeenCalled();
    expect(mockLoggerService.warn).toHaveBeenCalledWith(
      '[UpdatePlanDetailsMCPTool] No details provided to update. Skipping operation.'
    );
  });

  it('should return null if planId is not found', async () => {
    const newName = 'New Name For NonExistent Plan';
    mockPrdLifecycleService.updatePrdDetails.mockResolvedValue(null);

    const params = { planId, name: newName };
    const result = await updatePlanDetailsTool.execute(params, mockContext);

    expect(result).toBeNull();
    expect(mockLoggerService.warn).toHaveBeenCalledWith(
      `[UpdatePlanDetailsMCPTool] Plan ID: ${planId} not found. No update performed.`
    );
  });

  it('should throw an error if prdLifecycleService.updatePrdDetails throws an error', async () => {
    const errorMessage = 'Service error during update';
    const newName = 'Trying to cause error';
    mockPrdLifecycleService.updatePrdDetails.mockRejectedValue(
      new Error(errorMessage)
    );

    const params = { planId, name: newName };
    await expect(
      updatePlanDetailsTool.execute(params, mockContext)
    ).rejects.toThrow(errorMessage);
    expect(mockLoggerService.error).toHaveBeenCalledWith(
      `[UpdatePlanDetailsMCPTool] Error updating details for plan ID: ${planId}:`,
      expect.any(Error)
    );
  });
});
