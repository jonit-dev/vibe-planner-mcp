import React from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import KanbanBoard from './components/kanban/KanbanBoard';
import TaskDetails from './components/kanban/TaskDetails';
import { useKanbanStore } from './store/kanbanStore';

function App() {
  const { selectedTask } = useKanbanStore();

  return (
    <div className="h-full flex flex-col bg-background text-base-content">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <KanbanBoard />
      </div>
      {selectedTask && <TaskDetails />}
    </div>
  );
}

export default App;