import 'reflect-metadata'; // Must be the first import

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { container } from 'tsyringe';
import { PlanningService } from './services/PlanningService.js';
import { registerPlanningTool } from './tools/planningTool.js';

async function main() {
  const planningService = container.resolve(PlanningService);

  const mcpServer = new McpServer({
    name: 'vibe-planner',
    version: '1.0.0',
  });

  // Register tools
  registerPlanningTool(mcpServer);

  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.error(
    '[VIBE-PLANNER] Connected to StdioServerTransport. Listening...'
  );
}

main().catch((error) => {
  console.error('[VIBE-PLANNER] CRITICAL ERROR in main():', error);
  process.exit(1);
});
