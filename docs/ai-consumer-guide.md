# AI Consumer Guide for VibePlannerTool MCP

This guide provides instructions for an AI agent on how to interact with the `VibePlannerTool` via its Model Context Protocol (MCP) interface. The goal is to enable the AI to manage and track development workflows as outlined in `system-flow.md`.

## Overview

`VibePlannerTool` is a service that allows for programmatic management of Product Requirements Documents (PRDs), development phases, and individual tasks. It exposes several MCP methods to interact with its functionalities.

The AI agent is expected to use these methods in conjunction with its own capabilities (e.g., code generation, file system access, terminal command execution) to drive the development lifecycle.

## Core Workflow (referencing `system-flow.md`)

The primary interaction flow the AI should facilitate is:

1.  **Start New Feature / Create PRD:**
    - Use `VibePlannerTool/startNewPlan` to initialize a new plan (PRD).
    - The content and detailed structure of the PRD (phases, initial tasks) should adhere to the standards in `.cursorrules/planning-documents`. The AI might be responsible for generating this content or assisting a human in doing so, then formally creating the plan via MCP.
2.  **Define Phases & Tasks for PRD:**
    - This is often part of the `startNewPlan` process if the initial PRD content includes this breakdown.
    - The AI can use `VibePlannerTool/getPlanStatus` to verify the structure.
