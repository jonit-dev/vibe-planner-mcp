import React from 'react';
import { Outlet, Route, Routes } from 'react-router-dom';
import TaskDetails from './components/kanban/TaskDetails';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import HomePage from './pages/HomePage';
import KanbanPage from './pages/KanbanPage';

const AppLayout: React.FC = () => {
  return (
    <div className="h-screen flex flex-col bg-background text-base-content font-sans">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-y-auto p-4 w-full">
          <Outlet />
        </main>
      </div>
      <TaskDetails />
    </div>
  );
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="plan/:planId" element={<KanbanPage />} />
        {/* Example of a route that might not show the sidebar, if logic in AppLayout is adjusted */}
        {/* <Route path="/settings" element={<SettingsPage />} /> */}
      </Route>
      {/* You can add other top-level routes here if needed, e.g., a 404 page */}
      {/* <Route path="*" element={<NotFoundPage />} /> */}
    </Routes>
  );
}

export default App;
