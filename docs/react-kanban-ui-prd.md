# PRD: React/Tailwind Kanban UI for VibePlannerTool

## 1. Overview

- **Context & Goals**:
  - Provide a user-friendly interface to visualize and manage development tasks within the VibePlannerTool.
  - Enable users to easily track the status and progress of tasks.
  - Improve overall project visibility and workflow management.
  - Offer an alternative to CLI-based interactions for viewing task status.
- **Current Pain Points**:
  - Task status and progress are currently managed via CLI or direct data inspection, which is not user-friendly for all users.
  - Lack of a visual overview makes it harder to grasp the overall project state quickly.
  - No dedicated interface for interacting with tasks in a visual manner.
  - Difficult to share plan status with non-technical stakeholders.

## 2. Proposed Solution

- **High‑level Summary**:
  - Develop a single-page React application (SPA) styled with Tailwind CSS.
  - The UI will display tasks in a Kanban-like board, with columns representing different task statuses (e.g., To Do, In Progress, Done, Blocked).
  - The client application will fetch data from and send updates to the VibePlannerTool backend via a new set of RESTful API endpoints.
  - Initially focus on read-only display of tasks and their statuses.
  - Future iterations could include task updates, creation, and more interactive features.
- **Architecture & Directory Structure**:
  - New frontend directory: `ui/` or `src/ui/` at the root of the project.
  - Backend: New API routes will be added, likely integrated with the existing VibePlannerTool infrastructure or via a lightweight web server framework (e.g., Express.js) if not directly supported by the MCP SDK for HTTP exposure.

## 3. Implementation Plan

- **Phase 1: Backend API Development (Estimate: 3-5 days)**

  1.  Define and document REST API endpoints for:
      - `GET /api/plans`: List all plans (optional, if multiple plans are a concept).
      - `GET /api/plans/{planId}`: Get details of a specific plan (including its name, description, phases, and tasks).
      - `GET /api/tasks/{taskId}`: Get details of a specific task (redundant if task details are comprehensive in plan details).
      - _(Future)_ `PATCH /api/tasks/{taskId}`: Update task status or other details.
  2.  Implement these API endpoints by creating handlers that leverage existing services:
      - `PrdLifecycleService` for PRD (plan) details.
      - `PhaseControlService` for phase details.
      - `TaskOrchestrationService` for task details and updates.
  3.  Determine the best way to expose these as HTTP endpoints (e.g., extending MCP tool capabilities if possible, or adding a minimal HTTP server wrapper).
  4.  Write unit and integration tests for the new API endpoints.

- **Phase 2: Frontend Setup & Basic UI (Estimate: 5-7 days)**

  1.  Set up a new React project (e.g., using Vite) within the `ui/` directory.
  2.  Integrate Tailwind CSS for styling.
  3.  Create basic UI components:
      - `PlanDisplay`: To show selected plan's details.
      - `KanbanBoard`: Container for columns.
      - `KanbanColumn`: Represents a task status (e.g., "To Do", "In Progress", "Done").
      - `TaskCard`: Displays individual task information (name, description, status).
  4.  Implement API service calls in the frontend (e.g., using `fetch` or `axios`) to consume the backend APIs.

- **Phase 3: UI Polish & Data Display (Read-only) (Estimate: 4-6 days)**

  1.  Fetch and display plan details, including phases and tasks, from the API.
  2.  Dynamically render tasks into appropriate Kanban columns based on their status.
  3.  Ensure responsive design for usability across different screen sizes.
  4.  Implement loading states and basic error handling (e.g., "Failed to load plan").
  5.  Write unit tests for React components and API service functions.

- **Phase 4: (Optional/Future) UI Interactivity (Read-Write)**
  1.  Implement functionality to update task status (e.g., drag-and-drop between columns, or a button on the task card) by calling the `PATCH /api/tasks/{taskId}` endpoint.
  2.  Provide user feedback on successful/failed updates.

## 4. File and Directory Structures

- **Backend (Illustrative - if using a separate HTTP server like Express.js)**:

  ```
  src/
  ├── http-api/  // New directory for HTTP specific logic
  │   ├── routes/
  │   │   ├── planRoutes.ts
  │   │   └── taskRoutes.ts
  │   ├── controllers/
  │   │   ├── planController.ts
  │   │   └── taskController.ts
  │   ├── server.ts    // Main HTTP server setup
  │   └── middlewares/ // (e.g., error handling, logging)
  ├── vibeplanner/ (existing)
  │   ├── services/ (existing, to be used by controllers)
  │   └── ...
  └── ...
  ```

  _(If extending MCP directly, the structure might differ, integrating into existing tool request handling)_

