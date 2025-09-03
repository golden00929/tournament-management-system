import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import miiracerLogo from '../../assets/miiracer-logo.jpg';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  EmojiEvents as TournamentIcon,
  People as PlayersIcon,
  SportsTennis as MatchIcon,
  Cable as WebSocketIcon,
  ExitToApp as LogoutIcon,
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import NotificationSystem from '../Notifications/NotificationSystem';
import { useNotifications } from '../../hooks/useNotifications';

const drawerWidth = 240;

interface MenuItem {
  text: string;
  icon: React.ReactElement;
  path: string;
}

const menuItems: MenuItem[] = [
  { text: '대시보드', icon: <DashboardIcon />, path: '/dashboard' },
  { text: '대회 관리', icon: <TournamentIcon />, path: '/tournaments' },
  { text: '선수 관리', icon: <PlayersIcon />, path: '/players' },
  { text: '경기 관리', icon: <MatchIcon />, path: '/matches' },
  { text: 'WebSocket 테스트', icon: <WebSocketIcon />, path: '/websocket-test' },
];

const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    notifications,
    markAsRead,
    dismissNotification,
    clearAllNotifications,
    showSuccessNotification,
    showErrorNotification,
    showInfoNotification,
  } = useNotifications();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Demo notifications - Add some example notifications on component mount
  React.useEffect(() => {
    // Only add demo notifications once
    const hasAddedDemo = localStorage.getItem('demo_notifications_added');
    if (!hasAddedDemo) {
      setTimeout(() => {
        showInfoNotification(
          '새로운 토너먼트 마법사가 추가되었습니다!', 
          '시스템 업데이트',
          { category: 'system', autoHide: false }
        );
      }, 1000);

      setTimeout(() => {
        showSuccessNotification(
          'CSV 가져오기 기능이 성공적으로 구현되었습니다.',
          '기능 추가',
          { category: 'system' }
        );
      }, 2000);

      localStorage.setItem('demo_notifications_added', 'true');
    }
  }, [showInfoNotification, showSuccessNotification]);

  const drawer = (
    <div>
      <Toolbar sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2 }}>
        <Box
          component="img"
          src={miiracerLogo}
          alt="Miiracer Logo"
          sx={{
            height: 40,
            width: 'auto',
            objectFit: 'contain',
          }}
        />
      </Toolbar>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton onClick={() => handleNavigation(item.path)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ position: 'absolute', bottom: 0, width: '100%' }}>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="로그아웃" />
          </ListItemButton>
        </ListItem>
      </Box>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              component="img"
              src={miiracerLogo}
              alt="Miiracer Logo"
              sx={{
                height: 32,
                width: 'auto',
                objectFit: 'contain',
                display: { xs: 'block', sm: 'none' },
              }}
            />
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
              Miiracer 대회 관리 시스템
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <NotificationSystem
            notifications={notifications}
            onNotificationRead={markAsRead}
            onNotificationDismiss={dismissNotification}
            onClearAll={clearAllNotifications}
          />
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;