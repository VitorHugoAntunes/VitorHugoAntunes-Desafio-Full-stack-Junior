import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export interface Notification {
  id: string;
  userId: string;
  taskId: string;
  type: 'TASK_ASSIGNED' | 'TASK_STATUS_CHANGED' | 'TASK_COMMENT_ADDED';
  data: {
    taskTitle?: string;
    assignedBy?: string;
    previousStatus?: string;
    newStatus?: string;
    commentAuthor?: string;
    commentPreview?: string;
  };
  isRead: boolean;
  createdAt: string;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  getNotifications: (page?: number, size?: number) => void;
}

const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:3333';

export const useNotifications = (enabled: boolean = true): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const getNotifications = useCallback((page = 1, size = 50) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('get_notifications', { page, size });
    }
  }, []);

  const authenticate = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('authenticate');
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      console.warn('No access token found, cannot connect to notifications WebSocket');
      return;
    }

    const socket = io(`${WEBSOCKET_URL}/notifications`, {
      extraHeaders: {
        Authorization: `Bearer ${token}`,
      },
      auth: {
        token: token,
      },
      query: {
        token: token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      reconnectTimeoutRef.current = window.setTimeout(() => {
        authenticate();
      }, 100);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('authenticated', (data) => {
      let authData = data;
      
      if (Array.isArray(data)) {
        authData = data[0] || {};
      }
      
      const authNotifications = authData.data?.notifications || authData.notifications || [];
      const authUnreadCount = authData.data?.unreadCount || authData.unreadCount || 0;
   
      setNotifications(authNotifications);
      setUnreadCount(authUnreadCount);
    });

    socket.on('notification', (notification: Notification) => {
      setNotifications((prev) => {
        if (prev.some(n => n.id === notification.id)) {
          return prev;
        }

        const updated = [notification, ...prev];
        return updated;
      });
      
      if (!notification.isRead) {
        setUnreadCount((prev) => {
          const newCount = prev + 1;
          return newCount;
        });
      }
    });

    socket.on('notifications_list', (data) => { 
      const listNotifications = data.data?.notifications || []; 
      setNotifications(listNotifications);
    });

    socket.on('notification_read', () => {
    });

    socket.on('all_notifications_read', () => {
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message);
      setIsConnected(false);
    });

    socket.on('exception', (error) => {
      console.error('WebSocket exception:', error);
      console.error('Exception details:', JSON.stringify(error, null, 2));
    });

    return () => {
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, authenticate]);

  const markAsRead = useCallback((notificationId: string) => {
    if (socketRef.current?.connected) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      
      setUnreadCount((prev) => Math.max(0, prev - 1));
      
      socketRef.current.emit('mark_as_read', { notificationId });
    }
  }, []);

  const markAllAsRead = useCallback(() => {
    if (socketRef.current?.connected) {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
      
      setUnreadCount(0);
      
      socketRef.current.emit('mark_all_as_read');
    }
  }, []);

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    getNotifications,
  };
};