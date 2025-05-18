import { readFile } from 'fs/promises';
import * as path from 'path';
import { singleton } from 'tsyringe';
import { MCP_DOCS_PATH } from '../constants/pathConstants.js'; // Import the clean constant

@singleton()
export class PlanningService {
  async getPlanningDocument(): Promise<string> {
    const filePath = path.join(
      MCP_DOCS_PATH, // Use the constant from pathConstants.ts
      'planning-documents.md'
    );
    // Log the path being used
    console.error(
      `[VIBE-PLANNER][PlanningService] Attempting to read: ${filePath}`
    );
    return readFile(filePath, 'utf-8');
  }
}
