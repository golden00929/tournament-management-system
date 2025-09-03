import React, { useState, useEffect } from 'react';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Paper,
  Divider,
  Chip
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Dashboard as DashboardIcon,
  EmojiEvents as TournamentIcon,
  Person as ProfileIcon,
  Assignment as ApplicationIcon,
  Leaderboard as RankingIcon,
  SportsHandball as MatchIcon,
  Logout as LogoutIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store/store';
import { logout } from '../../../store/slices/authSlice';

interface PlayerLayoutProps {
  children: React.ReactNode;
}

const DRAWER_WIDTH = 280;

const PlayerLayout: React.FC<PlayerLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  const user = useSelector((state: RootState) => state.auth.user);
  const playerData = useSelector((state: RootState) => state.players.selectedPlayer);

  useEffect(() => {
    setDrawerOpen(!isMobile);
  }, [isMobile]);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    handleProfileMenuClose();
    navigate('/player/login');
  };

  const menuItems = [
    { text: '대시보드', icon: <DashboardIcon />, path: '/player/dashboard', color: '#2E7D32' },
    { text: '토너먼트', icon: <TournamentIcon />, path: '/player/tournaments', color: '#FF6B35' },
    { text: '참가 신청', icon: <ApplicationIcon />, path: '/player/applications', color: '#1976D2' },
    { text: '랭킹', icon: <RankingIcon />, path: '/player/rankings', color: '#8E24AA' },
    { text: '경기 기록', icon: <MatchIcon />, path: '/player/matches', color: '#D32F2F' },
    { text: '프로필', icon: <ProfileIcon />, path: '/player/profile', color: '#388E3C' },
  ];

  const getEloRatingColor = (rating: number) => {
    if (rating >= 1800) return '#FF6B35'; // 미라셀 오렌지
    if (rating >= 1600) return '#8E24AA'; // 퍼플
    if (rating >= 1400) return '#1976D2'; // 블루
    if (rating >= 1200) return '#388E3C'; // 그린
    return '#757575'; // 그레이
  };

  const getSkillLevelDisplay = (skillLevel: string) => {
    const levels: { [key: string]: { label: string; color: string } } = {
      'a_class': { label: 'A급', color: '#FF6B35' },
      'b_class': { label: 'B급', color: '#8E24AA' },
      'c_class': { label: 'C급', color: '#1976D2' },
      'd_class': { label: 'D급', color: '#388E3C' }
    };
    return levels[skillLevel] || { label: '미정', color: '#757575' };
  };

  const drawerContent = (
    <Box sx={{ height: '100%', bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* 헤더 */}
      <Box sx={{ 
        p: 3, 
        background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
        color: 'white',
        textAlign: 'center'
      }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
          🏸 MIIRACER
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          Badminton Tournament
        </Typography>
      </Box>

      {/* 선수 정보 카드 */}
      <Box sx={{ p: 2 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 2, 
            textAlign: 'center',
            background: 'rgba(255,255,255,0.95)',
            borderRadius: 3
          }}
        >
          <Avatar 
            sx={{ 
              width: 60, 
              height: 60, 
              mx: 'auto', 
              mb: 1,
              background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
              fontSize: '24px',
              fontWeight: 'bold'
            }}
          >
            {user?.name?.charAt(0) || 'P'}
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333' }}>
            {user?.name || '선수'}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {user?.email}
          </Typography>
          
          {playerData && (
            <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Chip 
                label={`${playerData.eloRating || 1200} ELO`}
                size="small"
                sx={{ 
                  bgcolor: getEloRatingColor(playerData.eloRating || 1200),
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
              <Chip 
                label={getSkillLevelDisplay(playerData.skillLevel || 'd_class').label}
                size="small"
                sx={{ 
                  bgcolor: getSkillLevelDisplay(playerData.skillLevel || 'd_class').color,
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
            </Box>
          )}
        </Paper>
      </Box>

      <Divider sx={{ mx: 2, bgcolor: 'rgba(255,255,255,0.2)' }} />

      {/* 메뉴 항목들 */}
      <List sx={{ px: 1, pt: 2 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem
              key={item.text}
              onClick={() => navigate(item.path)}
              sx={{
                mb: 1,
                borderRadius: 2,
                cursor: 'pointer',
                bgcolor: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)',
                  transform: 'translateX(4px)',
                  transition: 'all 0.2s ease'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <ListItemIcon sx={{ 
                color: isActive ? '#FF6B35' : 'rgba(255,255,255,0.8)',
                minWidth: 40
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                sx={{ 
                  '& .MuiTypography-root': {
                    color: isActive ? 'white' : 'rgba(255,255,255,0.9)',
                    fontWeight: isActive ? 'bold' : 'normal'
                  }
                }}
              />
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      {/* 상단 앱바 */}
      <AppBar 
        position="fixed" 
        sx={{ 
          width: { md: `calc(100% - ${drawerOpen ? DRAWER_WIDTH : 0}px)` },
          ml: { md: `${drawerOpen ? DRAWER_WIDTH : 0}px` },
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            MIIRACER 선수 포털
          </Typography>

          <IconButton
            onClick={handleProfileMenuOpen}
            sx={{ ml: 2 }}
          >
            <Avatar sx={{ 
              width: 32, 
              height: 32,
              bgcolor: '#FF6B35',
              fontSize: '14px'
            }}>
              {user?.name?.charAt(0) || 'P'}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            PaperProps={{
              sx: { mt: 1, minWidth: 180 }
            }}
          >
            <MenuItem onClick={() => { navigate('/player/profile'); handleProfileMenuClose(); }}>
              <ListItemIcon>
                <ProfileIcon fontSize="small" />
              </ListItemIcon>
              프로필
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              로그아웃
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* 사이드 드로어 */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
            borderRight: 'none',
            boxShadow: '4px 0 20px rgba(0,0,0,0.1)'
          },
        }}
      >
        {isMobile && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
            <IconButton onClick={handleDrawerToggle} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        )}
        {drawerContent}
      </Drawer>

      {/* 메인 콘텐츠 영역 */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          pt: 11,
          width: { md: `calc(100% - ${drawerOpen ? DRAWER_WIDTH : 0}px)` },
          transition: 'width 0.3s ease',
          minHeight: '100vh'
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default PlayerLayout;