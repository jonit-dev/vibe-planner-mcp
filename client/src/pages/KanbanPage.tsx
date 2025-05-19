import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { KanbanBoard } from '../components/kanban/KanbanBoard'; // Assuming this will be created
import { usePolling } from '../hooks/usePolling'; // Import the usePolling hook
import { usePlanStore } from '../store/planStore';
import { useTasksStore } from '../store/tasksStore'; // Import the new tasks store

export const KanbanPage: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();

  // Individual selectors for each piece of state/action from Zustand store
  const currentPlanDetail = usePlanStore((state) => state.currentPlanDetail);
  const detailLoading = usePlanStore((state) => state.detailLoading);
  const detailError = usePlanStore((state) => state.detailError);
  const fetchPlanDetail = usePlanStore((state) => state.fetchPlanDetail);
  const clearCurrentPlanDetail = usePlanStore((state) => state.clearCurrentPlanDetail);

  // From tasksStore - for managing and displaying tasks in the Kanban board
  const loadPlanDataForTasks = useTasksStore((state) => state.loadPlanData);
  const clearTasksData = useTasksStore((state) => state.clearPlanData);
  // const tasksLoading = useTasksStore((state) => state.isLoading); // If needed for separate loading state for tasks
  // const tasksError = useTasksStore((state) => state.error); // If needed for separate error state for tasks

  useEffect(() => {
    if (planId) {
      // fetchPlanDetail(planId); // Initial fetch handled by usePolling
    } else {
      // If no planId, ensure both stores are cleared
      clearCurrentPlanDetail();
      clearTasksData();
    }
    // Cleanup for planStore when component unmounts or planId changes
    return () => {
      clearCurrentPlanDetail();
      clearTasksData(); // Also clear tasks data
    };
  }, [planId, clearCurrentPlanDetail, clearTasksData]);

  // Setup polling for plan details
  usePolling(
    (isInitialCall) => {
      if (planId) {
        fetchPlanDetail(planId, !isInitialCall);
      }
    },
    5000, // Poll every 5 seconds
    !!planId // Enable polling only if planId is present
  );

  // Effect to load data into tasksStore once planDetail is available
  useEffect(() => {
    if (currentPlanDetail && currentPlanDetail.id === planId) {
      loadPlanDataForTasks(currentPlanDetail);
    }
    // Do not clear tasksData here based on currentPlanDetail directly,
    // as it might cause data to disappear briefly during navigation or re-renders.
    // The main cleanup in the previous useEffect handles planId changes.
  }, [currentPlanDetail, planId, loadPlanDataForTasks]);

  if (!planId) {
    return (
      <div className="p-4 flex-1 flex items-center justify-center">
        <p className="text-xl text-neutral-content opacity-70">No plan selected.</p>
      </div>
    );
  }

  if (detailLoading) {
    return (
      <div className="p-4 flex-1 flex flex-col items-center justify-center">
        <span className="loading loading-lg loading-spinner text-primary"></span>
      </div>
    );
  }

  if (detailError) {
    return (
      <div className="p-4 flex-1 flex flex-col items-center justify-center text-center">
        <p className="text-xl text-error-content">Error loading plan.</p>
        <p className="text-error-content opacity-80 mt-1">{detailError.message}</p>
      </div>
    );
  }

  if (!currentPlanDetail) {
    return (
      <div className="p-4 flex-1 flex items-center justify-center">
        <p className="text-xl text-neutral-content opacity-70">Plan not found or no details available.</p>
      </div>
    );
  }

  return (
    <div className="p-4 flex-1 flex flex-col">

      <KanbanBoard />
      {/* <div className="flex-1 bg-base-200 rounded-lg p-6 flex items-center justify-center">
        <p className="text-neutral-content opacity-50 text-center">
          Kanban board UI for "{currentPlanDetail.name}" will go here.
          <br />
          (Displaying {currentPlanDetail.phases?.length || 0} phases)
        </p>
      </div> */}
    </div>
  );
};

// export default KanbanPage; 
