import React from 'react';
import { PrdSummary } from '../../types'; // Adjust path as needed
import { PlanCard } from './PlanCard'; // Updated to named import

interface PlanListProps {
  planSummaries: PrdSummary[];
  onSelectPlan: (_planId: string) => void;
}

export const PlanList: React.FC<PlanListProps> = ({
  planSummaries,
  onSelectPlan,
}) => {
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5'>
      {planSummaries.map((summary) => (
        <PlanCard
          key={summary.id}
          summary={summary}
          onSelectPlan={onSelectPlan}
        />
      ))}
    </div>
  );
};

// export default PlanList; // Removed default export 