- **Frontend (`ui/`)**:
  ```
  ui/
  ├── public/
  │   └── index.html
  ├── src/
  │   ├── components/
  │   │   ├── KanbanBoard.tsx
  │   │   ├── KanbanColumn.tsx
  │   │   ├── TaskCard.tsx
  │   │   └── Navbar.tsx // Optional, for navigation/header
  │   ├── pages/ // Or top-level components acting as pages
  │   │   └── PlanDashboardPage.tsx // Main page displaying the Kanban
  │   ├── services/
  │   │   └── vibePlannerApi.ts // Functions to call backend REST API
  │   ├── hooks/ // Custom React hooks
  │   │   ├── useFetchPlan.ts
  │   ├── contexts/ // React context for state management if needed
  │   ├── App.tsx
  │   ├── main.tsx // (or index.tsx) React app entry point
  │   └── types/ // Frontend-specific TypeScript types (can share/derive from backend types)
  ├── package.json
  ├── tsconfig.json
  ├── tailwind.config.js
  └── postcss.config.js
  ```

## 5. Technical Details

- **Backend API Endpoint Skeletons (Conceptual)**:

  - **`GET /api/plans/{planId}`**
    - Response: `PlanOverview` (from `src/vibeplanner/index.ts`) or a slightly augmented version for UI needs.
    ```typescript
    // In a controller or handler:
    // async getPlan(planId: string): Promise<PlanOverview> {
    //   const prd = await this.prdLifecycleService.getPrd(planId);
    //   if (!prd) { throw new Error('Plan not found'); }
    //   const phasesWithTasks = await this.phaseControlService.getPhasesWithTasks(planId);
    //   return {
    //     ...prd,
    //     phases: phasesWithTasks.map(p => ({ ...p, tasks: p.tasks || [] })),
    //   };
    // }
    ```
  - **`PATCH /api/tasks/{taskId}`** (Future)
    - Request Body: `{ status: TaskStatus, notes?: string }`
    - Response: Updated `Task` object.
    ```typescript
    // In a controller or handler:
    // async updateTaskStatus(taskId: string, newStatus: TaskStatus, notes?: string): Promise<Task> {
    //   const updatedTask = await this.taskOrchestrationService.updateTask(taskId, { status: newStatus, notes });
    //   if (!updatedTask) { throw new Error('Failed to update task'); }
    //   return updatedTask;
    // }
    ```

- **Frontend React Component Skeleton (Illustrative)**:

  ```tsx
  // ui/src/components/TaskCard.tsx
  import React from 'react';
  // Assuming Task type is imported or defined
  // import { Task } from '../../src/vibeplanner/types'; // Path might need adjustment

  interface TaskCardProps {
    task: { id: string; name: string; description?: string; status: string }; // Simplified for example
  }

  const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
    return (
      <div className='p-3 mb-2 bg-white rounded-lg shadow border border-gray-200'>
        <h4 className='font-semibold text-sm mb-1'>{task.name}</h4>
        {task.description && (
          <p className='text-xs text-gray-600 mb-2'>{task.description}</p>
        )}
        <span className='px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700'>
          {task.status}
        </span>
      </div>
    );
  };

  export default TaskCard;
  ```

## 6. Usage Examples

- **Fetching plan data in a React component**:

  ```tsx
  // ui/src/hooks/useFetchPlan.ts
  // import { useState, useEffect } from 'react';
  // import { fetchPlanDetails } from '../services/vibePlannerApi'; // API service
  // import { PlanOverview } from '../../../src/vibeplanner'; // Adjust path

  // function useFetchPlan(planId: string) {
  //   const [plan, setPlan] = useState<PlanOverview | null>(null);
  //   const [loading, setLoading] = useState<boolean>(true);
  //   const [error, setError] = useState<string | null>(null);

  //   useEffect(() => {
  //     if (!planId) return;
  //     const loadPlan = async () => {
  //       try {
  //         setLoading(true);
  //         const data = await fetchPlanDetails(planId);
  //         setPlan(data);
  //       } catch (err) {
  //         setError(err instanceof Error ? err.message : 'Failed to load plan');
  //       } finally {
  //         setLoading(false);
  //       }
  //     };
  //     loadPlan();
  //   }, [planId]);

  //   return { plan, loading, error };
  // }
  ```

- **Rendering tasks in a Kanban column**:
  ```tsx
  // ui/src/components/KanbanColumn.tsx
  // // Inside KanbanColumn component, assuming `tasks` prop is an array of tasks for that column:
  // // {tasks.map(task => <TaskCard key={task.id} task={task} />)}
  ```

## 7. Testing Strategy

- **Unit Tests**:
  - Backend: Test API controllers/handlers, ensuring they correctly call and process data from `VibePlannerTool` services. Mock service dependencies.
  - Frontend: Test React components for rendering logic, state changes, and prop handling (using React Testing Library). Test API service functions (mocking `fetch`).
- **Integration Tests**:
  - Backend: Test API endpoints by making HTTP requests to a running test instance (with mocked or test database) and verifying responses.
  - (Optional/E2E) Frontend-Backend: Use tools like Cypress or Playwright to test user flows from the UI through to the backend and back.

## 8. Edge Cases

