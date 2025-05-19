import type { PlanOverviewData } from '../types/apiTypes';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export async function fetchPlanDetails(planId: string): Promise<PlanOverviewData> {
  const url = `${API_BASE_URL}/plans/${planId}`;
  try {
    const response = await fetch(url);

    if (!response.ok) {
      let errorMessage = `API request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        // Prefer a message from the backend error structure if available
        errorMessage = errorData.message || errorData.error || errorMessage;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_e) {
        // Could not parse JSON, stick with status or response.statusText
        errorMessage = `${errorMessage}${response.statusText ? `: ${response.statusText}` : ''}`;
      }
      throw new Error(errorMessage);
    }
    return (await response.json()) as PlanOverviewData;
  } catch (error) {
    console.error(`Failed to fetch plan details for planId ${planId}:`, error);
    // Re-throw to be caught by the caller (e.g., React component/hook)
    // Ensure it's an Error instance
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(String(error));
  }
}

// Example of how a future function might look:
// export async function updateTaskStatus(taskId: string, newStatus: TaskStatus): Promise<TaskData> {
//   const url = `${API_BASE_URL}/tasks/${taskId}/status`;
//   try {
//     const response = await fetch(url, {
//       method: 'PATCH',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ status: newStatus }),
//     });
//     if (!response.ok) {
//       let errorMessage = `API request failed with status ${response.status}`;
//       try {
//         const errorData = await response.json();
//         errorMessage = errorData.message || errorData.error || errorMessage;
//       } catch (e) {
//         errorMessage = `${errorMessage}${response.statusText ? `: ${response.statusText}` : ''}`;
//       }
//       throw new Error(errorMessage);
//     }
//     return (await response.json()) as TaskData;
//   } catch (error) {
//     console.error(`Failed to update task ${taskId} to status ${newStatus}:`, error);
//     if (error instanceof Error) {
//       throw error;
//     }
//     throw new Error(String(error));
//   }
// }
