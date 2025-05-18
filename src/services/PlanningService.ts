import { readFile } from 'fs/promises';
import * as path from 'path';
import { singleton } from 'tsyringe';

@singleton()
export class PlanningService {
  async getPlanningDocument(): Promise<string> {
    // Construct the absolute path to the planning document
    const filePath = path.join(
      process.cwd(),
      'mcp_docs',
      'planning-documents.md'
    );
    return readFile(filePath, 'utf-8');
  }
}
