import { useEffect, useState } from 'react';
import Header from './components/layout/Header';
import PlanView from './components/plans/PlanView';
import { useApi } from './hooks/useApi';
import { apiClient } from './lib/apiClient';
import { PrdSummary } from './types';

// PlanViewPlaceholder removed as PlanView is now more complete

function App() {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const {
    data: planSummaries,
    error: summariesError,
    loading: summariesLoading,
    request: fetchSummaries,
  } = useApi<PrdSummary[]>(apiClient.getPlanSummaries);

  // Removed planDetail fetching from App.tsx as PlanView handles its own data

  useEffect(() => {
    fetchSummaries();
  }, [fetchSummaries]);

  // useEffect for fetchPlanDetail removed from App.tsx

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
  };

  // Determine if the main "no plans" state should be shown
  const showNoPlansState = !summariesLoading && !summariesError && (!Array.isArray(planSummaries) || planSummaries.length === 0);
  // Determine if sidebar should be visible
  const showSidebar = !showNoPlansState; // Sidebar is hidden only when explicitly in "no plans" state

  return (
    <div className="h-screen flex flex-col bg-background text-base-content font-sans">
      <Header />
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* Sidebar for Plan Summaries - conditionally rendered */}
        {showSidebar && (
          <aside className="w-1/3 lg:w-1/4 bg-base-100 p-4 rounded-lg shadow flex flex-col">
            <h2 className="text-2xl font-bold mb-4 text-primary text-center">Plans</h2>

            {/* Plan List - only shows if loaded successfully and plans exist */}
            {/* This condition is implicitly met if showSidebar is true and not loading/error */}
            {!summariesLoading && !summariesError && Array.isArray(planSummaries) && planSummaries.length > 0 && (
              <ul className="space-y-2 overflow-y-auto">
                {planSummaries.map((summary) => (
                  <li key={summary.id}>
                    <button
                      onClick={() => handleSelectPlan(summary.id)}
                      className={`w-full text-left p-3 rounded-md transition-colors duration-150 ease-in-out 
                                  ${selectedPlanId === summary.id
                          ? 'bg-primary text-primary-content'
                          : 'bg-base-200 hover:bg-base-300'}`}
                    >
                      <h3 className="font-semibold text-lg">{summary.name}</h3>
                      {summary.description && (
                        <p className="text-sm opacity-75 truncate">{summary.description}</p>
                      )}
                      <p className="text-xs opacity-60 mt-1">Created: {new Date(summary.createdAt).toLocaleDateString()}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {/* If loading or error, sidebar still shows title but main area handles message */}
            {(summariesLoading || summariesError) && (
              <div className="flex-1 flex items-center justify-center">
                {/* Placeholder to maintain structure if sidebar is shown during load/error */}
              </div>
            )}
          </aside>
        )}

        {/* Main Content Area for Selected Plan Details / Status Messages */}
        <main className={`bg-base-100 p-4 rounded-lg shadow flex flex-col items-center justify-center text-center ${showSidebar ? 'flex-1' : 'w-full'}`}>
          {summariesLoading ? (
            <div>
              <span className="loading loading-lg loading-spinner text-primary mb-4"></span>
              <p className="text-xl text-info-content opacity-70">Loading plans...</p>
            </div>
          ) : summariesError ? (
            <div>
              <p className="text-xl text-error-content opacity-70">Could not load plans.</p>
              <p className="text-sm text-error-content opacity-60">Please ensure the backend server is running and try again.</p>
            </div>
          ) : showNoPlansState ? (
            <div>
              <p className="text-2xl font-semibold text-neutral-content opacity-60">No plans available.</p>
              <p className="text-md text-neutral-content opacity-50 mt-2">Get started by creating a new plan.</p> {/* Updated message */}
            </div>
          ) : selectedPlanId ? (
            <PlanView planId={selectedPlanId} />
          ) : (
            <div>
              <p className="text-xl text-neutral-content opacity-50">Select a plan to view its details.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
