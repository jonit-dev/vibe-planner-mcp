import React from 'react';

// Placeholder for now. This component will display messages like
// "Select a plan" or "No plans available" when the user is at the root route.
// It can also be enhanced to show some overview or welcome message.
const HomePage: React.FC = () => {
  return (
    <main className="flex-1 bg-base-100 p-4 rounded-lg shadow flex flex-col items-center justify-center text-center">
      <div>
        <p className="text-xl text-neutral-content opacity-50">Select a plan from the sidebar to view its details or Kanban board.</p>
        {/* 
          This message can be made dynamic based on whether plans are loading, errored, or if none exist.
          That state might need to be lifted or shared via context/store if HomePage needs to know about it
          independently of PlansPage (sidebar).
        */}
      </div>
    </main>
  );
};

export default HomePage; 
