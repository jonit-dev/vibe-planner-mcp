import React, { useCallback, useState } from 'react';
import { Outlet, Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/layout/Header';
import HomePage from './pages/HomePage';
import KanbanPage from './pages/KanbanPage';
import PlansPageSidebar from './pages/PlansPage';

interface SidebarStatus {
  isLoading: boolean;
  hasError: boolean;
  hasPlans: boolean;
}

// A layout component that includes the Header and a main content area for routed components
const AppLayout: React.FC = () => {
  const location = useLocation();
  const [sidebarStatus, setSidebarStatus] = useState<SidebarStatus>({
    isLoading: true, // Assume loading initially
    hasError: false,
    hasPlans: false,
  });

  const handleSidebarStatusChange = useCallback((status: SidebarStatus) => {
    setSidebarStatus(status);
  }, []);

  // Determine if the sidebar *could* be shown based on the route.
  const allowSidebarOnRoute = location.pathname === '/' || location.pathname.startsWith('/plan/');

  // Determine if the sidebar *should* be shown based on route and its content status.
  // Show if:
  // 1. Allowed on current route AND
  // 2. (Is loading OR has an error OR has plans)
  const shouldShowSidebar =
    allowSidebarOnRoute &&
    (sidebarStatus.isLoading || sidebarStatus.hasError || sidebarStatus.hasPlans);

  return (
    <div className="h-screen flex flex-col bg-background text-base-content font-sans">
      <Header />
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {shouldShowSidebar && <PlansPageSidebar onStatusChange={handleSidebarStatusChange} />}
        <div className={`flex-1 flex flex-col overflow-y-auto ${shouldShowSidebar ? '' : 'w-full'}`}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

// RootPageHandler removed as it's no longer used.

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
