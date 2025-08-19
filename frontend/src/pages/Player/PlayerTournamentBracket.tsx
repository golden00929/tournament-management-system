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
import { alpha } from '@mui/material/styles';
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

  // Dark theme configuration
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
      <Box
        sx={{
          minHeight: '100vh',
          background: `linear-gradient(135deg, ${darkTheme.background.primary} 0%, ${darkTheme.background.secondary} 50%, ${darkTheme.background.tertiary} 100%)`,
        }}
      >
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <CircularProgress 
              size={60} 
              sx={{ color: darkTheme.accent.primary }}
            />
          </Box>
        </Container>
      </Box>
    );
  }

  if (bracketError) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: `linear-gradient(135deg, ${darkTheme.background.primary} 0%, ${darkTheme.background.secondary} 50%, ${darkTheme.background.tertiary} 100%)`,
        }}
      >
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert 
            severity="error"
            sx={{
              backgroundColor: alpha(darkTheme.accent.error, 0.1),
              color: darkTheme.text.primary,
              border: `1px solid ${alpha(darkTheme.accent.error, 0.3)}`,
              '& .MuiAlert-icon': {
                color: darkTheme.accent.error,
              },
            }}
          >
            {t('player.bracket.bracketNotFound')}
          </Alert>
        </Container>
      </Box>
    );
  }

  const tournament = bracketData?.data?.tournament;
  const brackets = bracketData?.data?.brackets || [];

  if (brackets.length === 0) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: `linear-gradient(135deg, ${darkTheme.background.primary} 0%, ${darkTheme.background.secondary} 50%, ${darkTheme.background.tertiary} 100%)`,
        }}
      >
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert 
            severity="info"
            sx={{
              backgroundColor: alpha(darkTheme.accent.primary, 0.1),
              color: darkTheme.text.primary,
              border: `1px solid ${alpha(darkTheme.accent.primary, 0.3)}`,
              '& .MuiAlert-icon': {
                color: darkTheme.accent.primary,
              },
            }}
          >
            {t('player.bracket.noBracket')}
          </Alert>
        </Container>
      </Box>
    );
  }

  const currentBracket = brackets[selectedBracket];
  const roundGroups = currentBracket ? groupMatchesByRound(currentBracket.matches) : [];
  const myMatches = currentBracket ? currentBracket.matches.filter(isMyMatch) : [];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${darkTheme.background.primary} 0%, ${darkTheme.background.secondary} 50%, ${darkTheme.background.tertiary} 100%)`,
      }}
    >
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* 헤더 */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<BackIcon sx={{ color: darkTheme.text.primary }} />}
            onClick={() => navigate('/player/matches')}
            sx={{
              borderColor: alpha(darkTheme.accent.primary, 0.5),
              color: darkTheme.text.primary,
              backgroundColor: alpha(darkTheme.card.elevated, 0.8),
              '&:hover': {
                borderColor: darkTheme.accent.primary,
                backgroundColor: alpha(darkTheme.card.hover, 0.9),
                transform: 'translateY(-2px)',
                boxShadow: `0 8px 25px ${alpha(darkTheme.accent.primary, 0.15)}`,
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {t('player.bracket.backToMatches')}
          </Button>
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="h4" 
              fontWeight="bold"
              sx={{ 
                color: darkTheme.text.primary,
                textShadow: `0 2px 10px ${alpha(darkTheme.accent.primary, 0.3)}`,
              }}
            >
              {tournament?.name} {t('player.bracket.title')}
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ color: darkTheme.text.secondary }}
            >
              {t('player.bracket.subtitle', { defaultValue: 'Check your match position and review the match schedule' })}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: alpha(darkTheme.card.elevated, 0.8),
              borderRadius: 2,
              p: 1,
            }}
          >
            <LanguageSelector />
          </Box>
        </Box>

      <Grid container spacing={3}>
        {/* 왼쪽: 내 경기 요약 */}
        <Grid sx={{ xs: 12, md: 4 }}>
          <Card
            sx={{
              backgroundColor: darkTheme.card.elevated,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(darkTheme.accent.primary, 0.1)}`,
              borderRadius: 3,
              boxShadow: `0 8px 32px ${alpha(darkTheme.background.primary, 0.3)}`,
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 16px 48px ${alpha(darkTheme.background.primary, 0.4)}`,
                border: `1px solid ${alpha(darkTheme.accent.primary, 0.2)}`,
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <CardContent>
              <Typography 
                variant="h6" 
                fontWeight="bold" 
                gutterBottom 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  color: darkTheme.text.primary,
                }}
              >
                <PersonIcon sx={{ color: darkTheme.accent.primary }} />
                {t('player.bracket.myMatches')}
              </Typography>

              {myMatches.length === 0 ? (
                <Alert 
                  severity="info"
                  sx={{
                    backgroundColor: alpha(darkTheme.accent.primary, 0.1),
                    color: darkTheme.text.primary,
                    border: `1px solid ${alpha(darkTheme.accent.primary, 0.3)}`,
                    '& .MuiAlert-icon': {
                      color: darkTheme.accent.primary,
                    },
                  }}
                >
                  {t('player.bracket.cannotFindMyMatches')}
                </Alert>
              ) : (
                <List>
                  {myMatches.map((match, index) => {
                    const result = getMyResult(match);
                    return (
                      <React.Fragment key={match.id}>
                        {index > 0 && <Divider sx={{ borderColor: alpha(darkTheme.accent.primary, 0.1) }} />}
                        <ListItem 
                          sx={{ 
                            p: 2, 
                            backgroundColor: alpha(darkTheme.accent.primary, 0.15), 
                            borderRadius: 2, 
                            mb: 1,
                            border: '2px solid',
                            borderColor: darkTheme.accent.primary,
                            backdropFilter: 'blur(10px)',
                            '&:hover': {
                              backgroundColor: alpha(darkTheme.accent.primary, 0.2),
                              transform: 'translateX(4px)',
                            },
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography 
                                  variant="subtitle1" 
                                  fontWeight="bold"
                                  sx={{ color: darkTheme.text.primary }}
                                >
                                  {match.roundName}
                                </Typography>
                                <Chip
                                  size="small"
                                  label={getStatusText(match.status)}
                                  sx={{
                                    backgroundColor: alpha(darkTheme.accent[match.status === 'completed' ? 'success' : match.status === 'ongoing' ? 'warning' : 'primary'], 0.2),
                                    color: darkTheme.text.primary,
                                    border: `1px solid ${alpha(darkTheme.accent[match.status === 'completed' ? 'success' : match.status === 'ongoing' ? 'warning' : 'primary'], 0.4)}`,
                                  }}
                                  icon={getStatusIcon(match.status)}
                                />
                              </Box>
                            }
                            secondary={
                              <Box sx={{ mt: 1 }}>
                                <Typography 
                                  variant="body2" 
                                  fontWeight="bold"
                                  sx={{ color: darkTheme.text.accent }}
                                >
                                  🏁 {match.player1Name} vs {match.player2Name}
                                </Typography>
                                {match.scheduledTime && (
                                  <Typography 
                                    variant="body2" 
                                    sx={{ color: darkTheme.text.secondary }}
                                  >
                                    🕐 {formatDateTime(match.scheduledTime)}
                                  </Typography>
                                )}
                                {result && (
                                  <Typography 
                                    variant="body2" 
                                    fontWeight="bold"
                                    sx={{ color: result.isWinner ? darkTheme.accent.success : darkTheme.accent.error }}
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
          <Card 
            sx={{ 
              mt: 3,
              backgroundColor: darkTheme.card.elevated,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(darkTheme.accent.secondary, 0.1)}`,
              borderRadius: 3,
              boxShadow: `0 8px 32px ${alpha(darkTheme.background.primary, 0.3)}`,
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 16px 48px ${alpha(darkTheme.background.primary, 0.4)}`,
                border: `1px solid ${alpha(darkTheme.accent.secondary, 0.2)}`,
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <CardContent>
              <Typography 
                variant="h6" 
                fontWeight="bold" 
                gutterBottom 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  color: darkTheme.text.primary,
                }}
              >
                <ScheduleIcon sx={{ color: darkTheme.accent.secondary }} />
                {t('player.bracket.bracketInfo')}
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, textAlign: 'center' }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: alpha(darkTheme.accent.primary, 0.1),
                    border: `1px solid ${alpha(darkTheme.accent.primary, 0.2)}`,
                  }}
                >
                  <Typography 
                    variant="h4" 
                    fontWeight="bold" 
                    sx={{ color: darkTheme.accent.primary }}
                  >
                    {currentBracket?.matches.length || 0}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ color: darkTheme.text.secondary }}
                  >
                    {t('player.bracket.totalMatches')}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: alpha(darkTheme.accent.success, 0.1),
                    border: `1px solid ${alpha(darkTheme.accent.success, 0.2)}`,
                  }}
                >
                  <Typography 
                    variant="h4" 
                    fontWeight="bold" 
                    sx={{ color: darkTheme.accent.success }}
                  >
                    {currentBracket?.matches.filter((m: any) => m.status === 'completed').length || 0}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ color: darkTheme.text.secondary }}
                  >
                    {t('player.matches.completedMatches')}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: alpha(darkTheme.accent.warning, 0.1),
                    border: `1px solid ${alpha(darkTheme.accent.warning, 0.2)}`,
                  }}
                >
                  <Typography 
                    variant="h4" 
                    fontWeight="bold" 
                    sx={{ color: darkTheme.accent.warning }}
                  >
                    {currentBracket?.matches.filter((m: any) => m.status === 'scheduled').length || 0}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ color: darkTheme.text.secondary }}
                  >
                    {t('player.matches.scheduledMatches')}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: alpha(darkTheme.accent.gold, 0.1),
                    border: `1px solid ${alpha(darkTheme.accent.gold, 0.2)}`,
                  }}
                >
                  <Typography 
                    variant="h4" 
                    fontWeight="bold" 
                    sx={{ color: darkTheme.accent.gold }}
                  >
                    {roundGroups.length}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ color: darkTheme.text.secondary }}
                  >
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
            <Paper 
              sx={{ 
                mb: 3,
                backgroundColor: darkTheme.card.elevated,
                backdropFilter: 'blur(20px)',
                border: `1px solid ${alpha(darkTheme.accent.primary, 0.1)}`,
                borderRadius: 2,
                boxShadow: `0 4px 20px ${alpha(darkTheme.background.primary, 0.3)}`,
              }}
            >
              <Tabs 
                value={selectedBracket} 
                onChange={handleBracketChange}
                sx={{
                  '& .MuiTab-root': {
                    color: darkTheme.text.secondary,
                    '&.Mui-selected': {
                      color: darkTheme.accent.primary,
                    },
                    '&:hover': {
                      color: darkTheme.text.primary,
                    },
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: darkTheme.accent.primary,
                  },
                  '& .MuiTabs-flexContainer': {
                    gap: 2,
                  },
                }}
              >
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
          <Typography 
            variant="h5" 
            fontWeight="bold" 
            gutterBottom
            sx={{ 
              color: darkTheme.text.primary,
              textShadow: `0 2px 10px ${alpha(darkTheme.accent.secondary, 0.3)}`,
              mb: 3,
            }}
          >
            {currentBracket?.name} - {currentBracket?.eventType === 'singles' ? t('player.bracket.singles') : t('player.bracket.doubles')}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {roundGroups.map((roundGroup) => (
              <Accordion 
                key={roundGroup.roundName} 
                defaultExpanded={roundGroup.matches.some(isMyMatch)}
                sx={{
                  backgroundColor: darkTheme.card.elevated,
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${alpha(darkTheme.accent.primary, 0.1)}`,
                  borderRadius: 2,
                  boxShadow: `0 4px 20px ${alpha(darkTheme.background.primary, 0.2)}`,
                  '&:hover': {
                    border: `1px solid ${alpha(darkTheme.accent.primary, 0.2)}`,
                    boxShadow: `0 8px 30px ${alpha(darkTheme.background.primary, 0.3)}`,
                  },
                  '&.Mui-expanded': {
                    border: `1px solid ${alpha(darkTheme.accent.secondary, 0.3)}`,
                    boxShadow: `0 8px 30px ${alpha(darkTheme.accent.secondary, 0.1)}`,
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:before': {
                    display: 'none',
                  },
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon sx={{ color: darkTheme.accent.primary }} />}
                  sx={{
                    backgroundColor: 'transparent',
                    '&:hover': {
                      backgroundColor: alpha(darkTheme.accent.primary, 0.05),
                    },
                    '& .MuiAccordionSummary-content': {
                      margin: 0,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Typography 
                      variant="h6" 
                      fontWeight="bold"
                      sx={{ color: darkTheme.text.primary }}
                    >
                      {roundGroup.roundName}
                    </Typography>
                    <Chip 
                      size="small" 
                      label={`${roundGroup.matches.length} ${t('player.matches.match')}`}
                      sx={{
                        backgroundColor: alpha(darkTheme.accent.primary, 0.15),
                        color: darkTheme.text.primary,
                        border: `1px solid ${alpha(darkTheme.accent.primary, 0.3)}`,
                      }}
                    />
                    {roundGroup.matches.some(isMyMatch) && (
                      <Chip 
                        size="small" 
                        label={t('player.bracket.myMatch')}
                        sx={{
                          backgroundColor: alpha(darkTheme.accent.success, 0.15),
                          color: darkTheme.text.primary,
                          border: `1px solid ${alpha(darkTheme.accent.success, 0.3)}`,
                        }}
                      />
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails
                  sx={{
                    backgroundColor: alpha(darkTheme.background.secondary, 0.3),
                    borderTop: `1px solid ${alpha(darkTheme.accent.primary, 0.1)}`,
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {roundGroup.matches.map((match: any) => {
                      const isMyMatchFlag = isMyMatch(match);
                      const result = getMyResult(match);
                      
                      return (
                        <Card 
                          key={match.id}
                          sx={{ 
                            backgroundColor: isMyMatchFlag 
                              ? alpha(darkTheme.accent.primary, 0.15) 
                              : alpha(darkTheme.card.elevated, 0.8),
                            backdropFilter: 'blur(20px)',
                            border: isMyMatchFlag ? '2px solid' : '1px solid',
                            borderColor: isMyMatchFlag ? darkTheme.accent.primary : alpha(darkTheme.accent.secondary, 0.2),
                            borderRadius: 2,
                            boxShadow: isMyMatchFlag 
                              ? `0 8px 25px ${alpha(darkTheme.accent.primary, 0.2)}` 
                              : `0 4px 15px ${alpha(darkTheme.background.primary, 0.2)}`,
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              borderColor: isMyMatchFlag ? darkTheme.accent.primary : darkTheme.accent.secondary,
                              boxShadow: isMyMatchFlag 
                                ? `0 12px 35px ${alpha(darkTheme.accent.primary, 0.3)}` 
                                : `0 8px 25px ${alpha(darkTheme.background.primary, 0.3)}`,
                              backgroundColor: isMyMatchFlag 
                                ? alpha(darkTheme.accent.primary, 0.2) 
                                : darkTheme.card.hover,
                            },
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                        >
                          <CardContent sx={{ py: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography 
                                variant="subtitle2" 
                                fontWeight="bold"
                                sx={{ color: darkTheme.text.primary }}
                              >
                                {t('player.matches.match')} {match.matchNumber}
                                {isMyMatchFlag && (
                                  <Chip 
                                    size="small" 
                                    label={t('player.bracket.myMatch')} 
                                    sx={{ 
                                      ml: 1,
                                      backgroundColor: alpha(darkTheme.accent.success, 0.2),
                                      color: darkTheme.text.primary,
                                      border: `1px solid ${alpha(darkTheme.accent.success, 0.4)}`,
                                    }}
                                  />
                                )}
                              </Typography>
                              <Chip
                                size="small"
                                label={getStatusText(match.status)}
                                sx={{
                                  backgroundColor: alpha(
                                    darkTheme.accent[
                                      match.status === 'completed' ? 'success' : 
                                      match.status === 'ongoing' ? 'warning' : 
                                      match.status === 'cancelled' ? 'error' : 'primary'
                                    ], 0.2
                                  ),
                                  color: darkTheme.text.primary,
                                  border: `1px solid ${alpha(
                                    darkTheme.accent[
                                      match.status === 'completed' ? 'success' : 
                                      match.status === 'ongoing' ? 'warning' : 
                                      match.status === 'cancelled' ? 'error' : 'primary'
                                    ], 0.4
                                  )}`,
                                }}
                                icon={getStatusIcon(match.status)}
                              />
                            </Box>
                            
                            <Typography 
                              variant="body1" 
                              fontWeight="bold" 
                              sx={{ 
                                mb: 1,
                                color: darkTheme.text.accent,
                              }}
                            >
                              🏁 {match.player1Name} vs {match.player2Name}
                            </Typography>

                            <Grid container spacing={2}>
                              <Grid sx={{ xs: 12, sm: 6 }}>
                                {match.scheduledTime && (
                                  <Typography 
                                    variant="body2" 
                                    sx={{ color: darkTheme.text.secondary }}
                                  >
                                    🕐 {formatDateTime(match.scheduledTime)}
                                  </Typography>
                                )}
                              </Grid>
                              <Grid sx={{ xs: 12, sm: 6 }}>
                                {match.status === 'completed' && (
                                  <Typography 
                                    variant="body2" 
                                    fontWeight="bold"
                                    sx={{ color: darkTheme.text.accent }}
                                  >
                                    📊 {match.player1Score} - {match.player2Score}
                                    {result && (
                                      <Chip
                                        size="small"
                                        label={result.isWinner ? t('player.matches.win') : t('player.matches.loss')}
                                        sx={{ 
                                          ml: 1,
                                          backgroundColor: alpha(result.isWinner ? darkTheme.accent.success : darkTheme.accent.error, 0.2),
                                          color: darkTheme.text.primary,
                                          border: `1px solid ${alpha(result.isWinner ? darkTheme.accent.success : darkTheme.accent.error, 0.4)}`,
                                        }}
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
    </Box>
  );
};

export default PlayerTournamentBracket;