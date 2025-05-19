import { Briefcase, Zap } from 'lucide-react'; // Example icons
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlanStore } from '../store/planStore';

// Placeholder for now. This component will display messages like
// "Select a plan" or "No plans available" when the user is at the root route.
// It can also be enhanced to show some overview or welcome message.
const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const planSummaries = usePlanStore((state) => state.planSummaries);
  const summariesLoading = usePlanStore((state) => state.summariesLoading);
  const summariesError = usePlanStore((state) => state.summariesError);
  const fetchPlanSummaries = usePlanStore((state) => state.fetchPlanSummaries);

  useEffect(() => {
    fetchPlanSummaries();
  }, [fetchPlanSummaries]);

  const handleSelectPlan = (planId: string) => {
    navigate(`/plan/${planId}`);
  };

  if (summariesLoading) {
    return (
      <main className="flex-1 bg-base-100 p-6 rounded-lg shadow flex flex-col items-center justify-center text-center">
        <span className="loading loading-lg loading-spinner text-primary mb-4"></span>
        <p className="text-lg text-info-content opacity-70">Loading plans...</p>
      </main>
    );
  }

  if (summariesError) {
    return (
      <main className="flex-1 bg-base-100 p-6 rounded-lg shadow flex flex-col items-center justify-center text-center">
        <Zap size={48} className="text-error mb-4 opacity-70" />
        <p className="text-xl text-error-content mb-1">Could not load plans.</p>
        <p className="text-sm text-error-content opacity-80">Error: {summariesError.message}</p>
        {/* Add a retry button? */}
      </main>
    );
  }

  if (!Array.isArray(planSummaries) || planSummaries.length === 0) {
    return (
      <main className="flex-1 bg-base-100 p-6 rounded-lg shadow flex flex-col items-center justify-center text-center">
        <Briefcase size={48} className="text-neutral-content mb-4 opacity-50" />
        <p className="text-xl text-neutral-content opacity-60 mb-4">No plans available yet.</p>
        <button className="btn btn-primary btn-sm">
          {/* Placeholder for a future "Create Plan" action */}
          Create Your First Plan
        </button>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-base-100 p-4 md:p-6 rounded-lg shadow">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-primary text-center">
        Available Plans
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {planSummaries.map((summary) => (
          <div
            key={summary.id}
            onClick={() => handleSelectPlan(summary.id)}
            className="bg-base-200 p-5 rounded-xl shadow-lg hover:shadow-xl hover:border-primary/50 border-2 border-transparent transition-all duration-300 ease-in-out cursor-pointer flex flex-col justify-between min-h-[160px] group"
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && handleSelectPlan(summary.id)}
          >
            <div className="flex-grow">
              <h3
                className="font-semibold text-lg text-primary group-hover:text-primary-focus transition-colors duration-300 mb-2 truncate"
                title={summary.name}
              >
                {summary.name}
              </h3>
              {summary.description && (
                <p
                  className="text-sm text-base-content opacity-75 mb-3 line-clamp-3 leading-relaxed"
                  title={summary.description}
                >
                  {summary.description}
                </p>
              )}
            </div>
            <div className="mt-auto pt-3 border-t border-base-300/70">
              <p className="text-xs text-neutral-content opacity-60">
                Created: {new Date(summary.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
};

export default HomePage; 
