import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { apiClient } from '../lib/apiClient';
import { PrdSummary } from '../types';

interface PlansPageSidebarProps {
  onStatusChange: (status: { isLoading: boolean; hasError: boolean; hasPlans: boolean }) => void;
}

const PlansPageSidebar: React.FC<PlansPageSidebarProps> = ({ onStatusChange }) => {
  const navigate = useNavigate();

  const {
    data: planSummaries,
    error: summariesError,
    loading: summariesLoading,
    request: fetchSummaries,
  } = useApi<PrdSummary[]>(apiClient.getPlanSummaries);

  useEffect(() => {
    fetchSummaries();
  }, [fetchSummaries]);

  useEffect(() => {
    const isLoading = summariesLoading;
    const hasError = !!summariesError;
    const hasPlans = !isLoading && !hasError && Array.isArray(planSummaries) && planSummaries.length > 0;
    onStatusChange({ isLoading, hasError, hasPlans });
  }, [summariesLoading, summariesError, planSummaries, onStatusChange]);

  const handleSelectPlan = (planId: string) => {
    navigate(`/plan/${planId}`);
  };

  if (summariesLoading) {
    return (
      <aside className="w-full md:w-1/3 lg:w-1/4 bg-base-100 p-4 rounded-lg shadow flex flex-col h-full items-center justify-center">
        <span className="loading loading-md loading-spinner text-primary"></span>
        <p className="mt-2 text-info-content opacity-70">Loading plans...</p>
      </aside>
    );
  }

  if (summariesError) {
    return (
      <aside className="w-full md:w-1/3 lg:w-1/4 bg-base-100 p-4 rounded-lg shadow flex flex-col h-full items-center justify-center text-center">
        <p className="text-error-content opacity-80">Could not load plans.</p>
        <p className="text-xs text-error-content opacity-60 mt-1">Try refreshing.</p>
      </aside>
    );
  }

  if (!Array.isArray(planSummaries) || planSummaries.length === 0) {
    return (
      <aside className="w-full md:w-1/3 lg:w-1/4 bg-base-100 p-4 rounded-lg shadow flex flex-col h-full items-center justify-center text-center">
        <p className="text-neutral-content opacity-60">No plans available.</p>
      </aside>
    );
  }

  return (
    <aside className="w-full md:w-1/3 lg:w-1/4 bg-base-100 p-4 rounded-lg shadow flex flex-col h-full overflow-y-auto">
      <h2 className="text-2xl font-bold mb-4 text-primary text-center">Plans</h2>
      <ul className="space-y-2">
        {planSummaries.map((summary) => (
          <li key={summary.id}>
            <button
              onClick={() => handleSelectPlan(summary.id)}
              className={`w-full text-left p-3 rounded-md transition-colors duration-150 ease-in-out bg-base-200 hover:bg-base-300 focus:bg-primary focus:text-primary-content`}
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
    </aside>
  );
};

export default PlansPageSidebar; 
