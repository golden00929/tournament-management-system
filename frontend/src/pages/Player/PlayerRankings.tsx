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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  IconButton,
  Stack,
  alpha,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import {
  useGetPublicRankingsQuery,
} from '../../store/api/playerApiSlice';
import LanguageSelector from '../../components/LanguageSelector/LanguageSelector';

const PlayerRankings: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [filters, setFilters] = useState({
    skillLevel: '',
    province: '',
    limit: 50,
  });

  const {
    data: rankingsData,
    isLoading,
    error,
    refetch,
  } = useGetPublicRankingsQuery(filters);

  // 디버그 로그
  console.log('🔍 PlayerRankings DEBUG - filters:', filters);
  console.log('🔍 PlayerRankings DEBUG - rankingsData:', rankingsData);
  console.log('🔍 PlayerRankings DEBUG - players.length:', rankingsData?.data?.players?.length);

  const handleFilterChange = (field: string) => (
    event: any
  ) => {
    setFilters(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
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

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <StarIcon sx={{ color: '#FFD700' }} />; // Gold
      case 2:
        return <StarIcon sx={{ color: '#C0C0C0' }} />; // Silver
      case 3:
        return <StarIcon sx={{ color: '#CD7F32' }} />; // Bronze
      default:
        return <Typography variant="body2" fontWeight="bold">{rank}</Typography>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getPerformanceColor = (value: number) => {
    if (value >= 80) return 'success';
    if (value >= 60) return 'warning';
    return 'error';
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
    },
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${darkTheme.background.primary} 0%, ${darkTheme.background.secondary} 100%)`,
        color: darkTheme.text.primary,
        pb: { xs: 10, sm: 4 },
      }}
    >
      {/* 모바일 헤더 */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: alpha(darkTheme.background.secondary, 0.95),
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${alpha(darkTheme.text.secondary, 0.1)}`,
          px: 2,
          py: 1.5,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton
              onClick={() => navigate('/player/dashboard')}
              sx={{
                color: darkTheme.text.secondary,
                '&:hover': {
                  bgcolor: alpha(darkTheme.text.secondary, 0.1),
                  color: darkTheme.text.primary,
                },
              }}
            >
              <BackIcon />
            </IconButton>
            <TrophyIcon sx={{ color: darkTheme.accent.gold, fontSize: '1.5rem' }} />
            <Typography variant="h6" fontWeight="600" color={darkTheme.text.primary}>
              {t('navigation.rankings')}
            </Typography>
          </Stack>
          <LanguageSelector darkMode={true} />
        </Stack>
      </Box>

      <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 }, pt: 2 }}>

        {/* 필터 */}
        <Paper
          sx={{
            p: 3,
            mb: 3,
            bgcolor: darkTheme.card.elevated,
            border: `1px solid ${alpha(darkTheme.text.secondary, 0.1)}`,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" fontWeight="bold" gutterBottom color={darkTheme.text.primary}>
            {t('player.rankings.filter')}
          </Typography>
          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: darkTheme.text.secondary }}>
                {t('player.profile.skillLevel')}
              </InputLabel>
              <Select
                value={filters.skillLevel}
                onChange={handleFilterChange('skillLevel')}
                label={t('player.profile.skillLevel')}
                sx={{
                  color: darkTheme.text.primary,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha(darkTheme.text.secondary, 0.3),
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: darkTheme.accent.primary,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: darkTheme.accent.primary,
                  },
                  '& .MuiSelect-icon': {
                    color: darkTheme.text.secondary,
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: darkTheme.background.secondary,
                      color: darkTheme.text.primary,
                      border: `1px solid ${alpha(darkTheme.text.secondary, 0.2)}`,
                    },
                  },
                }}
              >
                <MenuItem value="" sx={{ color: darkTheme.text.primary }}>{t('common.all')}</MenuItem>
                <MenuItem value="a_class" sx={{ color: darkTheme.text.primary }}>{t('tournament.skillLevel.expert')}</MenuItem>
                <MenuItem value="b_class" sx={{ color: darkTheme.text.primary }}>{t('tournament.skillLevel.advanced')}</MenuItem>
                <MenuItem value="c_class" sx={{ color: darkTheme.text.primary }}>{t('tournament.skillLevel.intermediate')}</MenuItem>
                <MenuItem value="d_class" sx={{ color: darkTheme.text.primary }}>{t('tournament.skillLevel.beginner')}</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel sx={{ color: darkTheme.text.secondary }}>
                {t('player.profile.province')}
              </InputLabel>
              <Select
                value={filters.province}
                onChange={handleFilterChange('province')}
                label={t('player.profile.province')}
                sx={{
                  color: darkTheme.text.primary,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha(darkTheme.text.secondary, 0.3),
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: darkTheme.accent.primary,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: darkTheme.accent.primary,
                  },
                  '& .MuiSelect-icon': {
                    color: darkTheme.text.secondary,
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: darkTheme.background.secondary,
                      color: darkTheme.text.primary,
                      border: `1px solid ${alpha(darkTheme.text.secondary, 0.2)}`,
                    },
                  },
                }}
              >
                <MenuItem value="" sx={{ color: darkTheme.text.primary }}>{t('common.all')}</MenuItem>
                <MenuItem value="호치민시" sx={{ color: darkTheme.text.primary }}>{t('player.rankings.hoChiMinh')}</MenuItem>
                <MenuItem value="하노이" sx={{ color: darkTheme.text.primary }}>{t('player.rankings.hanoi')}</MenuItem>
                <MenuItem value="다낭" sx={{ color: darkTheme.text.primary }}>{t('player.rankings.danang')}</MenuItem>
                <MenuItem value="부산" sx={{ color: darkTheme.text.primary }}>{t('player.rankings.busan')}</MenuItem>
                <MenuItem value="서울시" sx={{ color: darkTheme.text.primary }}>{t('player.rankings.seoul')}</MenuItem>
              </Select>
            </FormControl>

            <Stack direction="row" spacing={1}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: darkTheme.text.secondary }}>
                  {t('player.rankings.displayCount')}
                </InputLabel>
                <Select
                  value={filters.limit}
                  onChange={handleFilterChange('limit')}
                  label={t('player.rankings.displayCount')}
                  sx={{
                    color: darkTheme.text.primary,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(darkTheme.text.secondary, 0.3),
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: darkTheme.accent.primary,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: darkTheme.accent.primary,
                    },
                    '& .MuiSelect-icon': {
                      color: darkTheme.text.secondary,
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: darkTheme.background.secondary,
                        color: darkTheme.text.primary,
                        border: `1px solid ${alpha(darkTheme.text.secondary, 0.2)}`,
                      },
                    },
                  }}
                >
                  <MenuItem value={20} sx={{ color: darkTheme.text.primary }}>{t('player.rankings.top20')}</MenuItem>
                  <MenuItem value={50} sx={{ color: darkTheme.text.primary }}>{t('player.rankings.top50')}</MenuItem>
                  <MenuItem value={100} sx={{ color: darkTheme.text.primary }}>{t('player.rankings.top100')}</MenuItem>
                </Select>
              </FormControl>
              
              <Button 
                variant="outlined" 
                onClick={() => refetch()}
                sx={{
                  minWidth: 120,
                  borderColor: alpha(darkTheme.text.secondary, 0.3),
                  color: darkTheme.text.secondary,
                  '&:hover': {
                    borderColor: darkTheme.accent.primary,
                    color: darkTheme.accent.primary,
                    bgcolor: alpha(darkTheme.accent.primary, 0.1),
                  },
                }}
              >
                {t('player.rankings.refresh')}
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {/* 로딩/에러 처리 */}
        {isLoading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress sx={{ color: darkTheme.accent.primary }} />
          </Box>
        )}

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              bgcolor: alpha(darkTheme.accent.error, 0.1),
              color: darkTheme.accent.error,
              border: `1px solid ${alpha(darkTheme.accent.error, 0.3)}`,
              '& .MuiAlert-icon': {
                color: darkTheme.accent.error,
              },
            }}
          >
            {t('player.rankings.errorLoading')}
          </Alert>
        )}

        {/* 랭킹 헤더 정보 */}
        {rankingsData?.data && (
          <>
            <Box sx={{ mb: 3, p: 2, bgcolor: alpha(darkTheme.accent.primary, 0.1), borderRadius: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body1" fontWeight="600" color={darkTheme.text.primary}>
                  {t('player.rankings.totalPlayers', { count: rankingsData.data.players.length })}
                </Typography>
                <Typography variant="caption" color={darkTheme.text.secondary}>
                  {t('player.rankings.lastUpdated', { date: formatDate(rankingsData.data.meta.lastUpdated) })}
                </Typography>
              </Stack>
            </Box>

            {/* 랭킹 카드 목록 */}
            <Stack spacing={2}>
              {rankingsData.data.players.map((player, index) => (
                <Card
                  key={index}
                  sx={{
                    background: player.rank <= 3 
                      ? `linear-gradient(135deg, ${darkTheme.card.elevated} 0%, ${alpha(darkTheme.accent.gold, 0.1)} 100%)`
                      : darkTheme.card.elevated,
                    border: player.rank <= 3 
                      ? `2px solid ${alpha(darkTheme.accent.gold, 0.3)}`
                      : `1px solid ${alpha(darkTheme.text.secondary, 0.1)}`,
                    borderRadius: 3,
                    overflow: 'hidden',
                    position: 'relative',
                    '&::before': player.rank <= 3 ? {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: `linear-gradient(90deg, ${darkTheme.accent.gold}, ${darkTheme.accent.secondary})`
                    } : {},
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    {/* 상단: 순위, 이름, ELO */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: player.rank <= 3 
                            ? `linear-gradient(135deg, ${darkTheme.accent.gold}, ${darkTheme.accent.secondary})`
                            : alpha(darkTheme.accent.primary, 0.2),
                          color: player.rank <= 3 ? darkTheme.background.primary : darkTheme.accent.primary,
                          fontWeight: 'bold',
                          fontSize: '1.1rem'
                        }}>
                          {player.rank <= 3 ? getRankIcon(player.rank) : player.rank}
                        </Box>
                        <Stack>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Avatar sx={{ 
                              bgcolor: darkTheme.accent.primary, 
                              width: 32, 
                              height: 32,
                              fontSize: '0.9rem'
                            }}>
                              {player.name.charAt(0)}
                            </Avatar>
                            <Typography variant="h6" fontWeight="bold" color={darkTheme.text.primary}>
                              {player.name}
                            </Typography>
                          </Stack>
                          <Typography variant="body2" color={darkTheme.text.secondary} sx={{ fontSize: '0.8rem' }}>
                            {player.province} · {player.district}
                          </Typography>
                        </Stack>
                      </Stack>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h4" fontWeight="bold" color={darkTheme.accent.gold}>
                          {player.eloRating}
                        </Typography>
                        <Typography variant="caption" color={darkTheme.text.secondary}>
                          ELO RATING
                        </Typography>
                      </Box>
                    </Stack>

                    {/* 스킬 레벨 */}
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        size="small"
                        label={getSkillLevelDisplay(player.skillLevel).label}
                        sx={{
                          bgcolor: alpha(
                            player.skillLevel === 'a_class' ? darkTheme.accent.error :
                            player.skillLevel === 'b_class' ? darkTheme.accent.warning :
                            player.skillLevel === 'c_class' ? darkTheme.accent.primary :
                            darkTheme.accent.success, 0.2
                          ),
                          color: player.skillLevel === 'a_class' ? darkTheme.accent.error :
                                 player.skillLevel === 'b_class' ? darkTheme.accent.warning :
                                 player.skillLevel === 'c_class' ? darkTheme.accent.primary :
                                 darkTheme.accent.success,
                          border: `1px solid ${alpha(
                            player.skillLevel === 'a_class' ? darkTheme.accent.error :
                            player.skillLevel === 'b_class' ? darkTheme.accent.warning :
                            player.skillLevel === 'c_class' ? darkTheme.accent.primary :
                            darkTheme.accent.success, 0.3
                          )}`,
                        }}
                      />
                    </Box>

                    {/* 통계 정보 */}
                    <Stack spacing={2}>
                      <Stack direction="row" justifyContent="space-between">
                        <Stack spacing={1} sx={{ flex: 1 }}>
                          <Typography variant="body2" color={darkTheme.text.secondary} sx={{ fontSize: '0.8rem' }}>
                            {t('player.rankings.matchRecords')}
                          </Typography>
                          <Typography variant="body2" color={darkTheme.text.primary} sx={{ fontWeight: 600 }}>
                            {player.totalMatches} {t('player.rankings.matches')}
                          </Typography>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Typography variant="caption" color={darkTheme.accent.success}>
                              {player.wins}{t('player.profile.wins')}
                            </Typography>
                            <Typography variant="caption" color={darkTheme.text.secondary}>/</Typography>
                            <Typography variant="caption" color={darkTheme.accent.error}>
                              {player.losses}{t('player.profile.losses')}
                            </Typography>
                          </Stack>
                        </Stack>

                        <Stack spacing={1} sx={{ flex: 1 }}>
                          <Typography variant="body2" color={darkTheme.text.secondary} sx={{ fontSize: '0.8rem' }}>
                            {t('player.profile.winRate')}
                          </Typography>
                          <Typography variant="h6" fontWeight="bold" color={darkTheme.accent.success}>
                            {player.winRate.toFixed(1)}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={player.winRate}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: alpha(darkTheme.text.secondary, 0.2),
                              '& .MuiLinearProgress-bar': {
                                bgcolor: player.winRate >= 80 ? darkTheme.accent.success :
                                         player.winRate >= 60 ? darkTheme.accent.warning :
                                         darkTheme.accent.error,
                                borderRadius: 3
                              }
                            }}
                          />
                        </Stack>

                        <Stack spacing={1} sx={{ flex: 1 }}>
                          <Typography variant="body2" color={darkTheme.text.secondary} sx={{ fontSize: '0.8rem' }}>
                            {t('player.rankings.consistency')}
                          </Typography>
                          <Typography variant="body1" fontWeight="600" color={darkTheme.text.primary}>
                            {player.consistencyIndex.toFixed(1)}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={player.consistencyIndex}
                            sx={{
                              height: 4,
                              borderRadius: 2,
                              bgcolor: alpha(darkTheme.text.secondary, 0.2),
                              '& .MuiLinearProgress-bar': {
                                bgcolor: player.consistencyIndex >= 80 ? darkTheme.accent.success :
                                         player.consistencyIndex >= 60 ? darkTheme.accent.warning :
                                         darkTheme.accent.error,
                                borderRadius: 2
                              }
                            }}
                          />
                        </Stack>
                      </Stack>

                      {/* 마지막 경기 */}
                      <Box sx={{ 
                        p: 1.5, 
                        bgcolor: alpha(darkTheme.background.primary, 0.3), 
                        borderRadius: 1,
                        textAlign: 'center'
                      }}>
                        <Typography variant="caption" color={darkTheme.text.secondary}>
                          {t('player.rankings.lastMatch')}: {formatDate(player.lastMatchDate)}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>

            {/* 설명 섹션 */}
            <Box sx={{ 
              mt: 3, 
              p: 3, 
              bgcolor: alpha(darkTheme.accent.secondary, 0.1), 
              borderRadius: 2,
              border: `1px solid ${alpha(darkTheme.accent.secondary, 0.2)}`
            }}>
              <Typography variant="body2" color={darkTheme.text.primary} sx={{ lineHeight: 1.8 }}>
                <strong style={{ color: darkTheme.accent.secondary }}>{t('player.rankings.explanationTitle')}</strong>
                <br />
                • <strong style={{ color: darkTheme.text.accent }}>{t('player.rankings.eloExplanation')}</strong>
                <br />
                • <strong style={{ color: darkTheme.text.accent }}>{t('player.rankings.consistencyExplanation')}</strong>
                <br />
                • <strong style={{ color: darkTheme.text.accent }}>{t('player.rankings.rankExplanation')}</strong>
              </Typography>
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
};

export default PlayerRankings;