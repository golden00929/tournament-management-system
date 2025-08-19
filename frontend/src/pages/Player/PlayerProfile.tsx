import React, { useState, useEffect } from 'react';
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
  Alert,
  Divider,
  Avatar,
  CircularProgress,
  Chip,
  IconButton,
  Stack,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import {
  useGetPlayerProfileQuery,
  useUpdatePlayerProfileMutation,
} from '../../store/api/playerApiSlice';
import LanguageSelector from '../../components/LanguageSelector/LanguageSelector';

const PlayerProfile: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [updateProfile] = useUpdatePlayerProfileMutation();

  const {
    data: profileData,
    isLoading,
    error,
    refetch,
  } = useGetPlayerProfileQuery();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    province: '',
    district: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
  });

  const [updateStatus, setUpdateStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  useEffect(() => {
    if (profileData?.data) {
      const profile = profileData.data;
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        province: profile.province || '',
        district: profile.district || '',
        address: profile.address || '',
        emergencyContact: profile.emergencyContact || '',
        emergencyPhone: profile.emergencyPhone || '',
      });
    }
  }, [profileData]);

  const handleInputChange = (field: string) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setUpdateStatus({ type: null, message: '' });

    try {
      const result = await updateProfile(formData).unwrap();
      
      if (result.success) {
        setUpdateStatus({
          type: 'success',
          message: t('common.profileUpdateSuccess', { defaultValue: 'Profile updated successfully.' }),
        });
        refetch(); // 데이터 새로고침
      }
    } catch (err: any) {
      console.error('Profile update error:', err);
      setUpdateStatus({
        type: 'error',
        message: err.data?.message || t('common.profileUpdateError', { defaultValue: 'An error occurred while updating profile.' }),
      });
    }
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

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          {t('common.errorLoadingProfile')}
        </Alert>
      </Container>
    );
  }

  const profile = profileData?.data;

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
            <PersonIcon sx={{ color: darkTheme.accent.primary, fontSize: '1.5rem' }} />
            <Typography variant="h6" fontWeight="600" color={darkTheme.text.primary}>
              {t('player.profile.title')}
            </Typography>
          </Stack>
          <LanguageSelector darkMode={true} />
        </Stack>
      </Box>

      <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 }, pt: 2 }}>

        {updateStatus.type && (
          <Alert 
            severity={updateStatus.type} 
            sx={{ 
              mb: 3,
              bgcolor: alpha(
                updateStatus.type === 'success' ? darkTheme.accent.success : darkTheme.accent.error, 
                0.1
              ),
              color: updateStatus.type === 'success' ? darkTheme.accent.success : darkTheme.accent.error,
              border: `1px solid ${alpha(
                updateStatus.type === 'success' ? darkTheme.accent.success : darkTheme.accent.error, 
                0.3
              )}`,
              '& .MuiAlert-icon': {
                color: updateStatus.type === 'success' ? darkTheme.accent.success : darkTheme.accent.error,
              },
            }}
            onClose={() => setUpdateStatus({ type: null, message: '' })}
          >
            {updateStatus.message}
          </Alert>
        )}

        {/* 프로필 기본 정보 카드 */}
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
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                mx: 'auto',
                mb: 2,
                bgcolor: darkTheme.accent.primary,
                fontSize: '2rem',
                boxShadow: `0 0 20px ${alpha(darkTheme.accent.primary, 0.3)}`
              }}
            >
              {profile?.name?.charAt(0)}
            </Avatar>
            
            <Typography variant="h5" fontWeight="bold" gutterBottom color={darkTheme.text.primary}>
              {profile?.name}
            </Typography>
            
            <Typography variant="body2" color={darkTheme.text.secondary} gutterBottom>
              {profile?.email}
            </Typography>

            <Chip
              label={getSkillLevelDisplay(profile?.skillLevel || '').label}
              sx={{ 
                mb: 3,
                bgcolor: alpha(
                  profile?.skillLevel === 'a_class' ? darkTheme.accent.error :
                  profile?.skillLevel === 'b_class' ? darkTheme.accent.warning :
                  profile?.skillLevel === 'c_class' ? darkTheme.accent.primary :
                  darkTheme.accent.success, 0.2
                ),
                color: profile?.skillLevel === 'a_class' ? darkTheme.accent.error :
                       profile?.skillLevel === 'b_class' ? darkTheme.accent.warning :
                       profile?.skillLevel === 'c_class' ? darkTheme.accent.primary :
                       darkTheme.accent.success,
                border: `1px solid ${alpha(
                  profile?.skillLevel === 'a_class' ? darkTheme.accent.error :
                  profile?.skillLevel === 'b_class' ? darkTheme.accent.warning :
                  profile?.skillLevel === 'c_class' ? darkTheme.accent.primary :
                  darkTheme.accent.success, 0.3
                )}`,
              }}
            />

            <Divider sx={{ my: 2, borderColor: alpha(darkTheme.text.secondary, 0.2) }} />

            <Stack spacing={2} sx={{ textAlign: 'left' }}>
              <Box>
                <Typography variant="caption" color={darkTheme.text.secondary}>
                  {t('player.profile.eloRating')}
                </Typography>
                <Typography variant="h4" fontWeight="bold" color={darkTheme.accent.gold}>
                  {profile?.eloRating}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color={darkTheme.text.secondary}>
                  {t('player.profile.birthYear')}
                </Typography>
                <Typography variant="body1" color={darkTheme.text.primary}>
                  {profile?.birthYear} {t('common.year', { defaultValue: 'year' })}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color={darkTheme.text.secondary}>
                  {t('player.profile.gender')}
                </Typography>
                <Typography variant="body1" color={darkTheme.text.primary}>
                  {profile?.gender === 'male' ? t('player.profile.male') : t('player.profile.female')}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color={darkTheme.text.secondary}>
                  {t('common.registrationDate', { defaultValue: 'Registration Date' })}
                </Typography>
                <Typography variant="body1" color={darkTheme.text.primary}>
                  {new Date(profile?.registrationDate || '').toLocaleDateString('vi-VN')}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* 수정 가능한 정보 폼 */}
        <Card sx={{
          background: darkTheme.card.elevated,
          border: `1px solid ${alpha(darkTheme.text.secondary, 0.1)}`,
          borderRadius: 3,
        }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <PersonIcon sx={{ color: darkTheme.accent.primary }} />
              <Typography variant="h6" fontWeight="bold" color={darkTheme.text.primary}>
                {t('player.profile.editPersonalInfo', { defaultValue: 'Edit Personal Information' })}
              </Typography>
            </Stack>
            <Typography variant="body2" color={darkTheme.text.secondary} sx={{ mb: 3 }}>
              {t('player.profile.editableInfoOnly', { defaultValue: 'Only editable information can be updated.' })}
            </Typography>

            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label={t('player.profile.name')}
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    variant="outlined"
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

                  <TextField
                    fullWidth
                    label={t('player.profile.phone')}
                    value={formData.phone}
                    onChange={handleInputChange('phone')}
                    variant="outlined"
                    placeholder="010-1234-5678"
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
                </Stack>

                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label={t('player.profile.province')}
                    value={formData.province}
                    onChange={handleInputChange('province')}
                    variant="outlined"
                    placeholder={t('common.exampleCity', { defaultValue: 'e.g. Ho Chi Minh City' })}
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

                  <TextField
                    fullWidth
                    label={t('player.profile.district')}
                    value={formData.district}
                    onChange={handleInputChange('district')}
                    variant="outlined"
                    placeholder={t('common.exampleDistrict', { defaultValue: 'e.g. District 1' })}
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
                </Stack>

                <TextField
                  fullWidth
                  label={t('player.profile.address')}
                  value={formData.address}
                  onChange={handleInputChange('address')}
                  variant="outlined"
                  placeholder={t('common.addressPlaceholder', { defaultValue: 'Enter detailed address (optional)' })}
                  multiline
                  rows={2}
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

                <Divider sx={{ borderColor: alpha(darkTheme.text.secondary, 0.2) }} />
                
                <Typography variant="h6" fontWeight="bold" color={darkTheme.text.primary}>
                  {t('player.profile.emergencyContact')}
                </Typography>

                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label={t('player.profile.emergencyContact')}
                    value={formData.emergencyContact}
                    onChange={handleInputChange('emergencyContact')}
                    variant="outlined"
                    placeholder={t('common.emergencyContactExample', { defaultValue: 'e.g. John Smith (Father)' })}
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

                  <TextField
                    fullWidth
                    label={t('player.profile.emergencyPhone')}
                    value={formData.emergencyPhone}
                    onChange={handleInputChange('emergencyPhone')}
                    variant="outlined"
                    placeholder="010-9876-5432"
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
                </Stack>

                <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end', mt: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/player/dashboard')}
                    sx={{
                      borderColor: alpha(darkTheme.text.secondary, 0.3),
                      color: darkTheme.text.secondary,
                      '&:hover': {
                        borderColor: darkTheme.accent.primary,
                        color: darkTheme.accent.primary,
                        bgcolor: alpha(darkTheme.accent.primary, 0.1),
                      },
                    }}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    sx={{
                      bgcolor: darkTheme.accent.primary,
                      '&:hover': {
                        bgcolor: alpha(darkTheme.accent.primary, 0.8),
                      },
                    }}
                  >
                    {t('common.saveProfile', { defaultValue: 'Save Profile' })}
                  </Button>
                </Stack>
              </Stack>
            </form>
            </CardContent>
          </Card>
        </Container>
      </Box>
  );
};

export default PlayerProfile;