3.  **Execute Next Task:**
    - Call `VibePlannerTool/getNextTask` to retrieve the next available task for a plan.
    - The AI (or a human developer guided by the AI) then executes this task. This might involve:
      - Writing/modifying code (using AI's code editing tools).
      - Running build scripts (using AI's terminal execution tools).
      - Consulting PRD details or other documentation.
    - The AI should call `VibePlannerTool/updateTaskStatus` to mark the task as `in_progress`.
4.  **Validate Completed Task/Phase:**
    - Once task execution is believed to be complete, call `VibePlannerTool/requestTaskValidation` to get the `validationCommand`.
    - Execute the `validationCommand` (using AI's terminal execution tools).
    - Based on the outcome (e.g., exit code, output messages), the AI calls `VibePlannerTool/updateTaskStatus` with the appropriate status (`validated`, `failed`, `completed` if no specific validation command, etc.) and any relevant details (`validationOutput`, `notes`, `exitCode`).
    - If validation fails, the task might need to be re-attempted or addressed.
    - If validation passes, loop back to get the next task or determine if the plan is complete.
5.  **Feature Accomplished:**
    - When `VibePlannerTool/getNextTask` returns no more tasks for a plan and all tasks are successfully validated, the feature can be considered accomplished.

## MCP Method Details (from `src/server.ts`)

The AI should be aware of the following `VibePlannerTool` MCP methods:

### 1. `VibePlannerTool/startNewPlan`

- **Description:** Starts a new development plan (PRD).
- **Parameters (Schema):**
  ```json
  {
    "name": "string", // Name of the plan/PRD
    "description": "string", // High-level description
    "sourceTool": "string (optional)" // Identifier for the tool/source initiating the plan
  }
  ```
- **Returns:**
  ```json
  {
    "planId": "string", // ID of the newly created plan
    "firstTask": "object (optional)" // The first task if automatically created/available
  }
  ```
- **Usage:** Call this when a new feature or major component development is initiated. The AI should ensure that the PRD itself (which might be generated separately according to `planning-documents` rule) aligns with the plan created here.

### 2. `VibePlannerTool/getPlanStatus`

- **Description:** Retrieves the current status and details of a development plan.
- **Parameters (Schema):**
  ```json
  {
    "planId": "string" // ID of the plan to query
  }
  ```
- **Returns (Structure based on `PlanOverview` in `src/vibeplanner/index.ts`):**
  ```json
  {
    "id": "string",
    "name": "string",
    "description": "string | undefined",
    "status": "string", // e.g., 'pending', 'in_progress', 'completed'
    "createdAt": "string (date-time)",
    "updatedAt": "string (date-time)",
    "sourceTool": "string | undefined",
    "phases": [
      {
        "id": "string",
        "planId": "string",
        "name": "string",
        "description": "string | undefined",
        "sequenceOrder": "number",
        "status": "string",
        // ... other phase fields
        "tasks": [
          {
            "id": "string",
            "phaseId": "string",
            "name": "string",
            "description": "string | undefined"
            // ... other task fields (status, validationCommand, etc.)
          }
        ]
      }
    ]
  }
  ```
- **Usage:** Useful for getting an overview, checking progress, or before deciding the next step.

### 3. `VibePlannerTool/getNextTask`

- **Description:** Gets the next available task for a given development plan.
- **Parameters (Schema):**
  ```json
  {
    "planId": "string" // ID of the plan
  }
  ```
- **Returns (Task object or empty if no task):**
  ```json
  {
    "id": "string",
    "phaseId": "string",
    "name": "string",
    "description": "string | undefined",
    "status": "string", // Should typically be 'pending' or 'ready'
    "sequenceOrder": "number",
    "validationCommand": "string | undefined"
    // ... other task fields
  }
  ```
  Returns an empty object `{}` if no task is available or if the plan is complete.
- **Usage:** Core method for driving the execution loop.

### 4. `VibePlannerTool/updateTaskStatus`

- **Description:** Updates the status of a specific task.
- **Parameters (Schema):**
  ```json
  {
    "taskId": "string",
    "status": "string", // From TaskStatusSchema: 'pending', 'ready', 'in_progress', 'completed', 'validated', 'failed', 'blocked', 'cancelled', 'needs_review'
    "details": {
      // Optional
      "validationOutput": "string (optional)",
      "notes": "string (optional)",
      "exitCode": "number (optional)"
    }
  }
  ```
- **Returns:** Empty object `{}` on success.
- **Usage:** Critical for tracking task lifecycle. Update status to `in_progress` when starting, and then to `validated`, `failed`, etc., after attempting validation.

### 5. `VibePlannerTool/requestTaskValidation`

- **Description:** Requests the validation command for a specific task.
- **Parameters (Schema):**
  ```json
  {
    "taskId": "string"
  }
  ```
- **Returns:**
  ```json
  {
    "validationCommand": "string | undefined"
  }
  ```
  Returns an empty object `{}` if task not found or no validation command.
- **Usage:** Call this before attempting to validate a task. The AI will then use its terminal execution capability to run the command.

### 6. `VibePlannerTool/addPhaseToPlan`

- **Description:** Adds a new phase to an existing development plan. This is used when phases are defined iteratively after the initial plan creation or if `startNewPlan` only creates the plan shell.
- **Parameters (Schema):**
  ```json
  {
    "planId": "string", // ID of the plan to add the phase to
    "name": "string", // Name of the new phase
    "description": "string?", // Optional: Description for the phase
    "sequenceOrder": "number?" // Optional: Order of this phase within the plan
  }
  ```
- **Returns (Schema):**
  ```json
  {
    "phaseId": "string", // ID of the newly created phase
    "planId": "string",
    "name": "string",
    "description": "string | undefined",
    "sequenceOrder": "number",
    "status": "string" // e.g., 'pending'
  }
  ```
- **Usage:** After a plan is created (e.g., via `startNewPlan`), use this method to define its constituent phases based on the PRD.

### 7. `VibePlannerTool/addTaskToPhase`

- **Description:** Adds a new task to a specific phase within a development plan. This allows for granular task creation.
- **Parameters (Schema):**
  ```json
  {
    "phaseId": "string", // ID of the phase to add the task to
    "name": "string", // Name of the new task
    "description": "string?", // Optional: Description for the task
    "sequenceOrder": "number?", // Optional: Order of this task within the phase
    "validationCommand": "string?" // Optional: Command to validate task completion
  }
  ```
- **Returns (Schema):**
  ```json
  {
    "taskId": "string", // ID of the newly created task
    "phaseId": "string",
    "name": "string",
    "description": "string | undefined",
    "sequenceOrder": "number",
    "status": "string", // e.g., 'pending'
    "validationCommand": "string | undefined"
  }
  ```
- **Usage:** Once phases are defined (e.g., via `addPhaseToPlan`), use this method to populate each phase with its tasks as specified in the PRD.

## Interaction with `.cursorrules/planning-documents`

- The `planning-documents` rule in `.cursorrules` defines the expected _content and structure_ of a PRD (e.g., overview, phases, tasks, technical details, testing strategy).
- `VibePlannerTool` _manages_ these plans and tasks.
- The AI should ensure that plans created via `startNewPlan` are backed by or will be populated with details conforming to the `planning-documents` rule. The PRD content itself might be generated by the AI (based on the rule) or by a human, and then its lifecycle is managed via `VibePlannerTool`.

## Error Handling and Interpretation

- Method calls to `VibePlannerTool` might return errors (e.g., if a `planId` or `taskId` is not found). The AI should be prepared to handle these.
- An empty object `{}` is often returned for successful mutations or when no specific data is found (e.g., `getNextTask` when no tasks are left).
- The `status` fields for plans, phases, and tasks are key indicators. The AI needs to interpret these to make decisions.

## AI Agent's Responsibilities

- Orchestrate the workflow using the MCP methods.
- If applicable, generate PRD content according to `planning-documents`.
- Utilize its own tools for:
  - Code editing and file manipulation.
  - Terminal command execution (especially for `validationCommand`).
  - Reading and interpreting file contents (e.g., PRD details, code).
- Make logical decisions based on the responses from `VibePlannerTool` and the outcomes of its own actions (e.g., deciding if a task validation passed or failed).
- Log its actions and the responses from `VibePlannerTool` for traceability.

This guide should serve as a starting point. The AI's specific implementation will determine how it precisely integrates these calls into its operational logic.