| Edge Case                                  | Remediation                                                                                          |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| API endpoint `/api/plans/{planId}` is down | Frontend displays a "Could not load plan data" message and potentially a retry button.               |
| Invalid `planId` provided in URL           | API returns a 404. Frontend displays a "Plan not found" message.                                     |
| Task has an unrecognized status            | UI could place it in a default "Unknown Status" column or log an error and not display the task.     |
| Very long task names or descriptions       | UI should truncate text with ellipsis and show full text on hover or in a modal.                     |
| No tasks exist for a given plan/phase      | UI displays an empty state message within the relevant column/phase section (e.g., "No tasks here"). |
| Network interruption during data fetching  | Frontend handles fetch errors gracefully, informs the user.                                          |

## 9. Sequence Diagram (Fetching and Displaying Plan for UI)

```mermaid
sequenceDiagram
    participant User
    participant ReactUI as React UI (PlanDashboardPage)
    participant APIService as Frontend API Service (vibePlannerApi.ts)
    participant BackendAPI as Backend REST API
    participant VibePlannerServices as VibePlanner Core Services

    User->>ReactUI: Navigates to view a plan (e.g., with planId)
    ReactUI->>APIService: fetchPlanDetails(planId)
    APIService->>BackendAPI: GET /api/plans/{planId}
    BackendAPI->>VibePlannerServices: Calls getPrd(planId)
    VibePlannerServices-->>BackendAPI: Returns PRD details
    BackendAPI->>VibePlannerServices: Calls getPhasesWithTasks(planId)
    VibePlannerServices-->>BackendAPI: Returns phases and tasks
    BackendAPI-->>APIService: Responds with PlanOverview JSON
    APIService-->>ReactUI: Returns parsed PlanOverview data
    ReactUI->>User: Renders Kanban board with tasks and columns
end
```

## 10. Risks & Mitigations

| Risk                                                             | Mitigation                                                                                                                                                                |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Defining a stable and comprehensive API for UI needs             | Iterative API design with frontend developer feedback. Start with core read-only needs. Version API if significant changes are needed.                                    |
| Complexity of integrating a new HTTP server/routes with MCP tool | Thoroughly investigate MCP SDK capabilities for exposing HTTP. If not feasible, use a lightweight, well-understood framework like Express.js and ensure clear separation. |
| State management in React for a potentially complex UI           | Start with local component state and hooks. Evaluate need for global state (Context API, Zustand, Redux Toolkit) if complexity grows.                                     |
| Styling consistency and Tailwind CSS setup                       | Ensure Tailwind is configured correctly. Develop a basic style guide or component library early.                                                                          |
| Performance with many tasks on the board                         | Implement virtualization for task lists within columns (e.g., `react-window` or `react-virtualized`) if performance becomes an issue.                                     |

## 11. Timeline

- **Phase 1: Backend API Development**: 3-5 days
- **Phase 2: Frontend Setup & Basic UI**: 5-7 days
- **Phase 3: UI Polish & Data Display (Read-only)**: 4-6 days
- **Total Estimated Time (Read-only MVP)**: **12-18 days**
- _(Phase 4: UI Interactivity (Read-Write) would be a subsequent, separately estimated effort)_

## 12. Acceptance Criteria

- Backend REST API endpoint `GET /api/plans/{planId}` is implemented, documented, and returns plan data including phases and tasks.
- A new React application is set up in the `ui/` directory, using Yarn and TypeScript.
- Tailwind CSS is integrated and configured for styling the React application.
- The UI can fetch data from the `GET /api/plans/{planId}` endpoint for a given plan ID.
- The UI displays tasks in a Kanban-style board, with columns representing task statuses (e.g., "PENDING", "IN_PROGRESS", "COMPLETED", "BLOCKED", "VALIDATION_REQUESTED").
- Each task card on the board displays at least its name and status.
- Basic error handling is implemented in the UI (e.g., for API request failures).
- The PRD document (`react-kanban-ui-prd.md`) is reviewed and approved.

## 13. Conclusion

Developing a React/Tailwind Kanban UI will significantly improve the visibility and manageability of tasks within the VibePlannerTool. This plan outlines the steps to create a read-only MVP, providing a solid foundation for future interactive features. The primary focus is on clear data presentation and a user-friendly interface, supported by robust backend API endpoints.

## 14. Assumptions & Dependencies

- The VibePlannerTool's existing services (`PrdLifecycleService`, `PhaseControlService`, `TaskOrchestrationService`) are suitable for providing data to the new API.
- The project can accommodate either extending the MCP tool for HTTP exposure or running a separate lightweight Node.js/Express.js server for the REST API.
- Team has, or will allocate time for, proficiency in React, TypeScript, and Tailwind CSS.
- Yarn will be used for package management in the `ui/` project, consistent with parent project instructions.
- The initial scope is read-only access to plan and task data.
- No complex authentication/authorization layer is required for the initial API endpoints beyond what might already be in place for tool interactions. If VibePlannerTool operations are inherently secure, the API must respect this.
- The `PlanOverview` type from `src/vibeplanner/index.ts` (or a derivative) will serve as the primary data structure for the plan display.
- Task statuses to be displayed on the Kanban board are derived from the `TaskStatus` enum in `src/vibeplanner/types.ts`.

```

```
