import path from 'path';

// Require VIBE_PLANNER_PROJECT_ROOT environment variable
const ENV_PROJECT_ROOT = process.env.VIBE_PLANNER_PROJECT_ROOT;

if (!ENV_PROJECT_ROOT) {
  throw new Error(
    '[VIBE-PLANNER][pathConstants] ERROR: VIBE_PLANNER_PROJECT_ROOT environment variable must be set!'
  );
}

export const PROJECT_ROOT_PATH = ENV_PROJECT_ROOT;
export const MCP_DOCS_PATH = path.join(PROJECT_ROOT_PATH, 'mcp_docs');

console.log(
  `[VIBE-PLANNER][pathConstants] Using VIBE_PLANNER_PROJECT_ROOT from env: ${PROJECT_ROOT_PATH}`
);
console.log(
  `[VIBE-PLANNER][pathConstants] Final MCP_DOCS_PATH: ${MCP_DOCS_PATH}`
);
