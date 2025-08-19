import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  LinearProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  SportsHandball as SportsIcon,
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  ExitToApp as LogoutIcon,
  Person as PersonIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import LanguageSelector from '../../components/LanguageSelector/LanguageSelector';
import { useDispatch } from 'react-redux';
import {
  useGetPlayerProfileQuery,
  useGetPlayerApplicationsQuery,
  useGetAvailableTournamentsQuery,
  useGetPlayerMatchesQuery,
} from '../../store/api/playerApiSlice';
import { logout } from '../../store/slices/authSlice';
import { getValidUser, getValidToken } from '../../utils/localStorage';

const PlayerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  // 로그인 확인 - 한 번만 실행
  useEffect(() => {
    const token = getValidToken();
    const user = getValidUser();
    
    if (!token || !user || user.role !== 'player') {
      console.log('Authentication failed, redirecting to login');
      navigate('/player/login', { replace: true });
      return;
    }
  }, []); // 의존성 배열을 빈 배열로 변경하여 한 번만 실행

  // 사용자 인증 상태 확인
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = getValidToken();
    const user = getValidUser();
    setIsAuthenticated(!!(token && user && user.role === 'player'));
  }, []);

  // 인증된 사용자에게만 API 호출
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
  } = useGetPlayerProfileQuery(undefined, { skip: !isAuthenticated });

  const {
    data: applicationsData,
    isLoading: applicationsLoading,
  } = useGetPlayerApplicationsQuery({ limit: 5 }, { skip: !isAuthenticated });

  const {
    data: availableTournamentsData,
    isLoading: tournamentsLoading,
  } = useGetAvailableTournamentsQuery(undefined, { skip: !isAuthenticated });

  const {
    data: matchesData,
    isLoading: matchesLoading,
  } = useGetPlayerMatchesQuery({ status: 'scheduled' }, { skip: !isAuthenticated });

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/player/login');
  };

  const getSkillLevelDisplay = (skillLevel: string) => {
    const levels = {
      'a_class': { label: t('tournament.skillLevel.expert'), color: 'error' as const },
      'b_class': { label: t('tournament.skillLevel.advanced'), color: 'warning' as const },
      'c_class': { label: t('tournament.skillLevel.intermediate'), color: 'primary' as const },
      'd_class': { label: t('tournament.skillLevel.beginner'), color: 'success' as const },
    };
    return levels[skillLevel as keyof typeof levels] || { label: skillLevel, color: 'default' as const };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return t('player.applications.approved');
      case 'pending': return t('player.applications.pending');
      case 'rejected': return t('player.applications.rejected');
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (profileLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (profileError) {
    // 401 에러인 경우 apiSlice에서 자동으로 리다이렉트 처리됨
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          {t('common.errorLoadingProfile', { defaultValue: 'Failed to load profile information. Please login again.' })}
        </Alert>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button 
            variant="contained" 
            onClick={() => navigate('/player/login', { replace: true })}
          >
            {t('navigation.backToLogin', { defaultValue: 'Back to Login' })}
          </Button>
        </Box>
      </Container>
    );
  }

  const profile = profileData?.data;
  const applications = applicationsData?.data?.applications || [];
  const availableTournaments = availableTournamentsData?.data?.tournaments || [];
  const upcomingMatches = matchesData?.data || [];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 헤더 */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SportsIcon fontSize="large" color="primary" />
          {t('player.dashboard.title')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <LanguageSelector />
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
          >
            {t('navigation.logout')}
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* 프로필 카드 */}
        <Box sx={{ flex: { md: '0 0 33.333%' } }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '2rem',
                }}
              >
                {profile?.name?.charAt(0)}
              </Avatar>
              
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {profile?.name}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {profile?.email}
              </Typography>

              <Chip
                label={getSkillLevelDisplay(profile?.skillLevel || '').label}
                color={getSkillLevelDisplay(profile?.skillLevel || '').color}
                sx={{ mb: 2 }}
              />

              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" color="primary" fontWeight="bold">
                  {t('player.profile.eloRating')}
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {profile?.eloRating}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {profile?.totalMatches}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('player.profile.totalMatches')}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    {profile?.wins}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('player.profile.wins')}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight="bold" color="error.main">
                    {profile?.losses}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('player.profile.losses')}
                  </Typography>
                </Box>
              </Box>

              {profile?.totalMatches && profile.totalMatches > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('player.profile.winRate')}: {((profile.wins / profile.totalMatches) * 100).toFixed(1)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(profile.wins / profile.totalMatches) * 100}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              )}

              <Button
                fullWidth
                variant="outlined"
                startIcon={<PersonIcon />}
                sx={{ mt: 3 }}
                onClick={() => navigate('/player/profile')}
              >
                {t('common.editProfile', { defaultValue: 'Edit Profile' })}
              </Button>
            </CardContent>
          </Card>
        </Box>

        {/* 우측 콘텐츠 */}
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* 내 참가 신청 */}
            <Box>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrophyIcon color="primary" />
                    {t('player.applications.title')}
                  </Typography>
                  
                  {applicationsLoading ? (
                    <CircularProgress />
                  ) : applications.length === 0 ? (
                    <Alert severity="info">
                      {t('player.applications.noApplications')}
                    </Alert>
                  ) : (
                    <List>
                      {applications.slice(0, 3).map((application, index) => (
                        <React.Fragment key={application.id}>
                          {index > 0 && <Divider />}
                          <ListItem>
                            <ListItemIcon>
                              <TrophyIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="subtitle1" fontWeight="bold">
                                    {application.tournament.name}
                                  </Typography>
                                  <Chip
                                    size="small"
                                    label={getStatusText(application.approvalStatus)}
                                    color={getStatusColor(application.approvalStatus)}
                                  />
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="text.secondary">
                                    📍 {application.tournament.location}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    📅 {formatDate(application.tournament.startDate)}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    💰 {formatCurrency(application.tournament.participantFee)}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                        </React.Fragment>
                      ))}
                    </List>
                  )}

                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => navigate('/player/applications')}
                    >
                      {t('player.applications.viewAll', { defaultValue: 'View All Applications' })}
                    </Button>
                    {applications.some(app => app.approvalStatus === 'approved') && (
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={() => navigate('/player/matches')}
                      >
                        {t('player.matches.title')}
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {/* 다가오는 경기 일정 */}
            <Box>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon color="primary" />
                    {t('player.dashboard.upcomingMatches')}
                  </Typography>
                  
                  {matchesLoading ? (
                    <CircularProgress />
                  ) : upcomingMatches.length === 0 ? (
                    <Alert severity="info">
                      {t('player.dashboard.noUpcomingMatches')}
                    </Alert>
                  ) : (
                    <List>
                      {upcomingMatches.slice(0, 3).map((match, index) => (
                        <React.Fragment key={match.id}>
                          {index > 0 && <Divider />}
                          <ListItem>
                            <ListItemIcon>
                              <TrophyIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography variant="subtitle1" fontWeight="bold">
                                  {match.tournament.name} - {match.roundName}
                                </Typography>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="text.secondary">
                                    🏁 {match.player1Name} vs {match.player2Name}
                                  </Typography>
                                  {match.courtNumber && (
                                    <Typography variant="body2" color="text.secondary">
                                      🏟️ {t('player.matches.court')} {match.courtNumber}
                                    </Typography>
                                  )}
                                  {match.scheduledTime && (
                                    <Typography variant="body2" color="text.secondary">
                                      🕐 {new Date(match.scheduledTime).toLocaleString('ko-KR')}
                                    </Typography>
                                  )}
                                  <Typography variant="body2" color="text.secondary">
                                    📍 {match.tournament.location}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                        </React.Fragment>
                      ))}
                    </List>
                  )}

                  <Button
                    fullWidth
                    variant="contained"
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/player/matches')}
                  >
                    {t('player.dashboard.viewAllMatches')}
                  </Button>
                </CardContent>
              </Card>
            </Box>

            {/* 참가 가능한 대회 */}
            <Box>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SearchIcon color="primary" />
                    {t('player.tournaments.title')}
                  </Typography>
                  
                  {tournamentsLoading ? (
                    <CircularProgress />
                  ) : availableTournaments.length === 0 ? (
                    <Alert severity="info">
                      {t('player.tournaments.noTournaments')}
                    </Alert>
                  ) : (
                    <List>
                      {availableTournaments.slice(0, 3).map((tournament, index) => (
                        <React.Fragment key={tournament.id}>
                          {index > 0 && <Divider />}
                          <ListItem>
                            <ListItemIcon>
                              <CalendarIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography variant="subtitle1" fontWeight="bold">
                                  {tournament.name}
                                </Typography>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="text.secondary">
                                    📍 {tournament.location}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    📅 {formatDate(tournament.startDate)}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    👥 {tournament.currentParticipants}/{tournament.maxParticipants} {t('player.tournaments.participants')}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    💰 {formatCurrency(tournament.participantFee)}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                        </React.Fragment>
                      ))}
                    </List>
                  )}

                  <Button
                    fullWidth
                    variant="contained"
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/player/tournaments')}
                  >
                    {t('player.tournaments.browse', { defaultValue: 'Browse Tournaments' })}
                  </Button>
                </CardContent>
              </Card>
            </Box>

            {/* 퀵 액션 */}
            <Box>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {t('common.quickActions', { defaultValue: 'Quick Actions' })}
                </Typography>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, 
                  gap: 2 
                }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<SearchIcon />}
                    onClick={() => navigate('/player/tournaments')}
                  >
                    {t('common.search')} {t('navigation.tournaments')}
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<TrophyIcon />}
                    onClick={() => navigate('/player/applications')}
                  >
                    {t('navigation.applications')}
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<TrendingUpIcon />}
                    onClick={() => navigate('/player/rankings')}
                  >
                    {t('navigation.rankings')}
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<PersonIcon />}
                    onClick={() => navigate('/player/profile')}
                  >
                    {t('navigation.profile')}
                  </Button>
                </Box>
              </Paper>
            </Box>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default PlayerDashboard;