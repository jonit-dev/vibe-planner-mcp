import 'reflect-metadata'; // Must be the first import

import { container } from 'tsyringe';
import { LoggerService } from './services/LoggerService';

// Log CWD at startup
const logger = container.resolve(LoggerService);
logger.debug(`[server.ts] EARLY LOG: process.cwd() is ${process.cwd()}`);

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Import new tool classes from their new locations
import { GetPlanningScaffoldMCPTool } from './mcp-tools/general/GetPlanningScaffoldMCPTool.js';
import { CreatePlanMCPTool } from './mcp-tools/plan/CreatePlanMCPTool.js';
import { GetPlanStatusMCPTool } from './mcp-tools/plan/GetPlanStatusMCPTool.js';
import { GetNextTaskMCPTool } from './mcp-tools/task/GetNextTaskMCPTool.js';
import { RequestTaskValidationMCPTool } from './mcp-tools/task/RequestTaskValidationMCPTool.js';
import { UpdateTaskStatusMCPTool } from './mcp-tools/task/UpdateTaskStatusMCPTool.js';

async function main() {
  logger.debug('[server.ts] Starting MCP server...');

  const mcpServer = new McpServer({
    name: 'vibe-planner',
    version: '1.0.0',
    toolDescription: 'A tool for managing development plans and tasks.',
  });

  // Register all tools first
  logger.debug('[server.ts] Registering tools...');
  container.resolve(CreatePlanMCPTool).register(mcpServer);
  container.resolve(GetPlanStatusMCPTool).register(mcpServer);
  container.resolve(GetPlanningScaffoldMCPTool).register(mcpServer);
  container.resolve(GetNextTaskMCPTool).register(mcpServer);
  container.resolve(UpdateTaskStatusMCPTool).register(mcpServer);
  container.resolve(RequestTaskValidationMCPTool).register(mcpServer);
  logger.debug('[server.ts] All tools registered');

  // Set up transport
  logger.debug('[server.ts] Setting up StdioServerTransport...');
  const transport = new StdioServerTransport();

  // Connect server
  logger.debug('[server.ts] Connecting to transport...');
  await mcpServer.connect(transport);
  logger.debug('[server.ts] Server connected and ready');
}

main().catch((error) => {
  logger.error('[VIBE-PLANNER] CRITICAL ERROR in main():', error as Error);
  process.exit(1);
});
