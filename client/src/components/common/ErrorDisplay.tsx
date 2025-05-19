import { Zap } from 'lucide-react';
import React from 'react';

interface ErrorDisplayProps {
  message: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message }) => {
  return (
    <div className='flex flex-col items-center justify-center text-center flex-1 p-6'>
      <Zap size={48} className='text-error mb-4 opacity-70' />
      <p className='text-xl text-error-content mb-1'>
        Could not load plans.
      </p>
      <p className='text-sm text-error-content opacity-80'>
        Error: {message}
      </p>
    </div>
  );
};

// export default ErrorDisplay; // Removed default export 
