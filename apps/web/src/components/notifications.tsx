import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { type Notification } from '@/hooks/useNotifications';
import { useState } from 'react';
import { translateStatus } from '@/utils/taskUtils';

interface NotificationsProps {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
}

export default function Notifications({
  notifications,
  unreadCount,
  isConnected,
  markAsRead,
  markAllAsRead,
}: NotificationsProps) {
  const [open, setOpen] = useState(false);

  const handleNotificationClick = (notification: Notification) => {
    console.log('👆 Clicked notification:', notification.id);
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  const formatNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case 'TASK_ASSIGNED':
        return (
          <>
            Nova tarefa atribuída:{' '}
            <strong>{notification.data.taskTitle || 'Sem título'}</strong>
          </>
        );
      case 'TASK_STATUS_CHANGED':
        return (
          <>
            Status alterado de{' '}
            <strong>{translateStatus(notification.data.previousStatus ?? '').toUpperCase() || 'N/A'}</strong> para{' '}
            <strong>{translateStatus(notification.data.newStatus ?? '').toUpperCase() || 'N/A'}</strong> em{' '}
            <strong>{notification.data.taskTitle || 'Sem título'}</strong>
          </>
        );
      case 'TASK_COMMENT_ADDED':
        return (
          <>
            Novo comentário em{' '}
            <strong>{notification.data.taskTitle || 'Sem título'}</strong>:{' '}
            "{notification.data.commentPreview || 'Sem texto'}"
          </>
        );
      default:
        return 'Notificação';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-gray-600 hover:text-gray-900"
          title={
            isConnected
              ? 'Notificações'
              : 'Reconectando ao servidor de notificações...'
          }
        >
          <Bell className="h-5 w-5" />
          
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-red-500 rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Notificações
            </h3>
          </div>
          
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8"
              onClick={() => markAllAsRead()}
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>

        <div className="max-h-[500px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500">
                Nenhuma notificação no momento
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Indicador de não lido */}
                    {!notification.isRead && (
                      <div className="shrink-0 w-2 h-2 mt-2 bg-blue-500 rounded-full" />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm ${
                          !notification.isRead
                            ? 'text-gray-900 font-medium'
                            : 'text-gray-600'
                        }`}
                      >
                        {formatNotificationText(notification)}
                      </p>
                      
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.createdAt).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-3 border-t bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              {unreadCount > 0
                ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''} de ${notifications.length}`
                : `Todas as ${notifications.length} notificações foram lidas`}
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}