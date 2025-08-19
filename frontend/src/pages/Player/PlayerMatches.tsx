import React, { useState } from 'react';
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
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Divider,
  Tab,
  Tabs,
  Grid,
  IconButton,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  ArrowBack as BackIcon,
  EmojiEvents as TrophyIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CompletedIcon,
  Cancel as CancelledIcon,
  PlayArrow as OngoingIcon,
  Pending as ScheduledIcon,
  Visibility as ViewIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import {
  useGetPlayerMatchesQuery,
  useGetTournamentBracketQuery,
} from '../../store/api/playerApiSlice';
import LanguageSelector from '../../components/LanguageSelector/LanguageSelector';

const PlayerMatches: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState(0);
  const [selectedTournament, setSelectedTournament] = useState<string>('');

  const {
    data: matchesData,
    isLoading,
    error,
  } = useGetPlayerMatchesQuery({});

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CompletedIcon color="success" />;
      case 'ongoing':
        return <OngoingIcon color="warning" />;
      case 'scheduled':
        return <ScheduledIcon color="primary" />;
      case 'cancelled':
        return <CancelledIcon color="error" />;
      default:
        return <ScheduledIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'ongoing': return 'warning';
      case 'scheduled': return 'primary';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return t('player.matches.completed');
      case 'ongoing': return t('player.matches.ongoing');
      case 'scheduled': return t('player.matches.scheduled');
      case 'cancelled': return t('player.matches.cancelled');
      default: return status;
    }
  };

  const filterMatches = (matches: any[]) => {
    switch (tabValue) {
      case 0: return matches; // 전체
      case 1: return matches.filter(match => match.status === 'scheduled');
      case 2: return matches.filter(match => match.status === 'ongoing');
      case 3: return matches.filter(match => match.status === 'completed');
      default: return matches;
    }
  };

  const getUniquetournaments = (matches: any[]) => {
    const tournaments = matches.map(match => match.tournament);
    return tournaments.filter((tournament, index, self) => 
      index === self.findIndex(t => t.id === tournament.id)
    );
  };

  // 다크 테마 색상 정의
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
    },
  };

  if (isLoading) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${darkTheme.background.primary} 0%, ${darkTheme.background.secondary} 100%)`,
        color: darkTheme.text.primary,
        pb: { xs: 10, sm: 4 }
      }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <CircularProgress size={60} sx={{ color: darkTheme.accent.primary }} />
          </Box>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${darkTheme.background.primary} 0%, ${darkTheme.background.secondary} 100%)`,
        color: darkTheme.text.primary,
        pb: { xs: 10, sm: 4 }
      }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert 
            severity="error"
            sx={{
              bgcolor: alpha(darkTheme.accent.error, 0.1),
              color: darkTheme.accent.error,
              border: `1px solid ${alpha(darkTheme.accent.error, 0.3)}`,
              '& .MuiAlert-icon': {
                color: darkTheme.accent.error
              }
            }}
          >
            {t('common.errorLoadingMatches', { defaultValue: 'Failed to load match schedule. Please try again.' })}
          </Alert>
        </Container>
      </Box>
    );
  }

  const matches = matchesData?.data || [];
  const filteredMatches = filterMatches(matches);
  const tournaments = getUniquetournaments(matches);

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${darkTheme.background.primary} 0%, ${darkTheme.background.secondary} 100%)`,
      color: darkTheme.text.primary,
      pb: { xs: 10, sm: 4 }
    }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* 헤더 */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<BackIcon />}
            onClick={() => navigate('/player/dashboard')}
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
            {t('player.matches.backToDashboard')}
          </Button>
          <Typography variant="h4" fontWeight="bold" sx={{ flex: 1, color: darkTheme.text.primary }}>
            {t('player.matches.title')}
          </Typography>
          <LanguageSelector />
        </Box>

      <Grid container spacing={3}>
        {/* 왼쪽: 경기 목록 */}
        <Grid sx={{ xs: 12, md: 8 }}>
          {/* 탭 메뉴 */}
          <Paper sx={{ 
            mb: 3,
            bgcolor: darkTheme.card.elevated,
            border: `1px solid ${alpha(darkTheme.text.secondary, 0.1)}`
          }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              sx={{
                '& .MuiTab-root': {
                  color: darkTheme.text.secondary,
                  '&.Mui-selected': {
                    color: darkTheme.accent.primary,
                  },
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: darkTheme.accent.primary,
                },
              }}
            >
              <Tab label={`${t('common.all')} (${matches.length})`} />
              <Tab label={`${t('player.matches.scheduled')} (${matches.filter(m => m.status === 'scheduled').length})`} />
              <Tab label={`${t('player.matches.ongoing')} (${matches.filter(m => m.status === 'ongoing').length})`} />
              <Tab label={`${t('player.matches.completed')} (${matches.filter(m => m.status === 'completed').length})`} />
            </Tabs>
          </Paper>

          {/* 경기 목록 */}
          {filteredMatches.length === 0 ? (
            <Alert 
              severity="info"
              sx={{
                bgcolor: alpha(darkTheme.accent.secondary, 0.1),
                color: darkTheme.accent.secondary,
                border: `1px solid ${alpha(darkTheme.accent.secondary, 0.3)}`,
                '& .MuiAlert-icon': {
                  color: darkTheme.accent.secondary
                }
              }}
            >
              {tabValue === 0 ? t('player.matches.noMatches') : t('player.matches.noMatchesForStatus')}
            </Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredMatches.map((match) => (
                <Card 
                  key={match.id}
                  sx={{ 
                    bgcolor: darkTheme.card.elevated,
                    border: `1px solid ${alpha(darkTheme.text.secondary, 0.1)}`,
                    '&:hover': {
                      bgcolor: darkTheme.card.hover,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 8px 25px ${alpha(darkTheme.accent.primary, 0.2)}`
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: darkTheme.text.primary }}>
                        {match.tournament.name}
                      </Typography>
                      <Chip
                        size="small"
                        label={getStatusText(match.status)}
                        color={getStatusColor(match.status)}
                        icon={getStatusIcon(match.status)}
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ color: darkTheme.accent.primary }}>
                        {match.roundName} - {t('player.matches.match')} {match.matchNumber}
                      </Typography>
                      <Typography variant="h6" sx={{ my: 1, color: darkTheme.text.primary }}>
                        🏁 {match.player1Name} vs {match.player2Name}
                      </Typography>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid sx={{ xs: 12, sm: 6 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <LocationIcon fontSize="small" sx={{ color: darkTheme.text.secondary }} />
                          <Typography variant="body2" sx={{ color: darkTheme.text.secondary }}>
                            {match.tournament.location} - {match.tournament.venue}
                          </Typography>
                        </Box>
                        {match.courtNumber && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="body2" sx={{ color: darkTheme.text.secondary }}>
                              🏟️ {t('player.matches.court')} {match.courtNumber}
                            </Typography>
                          </Box>
                        )}
                      </Grid>
                      <Grid sx={{ xs: 12, sm: 6 }}>
                        {match.scheduledTime && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <CalendarIcon fontSize="small" sx={{ color: darkTheme.text.secondary }} />
                            <Typography variant="body2" sx={{ color: darkTheme.text.secondary }}>
                              {formatDateTime(match.scheduledTime)}
                            </Typography>
                          </Box>
                        )}
                        {match.status === 'completed' && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight="bold" sx={{ color: darkTheme.text.primary }}>
                              📊 {match.player1Score} - {match.player2Score}
                            </Typography>
                          </Box>
                        )}
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 2, borderColor: alpha(darkTheme.text.secondary, 0.2) }} />

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => navigate(`/player/tournament/${match.tournament.id}/bracket`)}
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
                        {t('player.matches.viewBracket')}
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate(`/player/tournament/${match.tournament.id}`)}
                        sx={{
                          borderColor: alpha(darkTheme.text.secondary, 0.3),
                          color: darkTheme.text.secondary,
                          '&:hover': {
                            borderColor: darkTheme.accent.secondary,
                            color: darkTheme.accent.secondary,
                            bgcolor: alpha(darkTheme.accent.secondary, 0.1)
                          }
                        }}
                      >
                        {t('player.matches.tournamentInfo')}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Grid>

        {/* 오른쪽: 대회별 요약 */}
        <Grid sx={{ xs: 12, md: 4 }}>
          <Card sx={{ 
            bgcolor: darkTheme.card.elevated,
            border: `1px solid ${alpha(darkTheme.text.secondary, 0.1)}`,
            '&:hover': {
              bgcolor: darkTheme.card.hover,
            },
            transition: 'all 0.2s ease-in-out'
          }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                color: darkTheme.text.primary 
              }}>
                <TrophyIcon sx={{ color: darkTheme.accent.primary }} />
                {t('player.matches.participatingTournaments')}
              </Typography>

              {tournaments.length === 0 ? (
                <Alert 
                  severity="info"
                  sx={{
                    bgcolor: alpha(darkTheme.accent.secondary, 0.1),
                    color: darkTheme.accent.secondary,
                    border: `1px solid ${alpha(darkTheme.accent.secondary, 0.3)}`,
                    '& .MuiAlert-icon': {
                      color: darkTheme.accent.secondary
                    }
                  }}
                >
                  {t('player.tournaments.noActiveTournaments', { defaultValue: 'No active tournaments.' })}
                </Alert>
              ) : (
                <List>
                  {tournaments.map((tournament, index) => {
                    const tournamentMatches = matches.filter(m => m.tournament.id === tournament.id);
                    const scheduledCount = tournamentMatches.filter(m => m.status === 'scheduled').length;
                    const completedCount = tournamentMatches.filter(m => m.status === 'completed').length;
                    
                    return (
                      <React.Fragment key={tournament.id}>
                        {index > 0 && <Divider sx={{ borderColor: alpha(darkTheme.text.secondary, 0.2) }} />}
                        <ListItemButton 
                          onClick={() => navigate(`/player/tournament/${tournament.id}/bracket`)}
                          sx={{
                            '&:hover': {
                              bgcolor: alpha(darkTheme.accent.primary, 0.1),
                            }
                          }}
                        >
                          <ListItemIcon>
                            <TrophyIcon sx={{ color: darkTheme.accent.primary }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle2" fontWeight="bold" sx={{ color: darkTheme.text.primary }}>
                                {tournament.name}
                              </Typography>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" sx={{ color: darkTheme.text.secondary }}>
                                  📍 {tournament.location}
                                </Typography>
                                <Typography variant="body2" sx={{ color: darkTheme.text.secondary }}>
                                  🏁 {t('player.matches.scheduled')}: {scheduledCount} {t('player.matches.match')}, {t('player.matches.completed')}: {completedCount} {t('player.matches.match')}
                                </Typography>
                              </Box>
                            }
                          />
                          <IconButton 
                            size="small"
                            sx={{ 
                              color: darkTheme.text.secondary,
                              '&:hover': {
                                color: darkTheme.accent.primary,
                                bgcolor: alpha(darkTheme.accent.primary, 0.1)
                              }
                            }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </ListItemButton>
                      </React.Fragment>
                    );
                  })}
                </List>
              )}

              {tournaments.length > 0 && (
                <Button
                  fullWidth
                  variant="outlined"
                  sx={{ 
                    mt: 2,
                    borderColor: alpha(darkTheme.text.secondary, 0.3),
                    color: darkTheme.text.secondary,
                    '&:hover': {
                      borderColor: darkTheme.accent.secondary,
                      color: darkTheme.accent.secondary,
                      bgcolor: alpha(darkTheme.accent.secondary, 0.1)
                    }
                  }}
                  onClick={() => navigate('/player/applications')}
                >
                  {t('player.matches.viewApplications')}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* 경기 통계 */}
          <Card sx={{ 
            mt: 3,
            bgcolor: darkTheme.card.elevated,
            border: `1px solid ${alpha(darkTheme.text.secondary, 0.1)}`,
            '&:hover': {
              bgcolor: darkTheme.card.hover,
            },
            transition: 'all 0.2s ease-in-out'
          }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                color: darkTheme.text.primary 
              }}>
                <ScheduleIcon sx={{ color: darkTheme.accent.primary }} />
                {t('player.matches.matchStats')}
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, textAlign: 'center' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: darkTheme.accent.primary }}>
                    {matches.filter(m => m.status === 'scheduled').length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: darkTheme.text.secondary }}>
                    {t('player.matches.scheduledMatches')}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: darkTheme.accent.success }}>
                    {matches.filter(m => m.status === 'completed').length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: darkTheme.text.secondary }}>
                    {t('player.matches.completedMatches')}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: darkTheme.accent.warning }}>
                    {matches.filter(m => m.status === 'ongoing').length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: darkTheme.text.secondary }}>
                    {t('player.matches.ongoingMatches')}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: darkTheme.text.primary }}>
                    {tournaments.length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: darkTheme.text.secondary }}>
                    {t('player.matches.totalTournaments')}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      </Container>
    </Box>
  );
};

export default PlayerMatches;