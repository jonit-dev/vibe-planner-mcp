import React, { useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { apiClient } from '../../lib/apiClient';
import { PlanDetail } from '../../types'; // Corrected import path
import PhaseCard from './PhaseCard';

interface PlanViewProps {
  planId: string;
}

const PlanView: React.FC<PlanViewProps> = ({ planId }) => {
  const {
    data: planDetail,
    error: detailError,
    loading: detailLoading,
    request: fetchPlanDetail,
  } = useApi<PlanDetail, [string]>(apiClient.getPlanDetail);

  useEffect(() => {
    if (planId) {
      fetchPlanDetail(planId);
    }
  }, [planId, fetchPlanDetail]);

  if (detailLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <span className="loading loading-lg loading-spinner text-primary mb-4"></span>
        <p className="text-lg text-base-content/80">Loading plan details...</p>
      </div>
    );
  }

  if (detailError) {
    return (
      <div className="p-4 bg-error text-error-content rounded-lg">
        <p className="font-semibold text-lg">Error loading plan details:</p>
        <p>{detailError.message}</p>
      </div>
    );
  }

  if (!planDetail) {
    return <p className="p-4 text-center text-lg text-base-content/70">Select a plan or no details found.</p>;
  }

  return (
    <div className="p-4 bg-base-200 rounded-lg shadow-lg h-full overflow-y-auto">
      <h1 className="text-3xl font-bold mb-2 text-accent">{planDetail.name}</h1>
      <div className="text-sm text-base-content/80 mb-4">
        <p><span className="font-semibold">ID:</span> {planDetail.id}</p>
        {planDetail.description && (
          <p><span className="font-semibold">Description:</span> {planDetail.description}</p>
        )}
        <p><span className="font-semibold">Status:</span> <span className="font-medium">{planDetail.status.replace('_', ' ')}</span></p>
        <p><span className="font-semibold">Created:</span> {new Date(planDetail.creationDate).toLocaleString()}</p>
        <p><span className="font-semibold">Last Updated:</span> {new Date(planDetail.updatedAt).toLocaleString()}</p>
        {planDetail.completionDate && (
          <p><span className="font-semibold">Completed:</span> {new Date(planDetail.completionDate).toLocaleString()}</p>
        )}
      </div>

      <h2 className="text-2xl font-semibold mt-6 mb-3 text-secondary border-b border-base-content/20 pb-1">Phases</h2>
      {planDetail.phases && planDetail.phases.length > 0 ? (
        <div className="space-y-4">
          {planDetail.phases.sort((a, b) => a.order - b.order).map(phase => (
            <PhaseCard key={phase.id} phase={phase} />
          ))}
        </div>
      ) : (
        <p className="italic text-base-content/70">No phases defined for this plan.</p>
      )}
    </div>
  );
};

export default PlanView; 
