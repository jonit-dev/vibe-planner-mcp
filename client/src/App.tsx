import KanbanBoard from './components/KanbanBoard';
import type { PlanDetails } from './components/PlanDisplay'; // Type import
import PlanDisplay from './components/PlanDisplay';
// Removed unused import for ColumnWithTasks as KanbanBoard uses its own sample data by default

// Sample data for PlanDisplay
const samplePlan: PlanDetails = {
  name: 'My Awesome Project Plan - VibePlanner Kanban UI',
  description: 'This is a detailed plan to build something truly amazing and keep track of all tasks efficiently using our new Kanban board. Phase 2 focuses on UI setup.',
};

function App() {
  return (
    <div className='h-screen flex flex-col text-gray-800'>
      {/* Unified Header and Plan Display Area */}
      <div className='bg-indigo-700 text-white shadow-md'>
        <header className='py-4 px-4'>
          <div className='max-w-7xl mx-auto'>
            <h1 className='text-2xl font-bold tracking-tight'>VibePlanner Kanban</h1>
          </div>
        </header>
        <PlanDisplay plan={samplePlan} />
      </div>

      {/* Main Content Area for Kanban Board */}
      <main className='flex-1 overflow-hidden flex flex-col bg-gray-100'>
        <div className='flex-1 overflow-auto'>
          <KanbanBoard />
        </div>
      </main>
    </div>
  );
}

export default App;
