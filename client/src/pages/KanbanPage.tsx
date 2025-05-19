import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { usePlanStore } from '../store/planStore';
// import KanbanBoard from '../components/kanban/KanbanBoard'; // Assuming this will be created

const KanbanPage: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();

  // Individual selectors for each piece of state/action from Zustand store
  const currentPlanDetail = usePlanStore((state) => state.currentPlanDetail);
  const detailLoading = usePlanStore((state) => state.detailLoading);
  const detailError = usePlanStore((state) => state.detailError);
  const fetchPlanDetail = usePlanStore((state) => state.fetchPlanDetail);
  const clearCurrentPlanDetail = usePlanStore((state) => state.clearCurrentPlanDetail);

  useEffect(() => {
    if (planId) {
      fetchPlanDetail(planId);
    }
    // Cleanup when component unmounts or planId changes
    return () => {
      clearCurrentPlanDetail();
    };
  }, [planId, fetchPlanDetail, clearCurrentPlanDetail]);

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
        <p className="mt-3 text-info-content opacity-70">Loading plan details...</p>
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
      <h1 className="text-3xl font-bold mb-6 text-base-content">{currentPlanDetail.name}</h1>
      {currentPlanDetail.description && (
        <p className="mb-6 text-lg text-base-content opacity-80">{currentPlanDetail.description}</p>
      )}
      {/* <KanbanBoard plan={currentPlanDetail} /> */}
      <div className="flex-1 bg-base-200 rounded-lg p-6 flex items-center justify-center">
        <p className="text-neutral-content opacity-50 text-center">
          Kanban board UI for "{currentPlanDetail.name}" will go here.
          <br />
          (Displaying {currentPlanDetail.phases?.length || 0} phases)
        </p>
      </div>
    </div>
  );
};

export default KanbanPage; 
