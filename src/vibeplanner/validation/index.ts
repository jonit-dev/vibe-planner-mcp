export interface ValidationResult {
  success: boolean;
  processedOutput?: string;
}

/**
 * Interprets the result of a validation command execution.
 *
 * @param exitCode The exit code of the command.
 * @param output The stdout/stderr output of the command.
 * @returns ValidationResult An object indicating success or failure,
 *                           and optionally processed output.
 */
export function interpretValidationResult(
  exitCode: number,
  output: string
): ValidationResult {
  if (exitCode === 0) {
    return { success: true, processedOutput: output };
  } else {
    return { success: false, processedOutput: output };
  }
}
