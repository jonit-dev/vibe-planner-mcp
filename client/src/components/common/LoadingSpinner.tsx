import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className='flex flex-col items-center justify-center text-center flex-1 p-6'>
      <span className='loading loading-lg loading-spinner text-primary mb-4'></span>
    </div>
  );
};

// export default LoadingSpinner; // Removed default export 
