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
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  ArrowBack as BackIcon,
  Search as SearchIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  MonetizationOn as MoneyIcon,
  EmojiEvents as TrophyIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import {
  useGetPublicTournamentsQuery,
  useApplyToTournamentMutation,
} from '../../store/api/playerApiSlice';
import LanguageSelector from '../../components/LanguageSelector/LanguageSelector';

const PlayerTournaments: React.FC = () => {
  const navigate = useNavigate();
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
            {t('player.tournaments.title')}
          </Typography>
          <LanguageSelector />
        </Box>

        {/* 검색 필터 */}
        <Paper sx={{ 
          p: 3, 
          mb: 3,
          bgcolor: darkTheme.card.elevated,
          border: `1px solid ${alpha(darkTheme.text.secondary, 0.1)}`
        }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: darkTheme.text.primary }}>
            {t('player.tournaments.search', { defaultValue: 'Search Tournaments' })}
          </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Box sx={{ flex: '1 1 300px', minWidth: '200px' }}>
            <TextField
              fullWidth
              label={t('player.tournaments.searchName', { defaultValue: 'Search by name' })}
              value={searchParams.search}
              onChange={handleSearchChange('search')}
              placeholder={t('player.tournaments.searchPlaceholder', { defaultValue: 'Enter tournament name' })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: alpha(darkTheme.background.tertiary, 0.5),
                  color: darkTheme.text.primary,
                  '& fieldset': {
                    borderColor: alpha(darkTheme.text.secondary, 0.3),
                  },
                  '&:hover fieldset': {
                    borderColor: darkTheme.accent.primary,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: darkTheme.accent.primary,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: darkTheme.text.secondary,
                  '&.Mui-focused': {
                    color: darkTheme.accent.primary,
                  },
                },
              }}
            />
          </Box>
          
          <Box sx={{ flex: '1 1 150px', minWidth: '120px' }}>
            <FormControl fullWidth sx={{
              '& .MuiInputLabel-root': {
                color: darkTheme.text.secondary,
                '&.Mui-focused': {
                  color: darkTheme.accent.primary,
                },
              },
              '& .MuiOutlinedInput-root': {
                bgcolor: alpha(darkTheme.background.tertiary, 0.5),
                color: darkTheme.text.primary,
                '& fieldset': {
                  borderColor: alpha(darkTheme.text.secondary, 0.3),
                },
                '&:hover fieldset': {
                  borderColor: darkTheme.accent.primary,
                },
                '&.Mui-focused fieldset': {
                  borderColor: darkTheme.accent.primary,
                },
              },
            }}>
              <InputLabel>{t('player.tournaments.category')}</InputLabel>
              <Select
                value={searchParams.category}
                onChange={handleSearchChange('category')}
                label={t('player.tournaments.category')}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: darkTheme.card.elevated,
                      '& .MuiMenuItem-root': {
                        color: darkTheme.text.primary,
                        '&:hover': {
                          bgcolor: alpha(darkTheme.accent.primary, 0.1),
                        },
                        '&.Mui-selected': {
                          bgcolor: alpha(darkTheme.accent.primary, 0.2),
                          '&:hover': {
                            bgcolor: alpha(darkTheme.accent.primary, 0.3),
                          },
                        },
                      },
                    },
                  },
                }}
              >
                <MenuItem value="">{t('common.all')}</MenuItem>
                <MenuItem value="badminton">{t('tournament.category.badminton')}</MenuItem>
                <MenuItem value="tennis">{t('tournament.category.tennis')}</MenuItem>
                <MenuItem value="pickleball">{t('tournament.category.pickleball')}</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ flex: '1 1 150px', minWidth: '120px' }}>
            <FormControl fullWidth sx={{
              '& .MuiInputLabel-root': {
                color: darkTheme.text.secondary,
                '&.Mui-focused': {
                  color: darkTheme.accent.primary,
                },
              },
              '& .MuiOutlinedInput-root': {
                bgcolor: alpha(darkTheme.background.tertiary, 0.5),
                color: darkTheme.text.primary,
                '& fieldset': {
                  borderColor: alpha(darkTheme.text.secondary, 0.3),
                },
                '&:hover fieldset': {
                  borderColor: darkTheme.accent.primary,
                },
                '&.Mui-focused fieldset': {
                  borderColor: darkTheme.accent.primary,
                },
              },
            }}>
              <InputLabel>{t('player.tournaments.skillLevel')}</InputLabel>
              <Select
                value={searchParams.skillLevel}
                onChange={handleSearchChange('skillLevel')}
                label={t('player.tournaments.skillLevel')}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: darkTheme.card.elevated,
                      '& .MuiMenuItem-root': {
                        color: darkTheme.text.primary,
                        '&:hover': {
                          bgcolor: alpha(darkTheme.accent.primary, 0.1),
                        },
                        '&.Mui-selected': {
                          bgcolor: alpha(darkTheme.accent.primary, 0.2),
                          '&:hover': {
                            bgcolor: alpha(darkTheme.accent.primary, 0.3),
                          },
                        },
                      },
                    },
                  },
                }}
              >
                <MenuItem value="">{t('common.all')}</MenuItem>
                <MenuItem value="a_class">{t('tournament.skillLevel.expert')}</MenuItem>
                <MenuItem value="b_class">{t('tournament.skillLevel.advanced')}</MenuItem>
                <MenuItem value="c_class">{t('tournament.skillLevel.intermediate')}</MenuItem>
                <MenuItem value="d_class">{t('tournament.skillLevel.beginner')}</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ flex: '1 1 200px', minWidth: '150px' }}>
            <TextField
              fullWidth
              label={t('player.matches.location')}
              value={searchParams.location}
              onChange={handleSearchChange('location')}
              placeholder={t('player.tournaments.locationPlaceholder', { defaultValue: 'e.g. Ho Chi Minh City' })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: alpha(darkTheme.background.tertiary, 0.5),
                  color: darkTheme.text.primary,
                  '& fieldset': {
                    borderColor: alpha(darkTheme.text.secondary, 0.3),
                  },
                  '&:hover fieldset': {
                    borderColor: darkTheme.accent.primary,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: darkTheme.accent.primary,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: darkTheme.text.secondary,
                  '&.Mui-focused': {
                    color: darkTheme.accent.primary,
                  },
                },
              }}
            />
          </Box>

          <Box sx={{ flex: '0 0 auto' }}>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              sx={{ 
                height: 56, 
                px: 3,
                bgcolor: darkTheme.accent.primary,
                '&:hover': {
                  bgcolor: alpha(darkTheme.accent.primary, 0.8)
                }
              }}
            >
              {t('common.search')}
            </Button>
          </Box>
        </Box>
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
                color: darkTheme.accent.error
              }
            }}
          >
            {t('player.tournaments.errorLoading', { defaultValue: 'Failed to load tournaments. Please try again.' })}
          </Alert>
        )}

        {/* 대회 목록 */}
        {tournamentsData?.data?.tournaments && (
          <>
            <Typography variant="h6" gutterBottom sx={{ color: darkTheme.text.primary }}>
              {t('player.tournaments.searchResults', { defaultValue: 'Search Results: {{count}} tournaments', count: tournamentsData.data.tournaments.length })}
            </Typography>
            
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { 
                xs: '1fr', 
                md: 'repeat(2, 1fr)', 
                lg: 'repeat(3, 1fr)' 
              }, 
              gap: 3 
            }}>
              {tournamentsData.data.tournaments.map((tournament) => (
                <Card 
                  key={tournament.id} 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
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
                  <CardContent sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: darkTheme.text.primary }}>
                        {tournament.name}
                      </Typography>
                      {getStatusChip(tournament)}
                    </Box>

                    <Typography variant="body2" sx={{ mb: 2, minHeight: 40, color: darkTheme.text.secondary }}>
                      {tournament.description}
                    </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={tournament.category}
                      color="primary"
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                    <Chip
                      label={getSkillLevelDisplay(tournament.skillLevel).label}
                      color={getSkillLevelDisplay(tournament.skillLevel).color}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationIcon sx={{ fontSize: 16, mr: 1, color: darkTheme.text.secondary }} />
                      <Typography variant="body2" sx={{ color: darkTheme.text.secondary }}>
                        {tournament.location}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CalendarIcon sx={{ fontSize: 16, mr: 1, color: darkTheme.text.secondary }} />
                      <Typography variant="body2" sx={{ color: darkTheme.text.secondary }}>
                        {formatDate(tournament.startDate)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PeopleIcon sx={{ fontSize: 16, mr: 1, color: darkTheme.text.secondary }} />
                      <Typography variant="body2" sx={{ color: darkTheme.text.secondary }}>
                        {tournament.currentParticipants}/{tournament.maxParticipants} {t('player.tournaments.participants')}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <MoneyIcon sx={{ fontSize: 16, mr: 1, color: darkTheme.accent.gold }} />
                      <Typography variant="body2" sx={{ color: darkTheme.accent.gold, fontWeight: 600 }}>
                        {formatCurrency(tournament.participantFee)}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mt: 'auto', pt: 2 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => handleApplyClick(tournament)}
                      disabled={!tournament.isRegistrationOpen || tournament.currentParticipants >= tournament.maxParticipants}
                      sx={{
                        bgcolor: darkTheme.accent.primary,
                        '&:hover': {
                          bgcolor: alpha(darkTheme.accent.primary, 0.8)
                        },
                        '&:disabled': {
                          bgcolor: alpha(darkTheme.text.secondary, 0.3),
                          color: alpha(darkTheme.text.secondary, 0.7)
                        }
                      }}
                    >
                      {tournament.isRegistrationOpen ? t('player.tournaments.apply') : t('tournament.status.closed')}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </>
      )}

        {/* 참가 신청 다이얼로그 */}
        <Dialog 
          open={applyDialogOpen} 
          onClose={() => setApplyDialogOpen(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: darkTheme.card.elevated,
              border: `1px solid ${alpha(darkTheme.text.secondary, 0.1)}`
            }
          }}
        >
          <DialogTitle sx={{ bgcolor: darkTheme.card.elevated }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: darkTheme.text.primary }}>
              {t('player.tournaments.applyTitle', { defaultValue: 'Apply for Tournament' })}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ bgcolor: darkTheme.card.elevated }}>
            {selectedTournament && (
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ color: darkTheme.text.primary }}>
                  {selectedTournament.name}
                </Typography>
                
                <Typography variant="body2" gutterBottom sx={{ color: darkTheme.text.secondary }}>
                  📍 {selectedTournament.location} • 📅 {formatDate(selectedTournament.startDate)}
                </Typography>
                
                <Typography variant="body2" gutterBottom sx={{ mb: 3, color: darkTheme.accent.gold, fontWeight: 600 }}>
                  💰 {t('player.tournaments.fee')}: {formatCurrency(selectedTournament.participantFee)}
                </Typography>

                <FormControl fullWidth sx={{ 
                  mb: 2,
                  '& .MuiInputLabel-root': {
                    color: darkTheme.text.secondary,
                    '&.Mui-focused': {
                      color: darkTheme.accent.primary,
                    },
                  },
                  '& .MuiOutlinedInput-root': {
                    bgcolor: alpha(darkTheme.background.tertiary, 0.5),
                    color: darkTheme.text.primary,
                    '& fieldset': {
                      borderColor: alpha(darkTheme.text.secondary, 0.3),
                    },
                    '&:hover fieldset': {
                      borderColor: darkTheme.accent.primary,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: darkTheme.accent.primary,
                    },
                  },
                }}>
                  <InputLabel>{t('player.applications.eventType')}</InputLabel>
                  <Select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as string)}
                    label={t('player.applications.eventType')}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          bgcolor: darkTheme.card.elevated,
                          '& .MuiMenuItem-root': {
                            color: darkTheme.text.primary,
                            '&:hover': {
                              bgcolor: alpha(darkTheme.accent.primary, 0.1),
                            },
                            '&.Mui-selected': {
                              bgcolor: alpha(darkTheme.accent.primary, 0.2),
                              '&:hover': {
                                bgcolor: alpha(darkTheme.accent.primary, 0.3),
                              },
                            },
                          },
                        },
                      },
                    }}
                  >
                    <MenuItem value="singles">{t('player.bracket.singles')}</MenuItem>
                    <MenuItem value="doubles">{t('player.bracket.doubles')}</MenuItem>
                    <MenuItem value="mixed">{t('player.applications.mixed')}</MenuItem>
                  </Select>
                </FormControl>

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
                  {t('player.tournaments.applyNote', { defaultValue: 'Admin approval is required after application. You can check approval status in your dashboard.' })}
                </Alert>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ bgcolor: darkTheme.card.elevated }}>
            <Button 
              onClick={() => setApplyDialogOpen(false)}
              sx={{ color: darkTheme.text.secondary }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="contained"
              onClick={handleApplySubmit}
              startIcon={<TrophyIcon />}
              sx={{
                bgcolor: darkTheme.accent.primary,
                '&:hover': {
                  bgcolor: alpha(darkTheme.accent.primary, 0.8)
                }
              }}
            >
              {t('player.tournaments.applyButton', { defaultValue: 'Apply' })}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default PlayerTournaments;