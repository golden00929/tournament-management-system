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
  Chip,
  Alert,
  CircularProgress,
  Stack,
  Paper,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  SportsHandball as MatchIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import PlayerLayout from '../../components/Player/Layout/PlayerLayout';
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

  return (
    <PlayerLayout>
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
          🏸 대시보드
        </Typography>

        {/* 통계 카드들 */}
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={3} 
          sx={{ mb: 4, flexWrap: 'wrap' }}
        >
          <Box sx={{ flex: '1 1 300px' }}>
            <Paper 
              elevation={3}
              sx={{ 
                p: 3, 
                textAlign: 'center',
                background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
                color: 'white',
                borderRadius: 3
              }}
            >
              <TrophyIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {profile?.eloRating || 1200}
              </Typography>
              <Typography variant="body2">ELO 레이팅</Typography>
            </Paper>
          </Box>

          <Box sx={{ flex: '1 1 300px' }}>
            <Paper 
              elevation={3}
              sx={{ 
                p: 3, 
                textAlign: 'center',
                background: 'linear-gradient(135deg, #8E24AA 0%, #7B1FA2 100%)',
                color: 'white',
                borderRadius: 3
              }}
            >
              <MatchIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {profile?.totalMatches || 0}
              </Typography>
              <Typography variant="body2">총 경기수</Typography>
            </Paper>
          </Box>

          <Box sx={{ flex: '1 1 300px' }}>
            <Paper 
              elevation={3}
              sx={{ 
                p: 3, 
                textAlign: 'center',
                background: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
                color: 'white',
                borderRadius: 3
              }}
            >
              <TrendingUpIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {profile?.totalMatches && profile.totalMatches > 0 
                  ? `${((profile.wins || 0) / profile.totalMatches * 100).toFixed(1)}%`
                  : '0%'}
              </Typography>
              <Typography variant="body2">승률</Typography>
            </Paper>
          </Box>

          <Box sx={{ flex: '1 1 300px' }}>
            <Paper 
              elevation={3}
              sx={{ 
                p: 3, 
                textAlign: 'center',
                background: 'linear-gradient(135deg, #388E3C 0%, #2E7D32 100%)',
                color: 'white',
                borderRadius: 3
              }}
            >
              <PersonIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {getSkillLevelDisplay(profile?.skillLevel || 'd_class').label}
              </Typography>
              <Typography variant="body2">실력 등급</Typography>
            </Paper>
          </Box>
        </Stack>

        {/* 메인 콘텐츠 */}
        <Stack 
          direction={{ xs: 'column', md: 'row' }} 
          spacing={3} 
          sx={{ flexWrap: 'wrap' }}
        >
          {/* 내 참가 신청 */}
          <Box sx={{ flex: '1 1 400px' }}>
            <Card sx={{ height: '100%', borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <TrophyIcon sx={{ color: '#FF6B35' }} />
                  <Typography variant="h6" fontWeight="bold">
                    내 참가 신청
                  </Typography>
                </Stack>
                
                {applicationsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : applications.length === 0 ? (
                  <Box sx={{ 
                    p: 3,
                    textAlign: 'center',
                    bgcolor: 'rgba(255, 107, 53, 0.1)',
                    borderRadius: 2
                  }}>
                    <Typography variant="body2" color="text.secondary">
                      참가 신청한 대회가 없습니다.
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {applications.slice(0, 3).map((application) => (
                      <Box 
                        key={application.id}
                        sx={{ 
                          p: 2,
                          bgcolor: 'rgba(0,0,0,0.02)',
                          borderRadius: 2,
                          borderLeft: '4px solid #FF6B35'
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                          <Typography variant="subtitle2" fontWeight="600">
                            {application.tournament.name}
                          </Typography>
                          <Chip
                            size="small"
                            label={getStatusText(application.approvalStatus)}
                            color={
                              application.approvalStatus === 'approved' ? 'success' :
                              application.approvalStatus === 'pending' ? 'warning' : 'error'
                            }
                          />
                        </Stack>
                        <Stack spacing={0.5}>
                          <Typography variant="body2" color="text.secondary">
                            📍 {application.tournament.location}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            📅 {formatDate(application.tournament.startDate)}
                          </Typography>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                )}

                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/player/applications')}
                  sx={{ mt: 3, borderColor: '#FF6B35', color: '#FF6B35' }}
                >
                  전체 보기
                </Button>
              </CardContent>
            </Card>
          </Box>

          {/* 참가 가능한 대회 */}
          <Box sx={{ flex: '1 1 400px' }}>
            <Card sx={{ height: '100%', borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <SearchIcon sx={{ color: '#8E24AA' }} />
                  <Typography variant="h6" fontWeight="bold">
                    참가 가능한 대회
                  </Typography>
                </Stack>
                
                {tournamentsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : availableTournaments.length === 0 ? (
                  <Box sx={{ 
                    p: 3,
                    textAlign: 'center',
                    bgcolor: 'rgba(142, 36, 170, 0.1)',
                    borderRadius: 2
                  }}>
                    <Typography variant="body2" color="text.secondary">
                      현재 참가 가능한 대회가 없습니다.
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {availableTournaments.slice(0, 3).map((tournament) => (
                      <Box 
                        key={tournament.id}
                        sx={{ 
                          p: 2,
                          bgcolor: 'rgba(0,0,0,0.02)',
                          borderRadius: 2,
                          borderLeft: '4px solid #8E24AA',
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' }
                        }}
                        onClick={() => navigate('/player/tournaments')}
                      >
                        <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1 }}>
                          {tournament.name}
                        </Typography>
                        <Stack spacing={0.5}>
                          <Typography variant="body2" color="text.secondary">
                            📍 {tournament.location}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            📅 {formatDate(tournament.startDate)}
                          </Typography>
                          <Typography variant="body2" color="#FF6B35" sx={{ fontWeight: 600 }}>
                            💰 {formatCurrency(tournament.participantFee)}
                          </Typography>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                )}

                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => navigate('/player/tournaments')}
                  sx={{ 
                    mt: 3,
                    bgcolor: '#8E24AA',
                    '&:hover': { bgcolor: '#7B1FA2' }
                  }}
                >
                  대회 둘러보기
                </Button>
              </CardContent>
            </Card>
          </Box>
        </Stack>
      </Container>
    </PlayerLayout>
  );
};

export default PlayerDashboard;