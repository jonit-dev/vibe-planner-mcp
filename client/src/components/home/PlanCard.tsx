import { Calendar } from 'lucide-react';
import React from 'react';
import { PrdSummary } from '../../types'; // Adjust path as needed

interface PlanCardProps {
  summary: PrdSummary;
  onSelectPlan: (_planId: string) => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({ summary, onSelectPlan }) => {
  const totalTasks = summary.totalTasks || 0;
  const completedTasks = summary.completedTasks || 0;
  const percentage =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div
      onClick={() => onSelectPlan(summary.id)}
      className='bg-base-200 p-4 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 ease-in-out cursor-pointer flex flex-col justify-between group min-h-[200px] border border-transparent hover:border-primary/30'
      role='button'
      tabIndex={0}
      onKeyPress={(e) => e.key === 'Enter' && onSelectPlan(summary.id)}
    >
      <div className='flex-grow'>
        <h3
          className='font-semibold text-lg text-base-content group-hover:text-primary transition-colors duration-300 mb-2 truncate'
          title={summary.name}
        >
          {summary.name}
        </h3>
        {summary.description && (
          <p
            className='text-sm text-base-content opacity-75 mb-3 line-clamp-3 leading-relaxed'
            title={summary.description}
          >
            {summary.description}
          </p>
        )}
      </div>

      <div className='my-3'>
        <div className='flex justify-between text-xs text-neutral-content opacity-80 mb-1'>
          <span>Progress</span>
          <span>{`${completedTasks}/${totalTasks} tasks`}</span>
        </div>
        <div className='w-full bg-base-300 rounded-full h-2.5'>
          <div
            className='bg-primary h-2.5 rounded-full transition-all duration-500 ease-out'
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        {/* Add progress messages based on percentage and totalTasks */}
        {percentage === 0 && totalTasks === 0 && (
          <p className='text-xs text-neutral-content opacity-60 mt-1'>
            No tasks yet. Add tasks to see progress.
          </p>
        )}
        {totalTasks > 0 && percentage < 100 && percentage > 0 && (
          <p className='text-xs text-primary opacity-80 mt-1'>
            Keep going!
          </p>
        )}
        {percentage === 100 && totalTasks > 0 && (
          <p className='text-xs text-success opacity-80 mt-1'>
            Plan complete!
          </p>
        )}
      </div>

      <div className='mt-auto pt-3 border-t border-base-300/70'>
        <div className='flex items-center text-xs text-neutral-content opacity-70'>
          <Calendar size={12} className='mr-1.5 flex-shrink-0' />
          <span>
            Created: {new Date(summary.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}; 
