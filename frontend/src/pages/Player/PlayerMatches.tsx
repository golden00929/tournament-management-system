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

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          {t('common.errorLoadingMatches', { defaultValue: 'Failed to load match schedule. Please try again.' })}
        </Alert>
      </Container>
    );
  }

  const matches = matchesData?.data || [];
  const filteredMatches = filterMatches(matches);
  const tournaments = getUniquetournaments(matches);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 헤더 */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={() => navigate('/player/dashboard')}
        >
          {t('player.matches.backToDashboard')}
        </Button>
        <Typography variant="h4" fontWeight="bold" sx={{ flex: 1 }}>
          {t('player.matches.title')}
        </Typography>
        <LanguageSelector />
      </Box>

      <Grid container spacing={3}>
        {/* 왼쪽: 경기 목록 */}
        <Grid sx={{ xs: 12, md: 8 }}>
          {/* 탭 메뉴 */}
          <Paper sx={{ mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label={`${t('common.all')} (${matches.length})`} />
              <Tab label={`${t('player.matches.scheduled')} (${matches.filter(m => m.status === 'scheduled').length})`} />
              <Tab label={`${t('player.matches.ongoing')} (${matches.filter(m => m.status === 'ongoing').length})`} />
              <Tab label={`${t('player.matches.completed')} (${matches.filter(m => m.status === 'completed').length})`} />
            </Tabs>
          </Paper>

          {/* 경기 목록 */}
          {filteredMatches.length === 0 ? (
            <Alert severity="info">
              {tabValue === 0 ? t('player.matches.noMatches') : t('player.matches.noMatchesForStatus')}
            </Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredMatches.map((match) => (
                <Card key={match.id}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" fontWeight="bold">
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
                      <Typography variant="subtitle1" fontWeight="bold" color="primary">
                        {match.roundName} - {t('player.matches.match')} {match.matchNumber}
                      </Typography>
                      <Typography variant="h6" sx={{ my: 1 }}>
                        🏁 {match.player1Name} vs {match.player2Name}
                      </Typography>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid sx={{ xs: 12, sm: 6 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <LocationIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {match.tournament.location} - {match.tournament.venue}
                          </Typography>
                        </Box>
                        {match.courtNumber && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="body2">
                              🏟️ {t('player.matches.court')} {match.courtNumber}
                            </Typography>
                          </Box>
                        )}
                      </Grid>
                      <Grid sx={{ xs: 12, sm: 6 }}>
                        {match.scheduledTime && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <CalendarIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {formatDateTime(match.scheduledTime)}
                            </Typography>
                          </Box>
                        )}
                        {match.status === 'completed' && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight="bold">
                              📊 {match.player1Score} - {match.player2Score}
                            </Typography>
                          </Box>
                        )}
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => navigate(`/player/tournament/${match.tournament.id}/bracket`)}
                      >
                        {t('player.matches.viewBracket')}
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate(`/player/tournament/${match.tournament.id}`)}
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
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrophyIcon color="primary" />
                {t('player.matches.participatingTournaments')}
              </Typography>

              {tournaments.length === 0 ? (
                <Alert severity="info">
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
                        {index > 0 && <Divider />}
                        <ListItemButton 
                          onClick={() => navigate(`/player/tournament/${tournament.id}/bracket`)}
                        >
                          <ListItemIcon>
                            <TrophyIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle2" fontWeight="bold">
                                {tournament.name}
                              </Typography>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  📍 {tournament.location}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  🏁 {t('player.matches.scheduled')}: {scheduledCount} {t('player.matches.match')}, {t('player.matches.completed')}: {completedCount} {t('player.matches.match')}
                                </Typography>
                              </Box>
                            }
                          />
                          <IconButton size="small">
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
                  sx={{ mt: 2 }}
                  onClick={() => navigate('/player/applications')}
                >
                  {t('player.matches.viewApplications')}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* 경기 통계 */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScheduleIcon color="primary" />
                {t('player.matches.matchStats')}
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, textAlign: 'center' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    {matches.filter(m => m.status === 'scheduled').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('player.matches.scheduledMatches')}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {matches.filter(m => m.status === 'completed').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('player.matches.completedMatches')}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {matches.filter(m => m.status === 'ongoing').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('player.matches.ongoingMatches')}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {tournaments.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('player.matches.totalTournaments')}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default PlayerMatches;