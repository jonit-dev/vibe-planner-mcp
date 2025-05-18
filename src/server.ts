console.error('[HELLO-MCP-SERVER] VERY TOP LEVEL LOG'); // Newest log

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

async function main() {
  const mcpServer = new McpServer({
    name: 'HelloWorldServer',
    version: '1.0.0',
  });

  // Define the 'hello' tool
  mcpServer.tool(
    'hello',
    { name: z.string().optional() },
    async ({ name }: { name?: string }) => {
      console.error(
        `[HELLO-MCP-SERVER] 'hello' tool called with name: ${name}`
      ); // New log
      const greeting = `Hello, ${name || 'World'}!`;
      // For stdio transport, the tool's response is directly sent.
      // Ensure it's in the expected format if the client needs specific wrapping.
      // The McpServer.tool handler automatically wraps this in a valid JSON-RPC response.
      return {
        content: [{ type: 'text', text: greeting }],
      };
    }
  );

  const transport = new StdioServerTransport();

  await mcpServer.connect(transport);
  console.error(
    '[HELLO-MCP-SERVER] Connected to StdioServerTransport. Listening...'
  ); // New log
  // With StdioServerTransport, the process will remain open, listening to stdin
  // and sending responses to stdout. No explicit 'listen' call like in Express.
  // Ensure no other console.log calls interfere with stdout.
  // console.error('MCP Hello World server connected to stdio'); // Use stderr for diagnostics
}

main().catch((error) => {
  console.error('[HELLO-MCP-SERVER] CRITICAL ERROR in main():', error);
  process.exit(1);
});
