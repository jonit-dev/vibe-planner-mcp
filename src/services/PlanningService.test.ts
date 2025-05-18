import { readFile } from 'fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlanningService } from './PlanningService.js'; // Use .js extension for ES modules

// Mock the fs/promises module using the imported vi
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
}));

describe('PlanningService', () => {
  let planningService: PlanningService;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    // Create a new instance of the service for each test to ensure isolation
    // tsyringe typically handles singleton instantiation, but for unit tests,
    // direct instantiation or a test-specific container setup is common.
    planningService = new PlanningService();
  });

  it('should read and return the planning document content', async () => {
    const mockContent = 'This is the planning document content.';
    (readFile as ReturnType<typeof vi.fn>).mockResolvedValue(mockContent); // Use ReturnType<typeof vi.fn> for better type safety

    const content = await planningService.getPlanningDocument();

    expect(readFile).toHaveBeenCalledTimes(1);
    expect(readFile).toHaveBeenCalledWith(
      expect.stringContaining('mcp_docs/planning-documents.md'),
      'utf-8'
    );
    expect(content).toBe(mockContent);
  });

  it('should throw an error if reading the file fails', async () => {
    const mockError = new Error('Failed to read file');
    (readFile as ReturnType<typeof vi.fn>).mockRejectedValue(mockError);

    // We expect the promise to be rejected with the same error
    await expect(planningService.getPlanningDocument()).rejects.toThrow(
      mockError
    );

    expect(readFile).toHaveBeenCalledTimes(1);
    expect(readFile).toHaveBeenCalledWith(
      expect.stringContaining('mcp_docs/planning-documents.md'),
      'utf-8'
    );
  });
});
