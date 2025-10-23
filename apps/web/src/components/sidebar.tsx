import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ListTodo, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import ActionModal from "@/components/tasks/action-modal";

interface SidebarProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  tasksCount: number;
  completedCount: number;
  inProgressCount: number;
  onLogout: () => void;
}

const SIDEBAR_WIDTH_CLASS = "w-64";
const SIDEBAR_WIDTH = 256;

export default function Sidebar({
  sidebarOpen,
  onLogout,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const handleLogoutClick = () => {
    setLogoutModalOpen(true);
  };

  const handleConfirmLogout = () => {
    logout();
    setLogoutModalOpen(false);
    onLogout();
  };

  const getUserInitial = (name?: string) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  return (
    <>
      <aside
        className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-200 flex flex-col z-20 transition-transform duration-300 ${SIDEBAR_WIDTH_CLASS}`}
        style={{
          transform: sidebarOpen ? 'translateX(0%)' : `translateX(-${SIDEBAR_WIDTH}px)`,
          width: `${SIDEBAR_WIDTH}px`,
        }}
      >
        <div className="flex flex-col h-full opacity-100 justify-between">
          <div className="p-6 border-b border-gray-200 flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-blue-600 rounded-lg shrink-0">
              <ListTodo className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-gray-900 truncate">Gestão de Tarefas</h2>
            </div>
          </div>

          <div className="border-t border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md">
                <span className="text-white font-semibold text-sm">
                  {getUserInitial(user?.name)}
                </span>
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-sm font-semibold truncate">
                  {user?.name || "Usuário"}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {user?.email || "email@example.com"}
                </p>
              </div>
            </div>

            <Button
              onClick={handleLogoutClick}
              variant="outline"
              className="w-full flex items-center justify-start gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      <ActionModal
        open={logoutModalOpen}
        onOpenChange={setLogoutModalOpen}
        type="danger"
        title="Sair da Conta"
        description="Você tem certeza que deseja sair? Você precisará fazer login novamente para acessar sua conta."
        actionLabel="Sair"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmLogout}
      />
    </>
  );
};