import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import Notifications from './notifications';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  mobileSidebarOpen: boolean;
  toggleMobileSidebar: () => void;
}

export default function Header({
  sidebarOpen, 
  toggleSidebar, 
  mobileSidebarOpen, 
  toggleMobileSidebar 
}: HeaderProps) {
  const { isAuthenticated } = useAuth();
 
  const {
    notifications,
    unreadCount,
    isConnected,
    markAllAsRead,
    markAsRead,
  } = useNotifications(isAuthenticated);

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="px-2 md:px-6 py-6 flex items-center justify-between">
        <div className="inline-flex items-center gap-4">
          {/* Botão para Desktop - escondido em mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hidden lg:flex text-gray-600 hover:text-gray-900"
          >
            {sidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          {/* Botão para Mobile - escondido em desktop */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileSidebar}
            className="lg:hidden text-gray-600 hover:text-gray-900"
          >
            {mobileSidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          <h1 className="text-2xl font-bold text-gray-900">Painel</h1>
        </div>
       
        {isAuthenticated && (
          <Notifications
            notifications={notifications}
            unreadCount={unreadCount}
            isConnected={isConnected}
            markAsRead={markAsRead}
            markAllAsRead={markAllAsRead}
          />
        )}
      </div>
    </div>
  );
};