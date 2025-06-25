import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Task, taskApi } from '@/utils/api';
import { useAuth } from '@/context/auth';
import { notificationApi, Notification } from '@/utils/api';

interface TaskStats {
  pending: number;
  completed: number;
  total: number;
}

interface TaskContextType {
  myTaskStats: TaskStats;
  myTasks: Task[];
  loading: boolean;
  refreshMyTasks: () => Promise<void>;
  refreshTaskStats: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};

interface TaskProviderProps {
  children: React.ReactNode;
}

export const TaskProvider: React.FC<TaskProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [myTaskStats, setMyTaskStats] = useState<TaskStats>({
    pending: 0,
    completed: 0,
    total: 0,
  });
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Helper to normalize status
  const normalize = (status: string) => status.toLowerCase().replace(/\s/g, '');

  useEffect(() => {
    if (!initialized && user) {
      refreshMyTasks();
      setInitialized(true);
    }
  }, [initialized, user]);

  const refreshMyTasks = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const response = await taskApi.getMyTasks();
      if (response.status === 'true' && response.taskdata) {
        setMyTasks(response.taskdata);
        const pending = response.taskdata.filter((task: Task) => normalize(task.status) === 'pending').length;
        const completed = response.taskdata.filter((task: Task) => normalize(task.status) === 'completed').length;
        const total = response.taskdata.length;
        setMyTaskStats({ pending, completed, total });
      }
    } catch (error) {
      console.error('Error refreshing my tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const value: TaskContextType = {
    myTaskStats,
    myTasks,
    loading,
    refreshMyTasks,
    refreshTaskStats: refreshMyTasks, // Alias for refreshMyTasks
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

// Notification context for unread count
interface NotificationContextType {
  unreadCount: number;
  refreshUnread: () => Promise<void>;
}
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotificationContext must be used within a NotificationProvider');
  return context;
};
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const refreshUnread = useCallback(async () => {
    try {
      const res = await notificationApi.getUnreadNotifications();
      setUnreadCount(res.notifications.length);
    } catch {
      setUnreadCount(0);
    }
  }, []);
  useEffect(() => { refreshUnread(); }, [refreshUnread]);
  return <NotificationContext.Provider value={{ unreadCount, refreshUnread }}>{children}</NotificationContext.Provider>;
}; 