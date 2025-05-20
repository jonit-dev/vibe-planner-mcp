import crypto from 'crypto';
import { PhaseStatusSchema, Prd, PrdSchema } from '../../../vibeplanner/types';

export const createTestPrd = (overrides: Partial<Prd> = {}): Prd => {
  const now = new Date();
  const defaultPrd: Prd = {
    id: crypto.randomUUID(),
    name: 'Test PRD',
    description: 'This is a test PRD.',
    status: PhaseStatusSchema.enum.pending,
    phases: [],
    creationDate: now,
    updatedAt: now,
    // completionDate: null, // Handled by Zod default or explicit override
    // sourceTool: undefined, // Handled by Zod default or explicit override
  };

  // Apply overrides and then parse with Zod to ensure defaults and structure
  const merged = { ...defaultPrd, ...overrides };
  return PrdSchema.parse(merged);
};
