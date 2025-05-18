import { interpretValidationResult, ValidationResult } from '../index';

describe('interpretValidationResult', () => {
  it('should return success true for exit code 0', () => {
    const result: ValidationResult = interpretValidationResult(
      0,
      'Success output'
    );
    expect(result.success).toBe(true);
    expect(result.processedOutput).toBe('Success output');
  });

  it('should return success false for non-zero exit code', () => {
    const result: ValidationResult = interpretValidationResult(
      1,
      'Failure output'
    );
    expect(result.success).toBe(false);
    expect(result.processedOutput).toBe('Failure output');
  });

  it('should return success false for a different non-zero exit code', () => {
    const result: ValidationResult = interpretValidationResult(
      -1,
      'Error output'
    );
    expect(result.success).toBe(false);
    expect(result.processedOutput).toBe('Error output');
  });

  it('should handle empty output string correctly', () => {
    const resultSuccess: ValidationResult = interpretValidationResult(0, '');
    expect(resultSuccess.success).toBe(true);
    expect(resultSuccess.processedOutput).toBe('');

    const resultFailure: ValidationResult = interpretValidationResult(127, '');
    expect(resultFailure.success).toBe(false);
    expect(resultFailure.processedOutput).toBe('');
  });
});
