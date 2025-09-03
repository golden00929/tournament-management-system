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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  MonetizationOn as MoneyIcon,
  EmojiEvents as TrophyIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import PlayerLayout from '../../components/Player/Layout/PlayerLayout';
import {
  useGetPublicTournamentsQuery,
  useApplyToTournamentMutation,
} from '../../store/api/playerApiSlice';

const PlayerTournaments: React.FC = () => {
  const { t } = useTranslation();
  const [applyToTournament] = useApplyToTournamentMutation();

  const [searchParams, setSearchParams] = useState({
    search: '',
    category: '',
    skillLevel: '',
    location: '',
    status: 'open',
  });

  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [eventType, setEventType] = useState('singles');

  const {
    data: tournamentsData,
    isLoading,
    error,
    refetch,
  } = useGetPublicTournamentsQuery({
    ...searchParams,
    page: 1,
    limit: 20,
  });

  const handleSearchChange = (field: string) => (
    event: React.ChangeEvent<HTMLInputElement> | any
  ) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: event.target.value as string,
    }));
  };

  const handleSearch = () => {
    refetch();
  };

  const handleApplyClick = (tournament: any) => {
    setSelectedTournament(tournament);
    setApplyDialogOpen(true);
  };

  const handleApplySubmit = async () => {
    if (!selectedTournament) return;

    try {
      const result = await applyToTournament({
        tournamentId: selectedTournament.id,
        eventType,
      }).unwrap();

      if (result.success) {
        setApplyDialogOpen(false);
        setSelectedTournament(null);
        // 데이터를 새로고침하여 참가 신청 상태 업데이트
        refetch();
        alert(t('player.tournaments.applySuccess'));
      }
    } catch (err: any) {
      console.error('Apply tournament error:', err);
      alert(err.data?.message || t('player.tournaments.applyError'));
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

  const getSkillLevelDisplay = (skillLevel: string) => {
    const levels = {
      'a_class': { label: t('tournament.skillLevel.expert'), color: 'error' as const },
      'b_class': { label: t('tournament.skillLevel.advanced'), color: 'warning' as const },
      'c_class': { label: t('tournament.skillLevel.intermediate'), color: 'primary' as const },
      'd_class': { label: t('tournament.skillLevel.beginner'), color: 'success' as const },
    };
    return levels[skillLevel as keyof typeof levels] || { label: skillLevel, color: 'default' as const };
  };

  const getStatusChip = (tournament: any) => {
    if (!tournament.isRegistrationOpen) {
      return <Chip label={t('tournament.status.closed')} color="error" size="small" />;
    }
    if (tournament.currentParticipants >= tournament.maxParticipants) {
      return <Chip label={t('player.tournaments.full', { defaultValue: 'Full' })} color="warning" size="small" />;
    }
    return <Chip label={t('tournament.status.open')} color="success" size="small" />;
  };

  const tournaments = tournamentsData?.data?.tournaments || [];

  return (
    <PlayerLayout>
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
          🏸 참가 가능한 대회
        </Typography>

        {/* 검색 필터 */}
        <Card sx={{ mb: 4, borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: '#FF6B35', mb: 3 }}>
              🔍 대회 검색
            </Typography>
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2} 
              sx={{ flexWrap: 'wrap' }}
            >
              <Box sx={{ flex: '1 1 250px' }}>
                <TextField
                  fullWidth
                  label="대회 이름"
                  value={searchParams.search}
                  onChange={handleSearchChange('search')}
                  placeholder="대회 이름을 입력하세요"
                />
              </Box>
              <Box sx={{ flex: '1 1 200px' }}>
                <FormControl fullWidth>
                  <InputLabel>카테고리</InputLabel>
                  <Select
                    value={searchParams.category}
                    onChange={handleSearchChange('category')}
                    label="카테고리"
                  >
                    <MenuItem value="">전체</MenuItem>
                    <MenuItem value="badminton">배드민턴</MenuItem>
                    <MenuItem value="tennis">테니스</MenuItem>
                    <MenuItem value="pickleball">피클볼</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ flex: '1 1 200px' }}>
                <FormControl fullWidth>
                  <InputLabel>실력 수준</InputLabel>
                  <Select
                    value={searchParams.skillLevel}
                    onChange={handleSearchChange('skillLevel')}
                    label="실력 수준"
                  >
                    <MenuItem value="">전체</MenuItem>
                    <MenuItem value="a_class">A급 (Expert)</MenuItem>
                    <MenuItem value="b_class">B급 (Advanced)</MenuItem>
                    <MenuItem value="c_class">C급 (Intermediate)</MenuItem>
                    <MenuItem value="d_class">D급 (Beginner)</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ flex: '0 1 150px' }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={handleSearch}
                  sx={{ 
                    height: '56px',
                    bgcolor: '#FF6B35',
                    '&:hover': { bgcolor: '#E55A2B' }
                  }}
                >
                  검색
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* 로딩/에러 처리 */}
        {isLoading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            대회 목록을 불러오는 중 오류가 발생했습니다.
          </Alert>
        )}

        {/* 대회 목록 */}
        {tournaments.length > 0 && (
          <>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              검색 결과: {tournaments.length}개 대회
            </Typography>
            
            <Stack 
              direction="row" 
              spacing={3} 
              sx={{ flexWrap: 'wrap' }}
            >
              {tournaments.map((tournament) => (
                <Box sx={{ flex: '1 1 350px', mb: 3 }} key={tournament.id}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      borderRadius: 3,
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 25px rgba(255, 107, 53, 0.2)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <CardContent sx={{ flex: 1, p: 3 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {tournament.name}
                        </Typography>
                        {getStatusChip(tournament)}
                      </Stack>

                      <Typography variant="body2" sx={{ mb: 2, minHeight: 40, color: 'text.secondary' }}>
                        {tournament.description}
                      </Typography>

                      <Box sx={{ mb: 2 }}>
                        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                          <Chip
                            label={tournament.category}
                            color="primary"
                            size="small"
                          />
                          <Chip
                            label={getSkillLevelDisplay(tournament.skillLevel).label}
                            color={getSkillLevelDisplay(tournament.skillLevel).color}
                            size="small"
                          />
                        </Stack>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Stack spacing={1}>
                          <Stack direction="row" alignItems="center">
                            <LocationIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {tournament.location}
                            </Typography>
                          </Stack>
                          
                          <Stack direction="row" alignItems="center">
                            <CalendarIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(tournament.startDate)}
                            </Typography>
                          </Stack>

                          <Stack direction="row" alignItems="center">
                            <PeopleIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {tournament.currentParticipants || 0}/{tournament.maxParticipants} 명
                            </Typography>
                          </Stack>

                          <Stack direction="row" alignItems="center">
                            <MoneyIcon sx={{ fontSize: 16, mr: 1, color: '#FF6B35' }} />
                            <Typography variant="body2" sx={{ color: '#FF6B35', fontWeight: 600 }}>
                              {formatCurrency(tournament.participantFee)}
                            </Typography>
                          </Stack>
                        </Stack>
                      </Box>

                      <Box sx={{ mt: 'auto', pt: 2 }}>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => handleApplyClick(tournament)}
                          disabled={!tournament.isRegistrationOpen || (tournament.currentParticipants || 0) >= tournament.maxParticipants}
                          sx={{
                            bgcolor: '#8E24AA',
                            '&:hover': { bgcolor: '#7B1FA2' },
                            '&:disabled': {
                              bgcolor: 'rgba(0,0,0,0.12)',
                              color: 'rgba(0,0,0,0.26)'
                            }
                          }}
                        >
                          {tournament.isRegistrationOpen ? '참가 신청' : '신청 마감'}
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Stack>
          </>
        )}

        {tournaments.length === 0 && !isLoading && !error && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <TrophyIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              참가 가능한 대회가 없습니다
            </Typography>
            <Typography variant="body2" color="text.secondary">
              검색 조건을 조정해보세요
            </Typography>
          </Box>
        )}

        {/* 참가 신청 다이얼로그 */}
        <Dialog 
          open={applyDialogOpen} 
          onClose={() => setApplyDialogOpen(false)} 
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle>
            <Typography variant="h6" fontWeight="bold">
              대회 참가 신청
            </Typography>
          </DialogTitle>
          <DialogContent>
            {selectedTournament && (
              <Box sx={{ pt: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {selectedTournament.name}
                </Typography>
                
                <Typography variant="body2" gutterBottom color="text.secondary">
                  📍 {selectedTournament.location} • 📅 {formatDate(selectedTournament.startDate)}
                </Typography>
                
                <Typography variant="body2" gutterBottom sx={{ mb: 3, color: '#FF6B35', fontWeight: 600 }}>
                  💰 참가비: {formatCurrency(selectedTournament.participantFee)}
                </Typography>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>경기 종목</InputLabel>
                  <Select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as string)}
                    label="경기 종목"
                  >
                    <MenuItem value="singles">단식</MenuItem>
                    <MenuItem value="doubles">복식</MenuItem>
                    <MenuItem value="mixed">혼합복식</MenuItem>
                  </Select>
                </FormControl>

                <Alert severity="info">
                  참가 신청 후 관리자의 승인이 필요합니다. 승인 상태는 대시보드에서 확인할 수 있습니다.
                </Alert>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setApplyDialogOpen(false)}>
              취소
            </Button>
            <Button
              variant="contained"
              onClick={handleApplySubmit}
              startIcon={<TrophyIcon />}
              sx={{
                bgcolor: '#8E24AA',
                '&:hover': { bgcolor: '#7B1FA2' }
              }}
            >
              신청하기
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </PlayerLayout>
  );
};

export default PlayerTournaments;