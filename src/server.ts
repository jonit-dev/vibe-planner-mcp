import 'reflect-metadata'; // Must be the first import
import { container } from 'tsyringe';
import { LoggerService } from './services/LoggerService';

// Log CWD at startup
const earlyLogger = container.resolve(LoggerService);
earlyLogger.info(`[server.ts] EARLY LOG: process.cwd() is ${process.cwd()}`);

import './services/tsyringe.config'; // Registers services and repositories

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { registerPlanningTool } from './tools/planningTool.js';
import { VibePlannerTool } from './vibeplanner/index.js';
import { TaskStatusSchema } from './vibeplanner/types.js'; // Import Zod schemas and TS types

async function main() {
  const vibePlannerTool = container.resolve(VibePlannerTool);

  const mcpServer = new McpServer({
    name: 'vibe-planner',
    version: '1.0.0',
    toolDescription: vibePlannerTool.toolDescription,
  });

  registerPlanningTool(mcpServer);

  // VibePlannerTool Method Registrations

  const startNewPlanSchema = z.object({
    name: z.string(),
    description: z.string(),
    sourceTool: z.string().optional(),
  });
  mcpServer.tool(
    `${vibePlannerTool.toolName}/startNewPlan`,
    startNewPlanSchema.shape,
    {
      description:
        'Starts a new development plan (PRD) and returns the first task if available.',
    },
    async (params: z.infer<typeof startNewPlanSchema>, context: any) => {
      const result = await vibePlannerTool.startNewPlan(context, params);
      return { structuredContent: result };
    }
  );

  const getPlanStatusSchema = z.object({ planId: z.string() });
  mcpServer.tool(
    `${vibePlannerTool.toolName}/getPlanStatus`,
    getPlanStatusSchema.shape,
    {
      description:
        'Retrieves the current status and details of a development plan.',
    },
    async (params: z.infer<typeof getPlanStatusSchema>, context: any) => {
      const result = await vibePlannerTool.getPlanStatus(
        context,
        params.planId
      );
      if (result === null) {
        return { structuredContent: {} }; // Return empty object for structuredContent if result is null
      }
      // Sanitize description to be string | undefined
      const sanitizedDescription =
        result.description === null ? undefined : result.description;
      const structuredOutput = { ...result, description: sanitizedDescription };
      return { structuredContent: structuredOutput };
    }
  );

  const getNextTaskSchema = z.object({ planId: z.string() });
  mcpServer.tool(
    `${vibePlannerTool.toolName}/getNextTask`,
    getNextTaskSchema.shape,
    {
      description: 'Gets the next available task for a given development plan.',
    },
    async (params: z.infer<typeof getNextTaskSchema>, context: any) => {
      const result = await vibePlannerTool.getNextTask(context, params.planId);
      if (result === null) {
        return { structuredContent: {} };
      }
      // Sanitize potentially nullable string fields in Task to be string | undefined
      const sanitizedResult = {
        ...result,
        description:
          result.description === null ? undefined : result.description,
        validationCommand:
          result.validationCommand === null
            ? undefined
            : result.validationCommand,
        validationOutput:
          result.validationOutput === null
            ? undefined
            : result.validationOutput,
        notes: result.notes === null ? undefined : result.notes,
      };
      return { structuredContent: sanitizedResult };
    }
  );

  const updateTaskStatusSchema = z.object({
    taskId: z.string(),
    status: TaskStatusSchema,
    details: z.any().optional(),
  });
  mcpServer.tool(
    `${vibePlannerTool.toolName}/updateTaskStatus`,
    updateTaskStatusSchema.shape,
    { description: 'Updates the status of a specific task.' },
    async (params: z.infer<typeof updateTaskStatusSchema>, context: any) => {
      await vibePlannerTool.updateTaskStatus(
        context,
        params.taskId,
        params.status,
        params.details
      );
      return { structuredContent: {} };
    }
  );

  const requestTaskValidationSchema = z.object({ taskId: z.string() });
  mcpServer.tool(
    `${vibePlannerTool.toolName}/requestTaskValidation`,
    requestTaskValidationSchema.shape,
    { description: 'Requests the validation command for a specific task.' },
    async (
      params: z.infer<typeof requestTaskValidationSchema>,
      context: any
    ) => {
      const result = await vibePlannerTool.requestTaskValidation(
        context,
        params.taskId
      );
      if (result === null) {
        return { structuredContent: {} };
      }
      // result is { validationCommand: string | null }
      const sanitizedValidationCommand =
        result.validationCommand === null
          ? undefined
          : result.validationCommand;
      return {
        structuredContent: { validationCommand: sanitizedValidationCommand },
      };
    }
  );

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
