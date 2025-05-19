import React from 'react';
import { useParams } from 'react-router-dom';

const KanbanPage: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Kanban Board for Plan: {planId}</h1>
      <p>Kanban board content will go here.</p>
      {/* Future Kanban components will be rendered here */}
    </div>
  );
};

export default KanbanPage; 
