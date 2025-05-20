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
import { CreatePhaseMCPTool } from './mcp-tools/plan/CreatePhaseMCPTool.js';
import { CreatePlanMCPTool } from './mcp-tools/plan/CreatePlanMCPTool.js';
import { DeletePlanMCPTool } from './mcp-tools/plan/DeletePlanMCPTool.js';
import { GetAllAvailablePlansMCPTool } from './mcp-tools/plan/GetAllAvailablePlansMCPTool.js';
import { GetPlanStatusMCPTool } from './mcp-tools/plan/GetPlanStatusMCPTool.js';
import { UpdatePlanDetailsMCPTool } from './mcp-tools/plan/UpdatePlanDetailsMCPTool.js';
import { UpdatePlanStatusMCPTool } from './mcp-tools/plan/UpdatePlanStatusMCPTool.js';
import { CreateTaskMCPTool } from './mcp-tools/task/CreateTaskMCPTool.js';
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
  container.resolve(CreatePhaseMCPTool).register(mcpServer);
  container.resolve(GetPlanStatusMCPTool).register(mcpServer);
  container.resolve(GetAllAvailablePlansMCPTool).register(mcpServer);
  container.resolve(UpdatePlanDetailsMCPTool).register(mcpServer);
  container.resolve(UpdatePlanStatusMCPTool).register(mcpServer);
  container.resolve(DeletePlanMCPTool).register(mcpServer);
  container.resolve(GetPlanningScaffoldMCPTool).register(mcpServer);
  container.resolve(CreateTaskMCPTool).register(mcpServer);
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
