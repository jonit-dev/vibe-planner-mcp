import { Briefcase } from 'lucide-react';
import React from 'react';

interface NoPlansDisplayProps {
  onCreatePlan?: () => void; // Optional: if we want to handle creation from parent
}

export const NoPlansDisplay: React.FC<NoPlansDisplayProps> = ({
  onCreatePlan,
}) => {
  return (
    <div className='flex flex-col items-center justify-center text-center flex-1 p-6'>
      <Briefcase
        size={48}
        className='text-neutral-content mb-4 opacity-50'
      />
      <p className='text-xl text-neutral-content opacity-60 mb-4'>
        No plans available yet.
      </p>
      <button className='btn btn-primary btn-sm' onClick={onCreatePlan}>
        Create Your First Plan
      </button>
    </div>
  );
};

// export default NoPlansDisplay; // Removed default export 
