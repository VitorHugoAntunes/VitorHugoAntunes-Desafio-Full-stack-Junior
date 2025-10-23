import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import Sidebar from '@/components/sidebar';
import MobileSidebar from '@/components/mobile-sidebar';
import Header from '@/components/header';
import { useTaskStats } from '@/hooks/useTaskStats';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  const { stats: globalStats } = useTaskStats();

  const handleLogout = () => {
    navigate({ to: '/signin' });
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  return (
    <div>
      <div className="hidden lg:block">
        <Sidebar
          sidebarOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
          tasksCount={globalStats.total}
          completedCount={globalStats.done}
          inProgressCount={globalStats.inProgress}
          onLogout={handleLogout}
        />
      </div>

      <div  className="lg:hidden">
        <MobileSidebar
        sidebarOpen={mobileSidebarOpen}
        toggleSidebar={toggleMobileSidebar}
        tasksCount={globalStats.total}
        completedCount={globalStats.done}
        inProgressCount={globalStats.inProgress}
        onLogout={handleLogout}
      />
      </div>

      <div
        className={`flex-1 transition-all duration-300 min-h-screen bg-gray-100
          ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}
      >
        <Header
          sidebarOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
          toggleMobileSidebar={toggleMobileSidebar}
          mobileSidebarOpen={mobileSidebarOpen}
        />
        {children}
      </div>
    </div>
  );
}