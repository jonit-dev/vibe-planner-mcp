import { Briefcase, Calendar, Zap } from 'lucide-react'; // Added Calendar, Clock, TagIcon
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlanStore } from '../store/planStore';
import { PrdSummary } from '../types'; // Import PrdSummary for typing

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

  // Dummy progress for now - API needs to provide this
  const getPlanProgress = (planId: string): { total: number, completed: number, percentage: number } => {
    // In a real scenario, this data would come from planSummary or a separate fetch
    // For demonstration, let's simulate some progress.
    // This should be removed/updated once API provides actual data.
    const dummyProgressMap: { [key: string]: { total: number, completed: number } } = {
      "plan-1": { total: 10, completed: 3 },
      "plan-2": { total: 5, completed: 5 },
      "plan-3": { total: 8, completed: 1 },
    };
    const progress = dummyProgressMap[planId] || { total: Math.floor(Math.random() * 10) + 5, completed: Math.floor(Math.random() * 5) };
    return {
      ...progress,
      percentage: progress.total > 0 ? (progress.completed / progress.total) * 100 : 0,
    };
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
        {planSummaries.map((summary: PrdSummary) => {
          const progress = getPlanProgress(summary.id); // Get dummy progress

          return (
            <div
              key={summary.id}
              onClick={() => handleSelectPlan(summary.id)}
              className="bg-base-200 p-4 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 ease-in-out cursor-pointer flex flex-col justify-between group min-h-[200px] border border-transparent hover:border-primary/30"
              role="button"
              tabIndex={0}
              onKeyPress={(e) => e.key === 'Enter' && handleSelectPlan(summary.id)}
            >
              <div className="flex-grow">
                <h3
                  className="font-semibold text-lg text-base-content group-hover:text-primary transition-colors duration-300 mb-2 truncate"
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

              {/* Placeholder for Progress Bar - Requires API update */}
              <div className="my-3">
                <div className="flex justify-between text-xs text-neutral-content opacity-80 mb-1">
                  <span>Progress</span>
                  <span>{`${progress.completed}/${progress.total} tasks`}</span>
                </div>
                <div className="w-full bg-base-300 rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress.percentage}%` }}
                  ></div>
                </div>
                {progress.percentage === 0 && progress.total === 0 && (
                  <p className="text-xs text-neutral-content opacity-60 mt-1">No tasks yet. Add tasks to see progress.</p>
                )}
                {progress.total > 0 && progress.percentage < 100 && progress.percentage > 0 && (
                  <p className="text-xs text-primary opacity-80 mt-1">Keep going!</p>
                )}
                {progress.percentage === 100 && progress.total > 0 && (
                  <p className="text-xs text-success opacity-80 mt-1">Plan complete!</p>
                )}
              </div>

              <div className="mt-auto pt-3 border-t border-base-300/70">
                <div className="flex items-center text-xs text-neutral-content opacity-70">
                  <Calendar size={12} className="mr-1.5 flex-shrink-0" />
                  <span>Created: {new Date(summary.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
};

export default HomePage; 
