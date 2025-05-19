import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorDisplay } from '../components/common/ErrorDisplay';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { NoPlansDisplay } from '../components/home/NoPlansDisplay';
import { PlanList } from '../components/home/PlanList';
import { usePolling } from '../hooks/usePolling';
import { usePlanStore } from '../store/planStore';

// Placeholder for now. This component will display messages like
// "Select a plan" or "No plans available" when the user is at the root route.
// It can also be enhanced to show some overview or welcome message.
export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const planSummaries = usePlanStore((state) => state.planSummaries);
  const summariesLoading = usePlanStore((state) => state.summariesLoading);
  const summariesError = usePlanStore((state) => state.summariesError);
  const fetchPlanSummaries = usePlanStore((state) => state.fetchPlanSummaries);

  // Use the polling hook to fetch plan summaries every 3 seconds
  usePolling(fetchPlanSummaries, 3000);

  const handleSelectPlan = (planId: string) => {
    navigate(`/plan/${planId}`);
  };

  // The onCreatePlan for NoPlansDisplay can be implemented here if needed
  // const handleCreatePlan = () => { /* navigate to create plan page or open modal */ };

  if (summariesLoading) {
    return (
      <main className="flex-1 bg-base-100 p-6 rounded-lg shadow flex flex-col items-center justify-center text-center">
        <LoadingSpinner />
      </main>
    );
  }

  if (summariesError) {
    return (
      <main className="flex-1 bg-base-100 p-6 rounded-lg shadow flex flex-col items-center justify-center text-center">
        <ErrorDisplay message={summariesError.message} />
      </main>
    );
  }

  if (!Array.isArray(planSummaries) || planSummaries.length === 0) {
    return (
      <main className="flex-1 bg-base-100 p-6 rounded-lg shadow flex flex-col items-center justify-center text-center">
        <NoPlansDisplay /> {/* Pass onCreatePlan={handleCreatePlan} if implemented */}
      </main>
    );
  }

  return (
    <main className="flex-1 bg-base-100 p-4 md:p-6 rounded-lg shadow">
      <PlanList planSummaries={planSummaries} onSelectPlan={handleSelectPlan} />
    </main>
  );
}; 
