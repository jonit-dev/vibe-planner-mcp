import React from 'react';

export interface PlanDetails { // Exporting for potential use in App.tsx
  name: string;
  description?: string;
}

interface PlanDisplayProps {
  plan: PlanDetails | null;
}

const PlanDisplay: React.FC<PlanDisplayProps> = ({ plan }) => {
  if (!plan) {
    return (
      <div className='py-4 px-4 border-t border-indigo-600'>
        <div className='max-w-7xl mx-auto text-center text-indigo-200'>
          No plan selected or loaded.
        </div>
      </div>
    );
  }

  return (
    <div className='pt-2 pb-4 px-4 border-t border-indigo-500'>
      <div className='max-w-7xl mx-auto'>
        <h2 className='text-xl font-semibold text-white' title={plan.name}>
          {plan.name}
        </h2>
        {plan.description && (
          <p className='text-sm text-indigo-100 mt-1 opacity-90' title={plan.description}>
            {plan.description}
          </p>
        )}
      </div>
    </div>
  );
};

export default PlanDisplay; 
