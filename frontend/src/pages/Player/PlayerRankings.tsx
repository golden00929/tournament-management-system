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
        <Typography variant="h4" fontWeight="bold" sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrophyIcon fontSize="large" color="primary" />
          {t('navigation.rankings')}
        </Typography>
        <LanguageSelector />
      </Box>

      {/* 필터 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {t('player.rankings.filter')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
          <Box sx={{ flex: 1 }}>
            <FormControl fullWidth>
              <InputLabel>{t('player.profile.skillLevel')}</InputLabel>
              <Select
                value={filters.skillLevel}
                onChange={handleFilterChange('skillLevel')}
                label={t('player.profile.skillLevel')}
              >
                <MenuItem value="">{t('common.all')}</MenuItem>
                <MenuItem value="a_class">{t('tournament.skillLevel.expert')}</MenuItem>
                <MenuItem value="b_class">{t('tournament.skillLevel.advanced')}</MenuItem>
                <MenuItem value="c_class">{t('tournament.skillLevel.intermediate')}</MenuItem>
                <MenuItem value="d_class">{t('tournament.skillLevel.beginner')}</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ flex: 1 }}>
            <FormControl fullWidth>
              <InputLabel>{t('player.profile.province')}</InputLabel>
              <Select
                value={filters.province}
                onChange={handleFilterChange('province')}
                label={t('player.profile.province')}
              >
                <MenuItem value="">{t('common.all')}</MenuItem>
                <MenuItem value="호치민시">{t('player.rankings.hoChiMinh')}</MenuItem>
                <MenuItem value="하노이">{t('player.rankings.hanoi')}</MenuItem>
                <MenuItem value="다낭">{t('player.rankings.danang')}</MenuItem>
                <MenuItem value="부산">{t('player.rankings.busan')}</MenuItem>
                <MenuItem value="서울시">{t('player.rankings.seoul')}</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ flex: 1 }}>
            <FormControl fullWidth>
              <InputLabel>{t('player.rankings.displayCount')}</InputLabel>
              <Select
                value={filters.limit}
                onChange={handleFilterChange('limit')}
                label={t('player.rankings.displayCount')}
              >
                <MenuItem value={20}>{t('player.rankings.top20')}</MenuItem>
                <MenuItem value={50}>{t('player.rankings.top50')}</MenuItem>
                <MenuItem value={100}>{t('player.rankings.top100')}</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Button 
            variant="outlined" 
            onClick={() => refetch()}
            sx={{ minWidth: 120 }}
          >
            {t('player.rankings.refresh')}
          </Button>
        </Box>
      </Paper>

      {/* 로딩/에러 처리 */}
      {isLoading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {t('player.rankings.errorLoading')}
        </Alert>
      )}

      {/* 랭킹 테이블 */}
      {rankingsData?.data && (
        <>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {t('player.rankings.totalPlayers', { count: rankingsData.data.players.length })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('player.rankings.lastUpdated', { date: formatDate(rankingsData.data.meta.lastUpdated) })}
            </Typography>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>{t('player.rankings.rank')}</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>{t('player.rankings.player')}</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>{t('player.profile.province')}</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>{t('player.profile.skillLevel')}</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ELO</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>{t('player.profile.totalMatches')}</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>{t('player.profile.winRate')}</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>{t('player.rankings.consistency')}</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>{t('player.rankings.lastMatch')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rankingsData.data.players.map((player, index) => (
                  <TableRow 
                    key={index} 
                    sx={{ 
                      '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                      ...(player.rank <= 3 && { bgcolor: 'warning.light', '&:hover': { bgcolor: 'warning.main' } })
                    }}
                  >
                    <TableCell sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getRankIcon(player.rank)}
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                          {player.name.charAt(0)}
                        </Avatar>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {player.name}
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">
                        {player.province}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {player.district}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={getSkillLevelDisplay(player.skillLevel).label}
                        color={getSkillLevelDisplay(player.skillLevel).color}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography variant="h6" fontWeight="bold" color="primary">
                        {player.eloRating}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">
                        {player.totalMatches} {t('player.rankings.matches')}
                      </Typography>
                      <Typography variant="caption" color="success.main">
                        {player.wins} {t('player.profile.wins')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary"> / </Typography>
                      <Typography variant="caption" color="error.main">
                        {player.losses} {t('player.profile.losses')}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ minWidth: 80 }}>
                        <Typography variant="body2" fontWeight="bold">
                          {player.winRate.toFixed(1)}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={player.winRate}
                          color={getPerformanceColor(player.winRate)}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ minWidth: 80 }}>
                        <Typography variant="body2">
                          {player.consistencyIndex.toFixed(1)}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={player.consistencyIndex}
                          color={getPerformanceColor(player.consistencyIndex)}
                          sx={{ height: 4, borderRadius: 2 }}
                        />
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(player.lastMatchDate)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="body2" color="info.dark">
              <strong>{t('player.rankings.explanationTitle', { defaultValue: '💡 Ranking Explanation:' })}</strong>
              <br />
              • <strong>{t('player.rankings.eloExplanation', { defaultValue: 'ELO Rating: Score representing player skill (1200 is average)' })}</strong>
              <br />
              • <strong>{t('player.rankings.consistencyExplanation', { defaultValue: 'Consistency Index: Degree of consistent performance (out of 100)' })}</strong>
              <br />
              • <strong>{t('player.rankings.rankExplanation', { defaultValue: 'Rank: Based on ELO rating, compared within same skill level' })}</strong>
            </Typography>
          </Box>
        </>
      )}
    </Container>
  );
};

export default PlayerRankings;