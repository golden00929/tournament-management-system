import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Divider,
  Tab,
  Tabs,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  EmojiEvents as TrophyIcon,
  ExpandMore as ExpandMoreIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CompletedIcon,
  Cancel as CancelledIcon,
  PlayArrow as OngoingIcon,
  Pending as ScheduledIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import {
  useGetTournamentBracketQuery,
  useGetPlayerProfileQuery,
} from '../../store/api/playerApiSlice';
import LanguageSelector from '../../components/LanguageSelector/LanguageSelector';

const PlayerTournamentBracket: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedBracket, setSelectedBracket] = useState<number>(0);

  const {
    data: bracketData,
    isLoading: bracketLoading,
    error: bracketError,
  } = useGetTournamentBracketQuery(tournamentId!, { skip: !tournamentId });

  // 디버깅 로그 추가
  console.log('🎾 PlayerTournamentBracket Debug:', {
    tournamentId,
    bracketLoading,
    bracketError,
    bracketData,
    hasData: !!bracketData,
    brackets: bracketData?.data?.brackets,
    bracketCount: bracketData?.data?.brackets?.length || 0
  });

  const {
    data: profileData,
  } = useGetPlayerProfileQuery();

  const handleBracketChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedBracket(newValue);
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

  const isMyMatch = (match: any) => {
    const playerName = profileData?.data?.name;
    return playerName && (match.player1Name === playerName || match.player2Name === playerName);
  };

  const getMyResult = (match: any) => {
    const playerName = profileData?.data?.name;
    if (!playerName || match.status !== 'completed') return null;
    
    const isPlayer1 = match.player1Name === playerName;
    const isWinner = match.winnerId === (isPlayer1 ? 'player1' : 'player2');
    
    return {
      isWinner,
      myScore: isPlayer1 ? match.player1Score : match.player2Score,
      opponentScore: isPlayer1 ? match.player2Score : match.player1Score,
      opponent: isPlayer1 ? match.player2Name : match.player1Name,
    };
  };

  const groupMatchesByRound = (matches: any[]) => {
    const grouped = matches.reduce((acc, match) => {
      if (!acc[match.roundName]) {
        acc[match.roundName] = [];
      }
      acc[match.roundName].push(match);
      return acc;
    }, {});

    // 라운드 순서 정렬
    const roundOrder = ['예선', '32강', '16강', '8강', '준준결승', '준결승', '결승'];
    return Object.keys(grouped)
      .sort((a, b) => {
        const aIndex = roundOrder.indexOf(a);
        const bIndex = roundOrder.indexOf(b);
        if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      })
      .map(roundName => ({
        roundName,
        matches: grouped[roundName].sort((a: any, b: any) => a.matchNumber - b.matchNumber)
      }));
  };

  if (bracketLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (bracketError) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          {t('player.bracket.bracketNotFound')}
        </Alert>
      </Container>
    );
  }

  const tournament = bracketData?.data?.tournament;
  const brackets = bracketData?.data?.brackets || [];

  if (brackets.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">
          {t('player.bracket.noBracket')}
        </Alert>
      </Container>
    );
  }

  const currentBracket = brackets[selectedBracket];
  const roundGroups = currentBracket ? groupMatchesByRound(currentBracket.matches) : [];
  const myMatches = currentBracket ? currentBracket.matches.filter(isMyMatch) : [];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 헤더 */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={() => navigate('/player/matches')}
        >
          {t('player.bracket.backToMatches')}
        </Button>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight="bold">
            {tournament?.name} {t('player.bracket.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('player.bracket.subtitle', { defaultValue: 'Check your match position and review the match schedule' })}
          </Typography>
        </Box>
        <LanguageSelector />
      </Box>

      <Grid container spacing={3}>
        {/* 왼쪽: 내 경기 요약 */}
        <Grid sx={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon color="primary" />
                {t('player.bracket.myMatches')}
              </Typography>

              {myMatches.length === 0 ? (
                <Alert severity="info">
                  {t('player.bracket.cannotFindMyMatches')}
                </Alert>
              ) : (
                <List>
                  {myMatches.map((match, index) => {
                    const result = getMyResult(match);
                    return (
                      <React.Fragment key={match.id}>
                        {index > 0 && <Divider />}
                        <ListItem 
                          sx={{ 
                            p: 2, 
                            bgcolor: 'primary.light', 
                            borderRadius: 1, 
                            mb: 1,
                            border: '2px solid',
                            borderColor: 'primary.main'
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle1" fontWeight="bold">
                                  {match.roundName}
                                </Typography>
                                <Chip
                                  size="small"
                                  label={getStatusText(match.status)}
                                  color={getStatusColor(match.status)}
                                  icon={getStatusIcon(match.status)}
                                />
                              </Box>
                            }
                            secondary={
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="body2" fontWeight="bold">
                                  🏁 {match.player1Name} vs {match.player2Name}
                                </Typography>
                                {match.scheduledTime && (
                                  <Typography variant="body2" color="text.secondary">
                                    🕐 {formatDateTime(match.scheduledTime)}
                                  </Typography>
                                )}
                                {result && (
                                  <Typography 
                                    variant="body2" 
                                    fontWeight="bold"
                                    color={result.isWinner ? 'success.main' : 'error.main'}
                                  >
                                    {result.isWinner ? `🏆 ${t('player.matches.win')}` : `😞 ${t('player.matches.loss')}`}: {result.myScore} - {result.opponentScore}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      </React.Fragment>
                    );
                  })}
                </List>
              )}
            </CardContent>
          </Card>

          {/* 대진표 통계 */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScheduleIcon color="primary" />
                {t('player.bracket.bracketInfo')}
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, textAlign: 'center' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    {currentBracket?.matches.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('player.bracket.totalMatches')}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {currentBracket?.matches.filter((m: any) => m.status === 'completed').length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('player.matches.completedMatches')}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {currentBracket?.matches.filter((m: any) => m.status === 'scheduled').length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('player.matches.scheduledMatches')}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {roundGroups.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('player.bracket.totalRounds')}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 오른쪽: 전체 대진표 */}
        <Grid sx={{ xs: 12, md: 8 }}>
          {/* 대진표 선택 탭 */}
          {brackets.length > 1 && (
            <Paper sx={{ mb: 3 }}>
              <Tabs value={selectedBracket} onChange={handleBracketChange}>
                {brackets.map((bracket, index) => (
                  <Tab 
                    key={bracket.id} 
                    label={`${bracket.name} (${bracket.eventType})`}
                  />
                ))}
              </Tabs>
            </Paper>
          )}

          {/* 라운드별 경기 목록 */}
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            {currentBracket?.name} - {currentBracket?.eventType === 'singles' ? t('player.bracket.singles') : t('player.bracket.doubles')}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {roundGroups.map((roundGroup) => (
              <Accordion key={roundGroup.roundName} defaultExpanded={roundGroup.matches.some(isMyMatch)}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Typography variant="h6" fontWeight="bold">
                      {roundGroup.roundName}
                    </Typography>
                    <Chip 
                      size="small" 
                      label={`${roundGroup.matches.length} ${t('player.matches.match')}`}
                      color="primary"
                      variant="outlined"
                    />
                    {roundGroup.matches.some(isMyMatch) && (
                      <Chip 
                        size="small" 
                        label={t('player.bracket.myMatch')}
                        color="success"
                      />
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {roundGroup.matches.map((match: any) => {
                      const isMyMatchFlag = isMyMatch(match);
                      const result = getMyResult(match);
                      
                      return (
                        <Card 
                          key={match.id}
                          sx={{ 
                            border: isMyMatchFlag ? '2px solid' : '1px solid',
                            borderColor: isMyMatchFlag ? 'primary.main' : 'divider',
                            bgcolor: isMyMatchFlag ? 'primary.light' : 'background.paper'
                          }}
                        >
                          <CardContent sx={{ py: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {t('player.matches.match')} {match.matchNumber}
                                {isMyMatchFlag && (
                                  <Chip 
                                    size="small" 
                                    label={t('player.bracket.myMatch')} 
                                    color="success" 
                                    sx={{ ml: 1 }}
                                  />
                                )}
                              </Typography>
                              <Chip
                                size="small"
                                label={getStatusText(match.status)}
                                color={getStatusColor(match.status)}
                                icon={getStatusIcon(match.status)}
                              />
                            </Box>
                            
                            <Typography variant="body1" fontWeight="bold" sx={{ mb: 1 }}>
                              🏁 {match.player1Name} vs {match.player2Name}
                            </Typography>

                            <Grid container spacing={2}>
                              <Grid sx={{ xs: 12, sm: 6 }}>
                                {match.scheduledTime && (
                                  <Typography variant="body2" color="text.secondary">
                                    🕐 {formatDateTime(match.scheduledTime)}
                                  </Typography>
                                )}
                              </Grid>
                              <Grid sx={{ xs: 12, sm: 6 }}>
                                {match.status === 'completed' && (
                                  <Typography variant="body2" fontWeight="bold">
                                    📊 {match.player1Score} - {match.player2Score}
                                    {result && (
                                      <Chip
                                        size="small"
                                        label={result.isWinner ? t('player.matches.win') : t('player.matches.loss')}
                                        color={result.isWinner ? 'success' : 'error'}
                                        sx={{ ml: 1 }}
                                      />
                                    )}
                                  </Typography>
                                )}
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default PlayerTournamentBracket;