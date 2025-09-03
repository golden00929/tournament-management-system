import { useState, useCallback } from 'react';
import { Notification } from '../components/Notifications/NotificationSystem';

interface UseNotificationsReturn {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
  showSuccessNotification: (message: string, title?: string, options?: Partial<Notification>) => void;
  showErrorNotification: (message: string, title?: string, options?: Partial<Notification>) => void;
  showWarningNotification: (message: string, title?: string, options?: Partial<Notification>) => void;
  showInfoNotification: (message: string, title?: string, options?: Partial<Notification>) => void;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const generateId = () => {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: generateId(),
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Auto-remove notification after specified duration for persistent notifications
    if (notification.autoHide !== false) {
      const duration = notification.duration || 6000;
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, duration + 1000); // Add 1 second buffer for snackbar animation
    }
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods for different notification types
  const showSuccessNotification = useCallback((
    message: string, 
    title?: string, 
    options?: Partial<Notification>
  ) => {
    addNotification({
      type: 'success',
      message,
      title,
      autoHide: true,
      duration: 4000,
      ...options,
    });
  }, [addNotification]);

  const showErrorNotification = useCallback((
    message: string, 
    title?: string, 
    options?: Partial<Notification>
  ) => {
    addNotification({
      type: 'error',
      message,
      title,
      autoHide: false, // Errors should be persistent by default
      ...options,
    });
  }, [addNotification]);

  const showWarningNotification = useCallback((
    message: string, 
    title?: string, 
    options?: Partial<Notification>
  ) => {
    addNotification({
      type: 'warning',
      message,
      title,
      autoHide: true,
      duration: 6000,
      ...options,
    });
  }, [addNotification]);

  const showInfoNotification = useCallback((
    message: string, 
    title?: string, 
    options?: Partial<Notification>
  ) => {
    addNotification({
      type: 'info',
      message,
      title,
      autoHide: true,
      duration: 5000,
      ...options,
    });
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    markAsRead,
    dismissNotification,
    clearAllNotifications,
    showSuccessNotification,
    showErrorNotification,
    showWarningNotification,
    showInfoNotification,
  };
};