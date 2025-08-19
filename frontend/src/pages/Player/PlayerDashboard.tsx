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
  CircularProgress,
  IconButton,
  Stack,
  useTheme,
  alpha,
} from '@mui/material';
import {
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
import useTokenRefresh from '../../hooks/useTokenRefresh';

const PlayerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  useTheme(); // Hook을 최상단으로 이동
  
  // 토큰 자동 갱신 기능 활성화
  useTokenRefresh();

  // 로그인 확인 - 한 번만 실행
  useEffect(() => {
    const token = getValidToken();
    const user = getValidUser();
    
    if (!token || !user || user.role !== 'player') {
      console.log('Authentication failed, redirecting to login');
      navigate('/player/login', { replace: true });
      return;
    }
  }, [navigate]); // navigate 의존성 추가

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
    localStorage.removeItem('refreshToken');
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

  // 다크 그레이 테마 색상 정의
  const darkTheme = {
    background: {
      primary: '#121212',
      secondary: '#1e1e1e',
      tertiary: '#2d2d2d',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
      accent: '#e0e0e0',
    },
    accent: {
      primary: '#bb86fc',
      secondary: '#03dac6',
      gold: '#ffd700',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
    },
    card: {
      elevated: '#252525',
      hover: '#2a2a2a',
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${darkTheme.background.primary} 0%, ${darkTheme.background.secondary} 100%)`,
      color: darkTheme.text.primary,
      pb: { xs: 10, sm: 4 }
    }}>
      {/* 모바일 헤더 */}
      <Box sx={{ 
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: alpha(darkTheme.background.secondary, 0.95),
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${alpha(darkTheme.text.secondary, 0.1)}`,
        px: 2,
        py: 1.5
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar sx={{ 
              bgcolor: darkTheme.accent.primary,
              width: 32,
              height: 32,
              fontSize: '1rem'
            }}>
              {profile?.name?.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight="600" color={darkTheme.text.primary}>
                {profile?.name}
              </Typography>
              <Typography variant="caption" color={darkTheme.text.secondary}>
                ELO: {profile?.eloRating}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            <LanguageSelector />
            <IconButton 
              onClick={handleLogout}
              sx={{ 
                color: darkTheme.text.secondary,
                '&:hover': { 
                  bgcolor: alpha(darkTheme.text.secondary, 0.1),
                  color: darkTheme.text.primary
                }
              }}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>
      </Box>

      {/* 메인 콘텐츠 */}
      <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 }, pt: 2 }}>
        {/* 프로필 요약 카드 */}
        <Card sx={{ 
          background: `linear-gradient(135deg, ${darkTheme.card.elevated} 0%, ${darkTheme.background.tertiary} 100%)`,
          border: `1px solid ${alpha(darkTheme.text.secondary, 0.1)}`,
          borderRadius: 3,
          mb: 3,
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${darkTheme.accent.primary}, ${darkTheme.accent.secondary})`
          }
        }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={3} alignItems="center">
              <Avatar sx={{ 
                width: 60,
                height: 60,
                bgcolor: darkTheme.accent.primary,
                fontSize: '1.5rem',
                boxShadow: `0 0 20px ${alpha(darkTheme.accent.primary, 0.3)}`
              }}>
                {profile?.name?.charAt(0)}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight="bold" color={darkTheme.text.primary} gutterBottom>
                  {profile?.name}
                </Typography>
                <Chip
                  label={getSkillLevelDisplay(profile?.skillLevel || '').label}
                  size="small"
                  sx={{ 
                    bgcolor: alpha(darkTheme.accent.secondary, 0.2),
                    color: darkTheme.accent.secondary,
                    border: `1px solid ${alpha(darkTheme.accent.secondary, 0.3)}`,
                    mb: 1
                  }}
                />
                <Typography variant="body2" color={darkTheme.text.secondary}>
                  {profile?.email}
                </Typography>
              </Box>
            </Stack>
            
            {/* ELO 및 통계 */}
            <Box sx={{ mt: 3, p: 2, bgcolor: alpha(darkTheme.background.primary, 0.5), borderRadius: 2 }}>
              <Stack direction="row" spacing={2}>
                <Box sx={{ flex: 1, textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color={darkTheme.accent.gold}>
                    {profile?.eloRating}
                  </Typography>
                  <Typography variant="caption" color={darkTheme.text.secondary}>
                    ELO RATING
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color={darkTheme.text.secondary}>
                        {t('dashboard.matches')}
                      </Typography>
                      <Typography variant="body2" fontWeight="600" color={darkTheme.text.primary}>
                        {profile?.totalMatches || 0}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color={darkTheme.text.secondary}>
                        {t('dashboard.winRate')}
                      </Typography>
                      <Typography variant="body2" fontWeight="600" color={darkTheme.accent.success}>
                        {profile?.totalMatches && profile.totalMatches > 0 
                          ? `${((profile.wins / profile.totalMatches) * 100).toFixed(1)}%`
                          : '0%'}
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
              </Stack>
              
              {profile?.totalMatches > 0 && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={(profile.wins / profile.totalMatches) * 100}
                    sx={{ 
                      height: 6,
                      borderRadius: 3,
                      bgcolor: alpha(darkTheme.text.secondary, 0.2),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: darkTheme.accent.success,
                        borderRadius: 3
                      }
                    }}
                  />
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* 내 참가 신청 */}
        <Card sx={{ 
          background: darkTheme.card.elevated,
          border: `1px solid ${alpha(darkTheme.text.secondary, 0.1)}`,
          borderRadius: 3,
          mb: 3
        }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <TrophyIcon sx={{ color: darkTheme.accent.primary }} />
              <Typography variant="h6" fontWeight="bold" color={darkTheme.text.primary}>
                {t('player.applications.title')}
              </Typography>
            </Stack>
            
            {applicationsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress sx={{ color: darkTheme.accent.primary }} />
              </Box>
            ) : applications.length === 0 ? (
              <Box sx={{ 
                p: 3,
                textAlign: 'center',
                bgcolor: alpha(darkTheme.accent.warning, 0.1),
                borderRadius: 2,
                border: `1px solid ${alpha(darkTheme.accent.warning, 0.2)}`
              }}>
                <Typography variant="body2" color={darkTheme.text.secondary}>
                  {t('player.applications.noApplications')}
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {applications.slice(0, 2).map((application, index) => (
                  <Box 
                    key={application.id}
                    sx={{ 
                      p: 2,
                      bgcolor: alpha(darkTheme.background.primary, 0.3),
                      borderRadius: 2,
                      border: `1px solid ${alpha(darkTheme.text.secondary, 0.1)}`
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                      <Typography variant="subtitle2" fontWeight="600" color={darkTheme.text.primary} sx={{ flex: 1, mr: 1 }}>
                        {application.tournament.name}
                      </Typography>
                      <Chip
                        size="small"
                        label={getStatusText(application.approvalStatus)}
                        sx={{
                          bgcolor: alpha(
                            application.approvalStatus === 'approved' ? darkTheme.accent.success :
                            application.approvalStatus === 'pending' ? darkTheme.accent.warning :
                            darkTheme.accent.error, 0.2
                          ),
                          color: application.approvalStatus === 'approved' ? darkTheme.accent.success :
                                 application.approvalStatus === 'pending' ? darkTheme.accent.warning :
                                 darkTheme.accent.error,
                          border: `1px solid ${alpha(
                            application.approvalStatus === 'approved' ? darkTheme.accent.success :
                            application.approvalStatus === 'pending' ? darkTheme.accent.warning :
                            darkTheme.accent.error, 0.3
                          )}`,
                          fontSize: '0.7rem'
                        }}
                      />
                    </Stack>
                    <Stack spacing={0.5}>
                      <Typography variant="body2" color={darkTheme.text.secondary} sx={{ fontSize: '0.8rem' }}>
                        📍 {application.tournament.location}
                      </Typography>
                      <Typography variant="body2" color={darkTheme.text.secondary} sx={{ fontSize: '0.8rem' }}>
                        📅 {formatDate(application.tournament.startDate)}
                      </Typography>
                      <Typography variant="body2" color={darkTheme.accent.gold} sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                        💰 {formatCurrency(application.tournament.participantFee)}
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}

            <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate('/player/applications')}
                sx={{
                  borderColor: alpha(darkTheme.text.secondary, 0.3),
                  color: darkTheme.text.secondary,
                  '&:hover': {
                    borderColor: darkTheme.accent.primary,
                    color: darkTheme.accent.primary,
                    bgcolor: alpha(darkTheme.accent.primary, 0.1)
                  }
                }}
              >
{t('dashboard.viewAllApplications')}
              </Button>
              {applications.some(app => app.approvalStatus === 'approved') && (
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => navigate('/player/matches')}
                  sx={{
                    bgcolor: darkTheme.accent.primary,
                    '&:hover': {
                      bgcolor: alpha(darkTheme.accent.primary, 0.8)
                    }
                  }}
                >
{t('dashboard.myMatches')}
                </Button>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* 다가오는 경기 일정 */}
        <Card sx={{ 
          background: darkTheme.card.elevated,
          border: `1px solid ${alpha(darkTheme.text.secondary, 0.1)}`,
          borderRadius: 3,
          mb: 3
        }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <CalendarIcon sx={{ color: darkTheme.accent.secondary }} />
              <Typography variant="h6" fontWeight="bold" color={darkTheme.text.primary}>
{t('dashboard.upcomingMatches')}
              </Typography>
            </Stack>
            
            {matchesLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress sx={{ color: darkTheme.accent.secondary }} />
              </Box>
            ) : upcomingMatches.length === 0 ? (
              <Box sx={{ 
                p: 3,
                textAlign: 'center',
                bgcolor: alpha(darkTheme.accent.secondary, 0.1),
                borderRadius: 2,
                border: `1px solid ${alpha(darkTheme.accent.secondary, 0.2)}`
              }}>
                <Typography variant="body2" color={darkTheme.text.secondary}>
{t('dashboard.noUpcomingMatches')}
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {upcomingMatches.slice(0, 2).map((match, index) => (
                  <Box 
                    key={match.id}
                    sx={{ 
                      p: 2,
                      bgcolor: alpha(darkTheme.background.primary, 0.3),
                      borderRadius: 2,
                      border: `1px solid ${alpha(darkTheme.accent.secondary, 0.2)}`,
                      borderLeft: `3px solid ${darkTheme.accent.secondary}`
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight="600" color={darkTheme.text.primary} sx={{ mb: 1 }}>
                      {match.tournament.name} - {match.roundName}
                    </Typography>
                    <Typography variant="body2" color={darkTheme.accent.secondary} sx={{ mb: 1, fontWeight: 600 }}>
                      🏁 {match.player1Name} vs {match.player2Name}
                    </Typography>
                    <Stack spacing={0.5}>
                      {match.courtNumber && (
                        <Typography variant="body2" color={darkTheme.text.secondary} sx={{ fontSize: '0.8rem' }}>
                          🏟️ {t('player.matches.court')} {match.courtNumber}
                        </Typography>
                      )}
                      {match.scheduledTime && (
                        <Typography variant="body2" color={darkTheme.accent.gold} sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                          🕐 {new Date(match.scheduledTime).toLocaleString('ko-KR')}
                        </Typography>
                      )}
                      <Typography variant="body2" color={darkTheme.text.secondary} sx={{ fontSize: '0.8rem' }}>
                        📍 {match.tournament.location}
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}

            <Button
              fullWidth
              variant="contained"
              sx={{ 
                mt: 3,
                bgcolor: darkTheme.accent.secondary,
                '&:hover': {
                  bgcolor: alpha(darkTheme.accent.secondary, 0.8)
                }
              }}
              onClick={() => navigate('/player/matches')}
            >
{t('dashboard.viewAllMatches')}
            </Button>
          </CardContent>
        </Card>

        {/* 참가 가능한 대회 */}
        <Card sx={{ 
          background: darkTheme.card.elevated,
          border: `1px solid ${alpha(darkTheme.text.secondary, 0.1)}`,
          borderRadius: 3,
          mb: 3
        }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <SearchIcon sx={{ color: darkTheme.accent.gold }} />
              <Typography variant="h6" fontWeight="bold" color={darkTheme.text.primary}>
{t('dashboard.availableTournaments')}
              </Typography>
            </Stack>
            
            {tournamentsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress sx={{ color: darkTheme.accent.gold }} />
              </Box>
            ) : availableTournaments.length === 0 ? (
              <Box sx={{ 
                p: 3,
                textAlign: 'center',
                bgcolor: alpha(darkTheme.accent.gold, 0.1),
                borderRadius: 2,
                border: `1px solid ${alpha(darkTheme.accent.gold, 0.2)}`
              }}>
                <Typography variant="body2" color={darkTheme.text.secondary}>
{t('dashboard.noAvailableTournaments')}
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {availableTournaments.slice(0, 2).map((tournament, index) => (
                  <Box 
                    key={tournament.id}
                    sx={{ 
                      p: 2,
                      bgcolor: alpha(darkTheme.background.primary, 0.3),
                      borderRadius: 2,
                      border: `1px solid ${alpha(darkTheme.accent.gold, 0.2)}`,
                      borderLeft: `3px solid ${darkTheme.accent.gold}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        bgcolor: alpha(darkTheme.background.primary, 0.5),
                        transform: 'translateY(-1px)'
                      }
                    }}
                    onClick={() => navigate('/player/tournaments')}
                  >
                    <Typography variant="subtitle2" fontWeight="600" color={darkTheme.text.primary} sx={{ mb: 1 }}>
                      {tournament.name}
                    </Typography>
                    <Stack spacing={0.5}>
                      <Typography variant="body2" color={darkTheme.text.secondary} sx={{ fontSize: '0.8rem' }}>
                        📍 {tournament.location}
                      </Typography>
                      <Typography variant="body2" color={darkTheme.text.secondary} sx={{ fontSize: '0.8rem' }}>
                        📅 {formatDate(tournament.startDate)}
                      </Typography>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color={darkTheme.text.secondary} sx={{ fontSize: '0.8rem' }}>
                          👥 {tournament.currentParticipants}/{tournament.maxParticipants} 명
                        </Typography>
                        <Typography variant="body2" color={darkTheme.accent.gold} sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                          💰 {formatCurrency(tournament.participantFee)}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}

            <Button
              fullWidth
              variant="contained"
              sx={{ 
                mt: 3,
                bgcolor: darkTheme.accent.gold,
                color: darkTheme.background.primary,
                '&:hover': {
                  bgcolor: alpha(darkTheme.accent.gold, 0.8)
                }
              }}
              onClick={() => navigate('/player/tournaments')}
            >
{t('dashboard.browseTournaments')}
            </Button>
          </CardContent>
        </Card>

        {/* 퀵 액션 */}
        <Box sx={{ 
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: alpha(darkTheme.background.secondary, 0.95),
          backdropFilter: 'blur(10px)',
          borderTop: `1px solid ${alpha(darkTheme.text.secondary, 0.1)}`,
          p: 2,
          zIndex: 10,
          display: { xs: 'block', sm: 'none' }
        }}>
          <Stack direction="row" spacing={1}>
            <Button
              fullWidth
              variant="text"
              onClick={() => navigate('/player/tournaments')}
              sx={{ 
                flexDirection: 'column',
                py: 1,
                color: darkTheme.text.secondary,
                '&:hover': { color: darkTheme.accent.primary }
              }}
            >
              <SearchIcon fontSize="small" />
              <Typography variant="caption" sx={{ fontSize: '0.7rem', mt: 0.5 }}>
                {t('navigation.tournaments')}
              </Typography>
            </Button>
            <Button
              fullWidth
              variant="text"
              onClick={() => navigate('/player/applications')}
              sx={{ 
                flexDirection: 'column',
                py: 1,
                color: darkTheme.text.secondary,
                '&:hover': { color: darkTheme.accent.primary }
              }}
            >
              <TrophyIcon fontSize="small" />
              <Typography variant="caption" sx={{ fontSize: '0.7rem', mt: 0.5 }}>
                {t('navigation.applications')}
              </Typography>
            </Button>
            <Button
              fullWidth
              variant="text"
              onClick={() => navigate('/player/rankings')}
              sx={{ 
                flexDirection: 'column',
                py: 1,
                color: darkTheme.text.secondary,
                '&:hover': { color: darkTheme.accent.primary }
              }}
            >
              <TrendingUpIcon fontSize="small" />
              <Typography variant="caption" sx={{ fontSize: '0.7rem', mt: 0.5 }}>
                {t('navigation.rankings')}
              </Typography>
            </Button>
            <Button
              fullWidth
              variant="text"
              onClick={() => navigate('/player/profile')}
              sx={{ 
                flexDirection: 'column',
                py: 1,
                color: darkTheme.text.secondary,
                '&:hover': { color: darkTheme.accent.primary }
              }}
            >
              <PersonIcon fontSize="small" />
              <Typography variant="caption" sx={{ fontSize: '0.7rem', mt: 0.5 }}>
                {t('navigation.profile')}
              </Typography>
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default PlayerDashboard;