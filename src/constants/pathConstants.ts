import path from 'path';

// Require VIBE_PLANNER_PROJECT_ROOT environment variable
const ENV_PROJECT_ROOT = process.env.VIBE_PLANNER_PROJECT_ROOT;
let resolvedProjectRoot: string;

if (!ENV_PROJECT_ROOT) {
  resolvedProjectRoot = process.cwd();
} else {
  resolvedProjectRoot = ENV_PROJECT_ROOT;
}

export const PROJECT_ROOT_PATH = resolvedProjectRoot;
export const MCP_DOCS_PATH = path.join(PROJECT_ROOT_PATH, 'mcp_docs');
