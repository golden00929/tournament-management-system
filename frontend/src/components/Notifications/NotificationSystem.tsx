import React, { useState, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Slide,
  Box,
  IconButton,
  Badge,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Divider,
  Button,
} from '@mui/material';
import {
  Notifications as NotificationIcon,
  Close,
  Info,
  CheckCircle,
  Warning,
  Error,
  EmojiEvents,
  Person,
  Schedule,
} from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';
import { SlideProps } from '@mui/material/Slide';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  timestamp: Date;
  read: boolean;
  category?: 'tournament' | 'player' | 'match' | 'system';
  autoHide?: boolean;
  duration?: number;
}

interface NotificationSystemProps {
  notifications: Notification[];
  onNotificationRead: (id: string) => void;
  onNotificationDismiss: (id: string) => void;
  onClearAll: () => void;
}

const SlideTransition = (props: any) => {
  return <Slide direction="left" {...props} />;
};

const getNotificationIcon = (type: string, category?: string) => {
  if (category) {
    switch (category) {
      case 'tournament':
        return <EmojiEvents />;
      case 'player':
        return <Person />;
      case 'match':
        return <Schedule />;
      default:
        break;
    }
  }

  switch (type) {
    case 'success':
      return <CheckCircle />;
    case 'error':
      return <Error />;
    case 'warning':
      return <Warning />;
    case 'info':
    default:
      return <Info />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'success':
      return 'success';
    case 'error':
      return 'error';
    case 'warning':
      return 'warning';
    case 'info':
    default:
      return 'info';
  }
};

const NotificationSystem: React.FC<NotificationSystemProps> = ({
  notifications,
  onNotificationRead,
  onNotificationDismiss,
  onClearAll,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [activeSnackbar, setActiveSnackbar] = useState<Notification | null>(null);

  // Handle auto-hide notifications in snackbar
  const autoHideNotifications = notifications.filter(n => n.autoHide !== false);
  const persistentNotifications = notifications.filter(n => n.autoHide === false);

  useEffect(() => {
    // Show the latest auto-hide notification in snackbar
    const latestAutoHide = autoHideNotifications
      .filter(n => !n.read)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
    
    if (latestAutoHide && latestAutoHide.id !== activeSnackbar?.id) {
      setActiveSnackbar(latestAutoHide);
    }
  }, [autoHideNotifications, activeSnackbar?.id]);

  const handleNotificationCenterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationCenterClose = () => {
    setAnchorEl(null);
  };

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    if (activeSnackbar) {
      onNotificationRead(activeSnackbar.id);
      setActiveSnackbar(null);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      onNotificationRead(notification.id);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const popoverOpen = Boolean(anchorEl);

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return `${days}일 전`;
  };

  return (
    <>
      {/* Notification Center Button */}
      <IconButton
        color="inherit"
        onClick={handleNotificationCenterClick}
        sx={{ mr: 1 }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationIcon />
        </Badge>
      </IconButton>

      {/* Notification Center Popover */}
      <Popover
        open={popoverOpen}
        anchorEl={anchorEl}
        onClose={handleNotificationCenterClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { width: 400, maxHeight: 500 }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h6">
              알림
            </Typography>
            {notifications.length > 0 && (
              <Button size="small" onClick={onClearAll}>
                전체 삭제
              </Button>
            )}
          </Box>
          
          {unreadCount > 0 && (
            <Typography variant="caption" color="textSecondary">
              읽지 않은 알림 {unreadCount}개
            </Typography>
          )}
        </Box>

        <Divider />

        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <NotificationIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="textSecondary">
              새로운 알림이 없습니다
            </Typography>
          </Box>
        ) : (
          <List sx={{ maxHeight: 350, overflow: 'auto' }}>
            {notifications
              .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
              .map((notification) => (
                <ListItem
                  key={notification.id}
                  component="div"
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    cursor: 'pointer',
                    bgcolor: notification.read ? 'transparent' : 'action.hover',
                    borderLeft: notification.read ? 'none' : `4px solid ${
                      notification.type === 'success' ? 'success.main' :
                      notification.type === 'error' ? 'error.main' :
                      notification.type === 'warning' ? 'warning.main' : 'info.main'
                    }`,
                  }}
                >
                  <ListItemIcon>
                    {getNotificationIcon(notification.type, notification.category)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: notification.read ? 'normal' : 'bold',
                            color: notification.read ? 'text.secondary' : 'text.primary'
                          }}
                        >
                          {notification.title || '알림'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {formatTimestamp(notification.timestamp)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography
                        variant="body2"
                        sx={{
                          color: notification.read ? 'text.secondary' : 'text.primary',
                          mt: 0.5
                        }}
                      >
                        {notification.message}
                      </Typography>
                    }
                  />
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNotificationDismiss(notification.id);
                    }}
                    sx={{ ml: 1 }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </ListItem>
              ))}
          </List>
        )}
      </Popover>

      {/* Snackbar for Auto-hide Notifications */}
      {activeSnackbar && (
        <Snackbar
          open={true}
          autoHideDuration={activeSnackbar.duration || 6000}
          onClose={handleSnackbarClose}
          TransitionComponent={SlideTransition}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ mt: 8 }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={getNotificationColor(activeSnackbar.type) as any}
            variant="filled"
            sx={{ minWidth: 300 }}
          >
            {activeSnackbar.title && (
              <AlertTitle>{activeSnackbar.title}</AlertTitle>
            )}
            {activeSnackbar.message}
          </Alert>
        </Snackbar>
      )}
    </>
  );
};

export default NotificationSystem;