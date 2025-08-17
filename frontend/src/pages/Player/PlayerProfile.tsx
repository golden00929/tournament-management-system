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
  Paper,
  Avatar,
  CircularProgress,
  Chip,
} from '@mui/material';
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

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* 헤더 */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={() => navigate('/player/dashboard')}
        >
          {t('player.profile.backToDashboard', { defaultValue: 'Back to Dashboard' })}
        </Button>
        <Typography variant="h4" fontWeight="bold" sx={{ flex: 1 }}>
          {t('player.profile.title')}
        </Typography>
        <LanguageSelector />
      </Box>

      {updateStatus.type && (
        <Alert 
          severity={updateStatus.type} 
          sx={{ mb: 3 }}
          onClose={() => setUpdateStatus({ type: null, message: '' })}
        >
          {updateStatus.message}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* 왼쪽: 기본 정보 (수정 불가) */}
        <Box sx={{ flex: { md: '0 0 33.333%' } }}>
          <Paper sx={{ p: 3, textAlign: 'center', height: 'fit-content' }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                mx: 'auto',
                mb: 2,
                bgcolor: 'primary.main',
                fontSize: '2rem',
              }}
            >
              {profile?.name?.charAt(0)}
            </Avatar>
            
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {profile?.name}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {profile?.email}
            </Typography>

            <Chip
              label={getSkillLevelDisplay(profile?.skillLevel || '').label}
              color={getSkillLevelDisplay(profile?.skillLevel || '').color}
              sx={{ mb: 2 }}
            />

            <Divider sx={{ my: 2 }} />

            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('player.profile.eloRating')}
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary" gutterBottom>
                {profile?.eloRating}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                {t('player.profile.birthYear')}
              </Typography>
              <Typography variant="body1" gutterBottom>
                {profile?.birthYear} {t('common.year', { defaultValue: 'year' })}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                {t('player.profile.gender')}
              </Typography>
              <Typography variant="body1" gutterBottom>
                {profile?.gender === 'male' ? t('player.profile.male') : t('player.profile.female')}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                {t('common.registrationDate', { defaultValue: 'Registration Date' })}
              </Typography>
              <Typography variant="body1">
                {new Date(profile?.registrationDate || '').toLocaleDateString('vi-VN')}
              </Typography>
            </Box>
          </Paper>
        </Box>

        {/* 오른쪽: 수정 가능한 정보 */}
        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon color="primary" />
                {t('player.profile.editPersonalInfo', { defaultValue: 'Edit Personal Information' })}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
                {t('player.profile.editableInfoOnly', { defaultValue: 'Only editable information can be updated.' })}
              </Typography>

              <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <TextField
                      fullWidth
                      label={t('player.profile.name')}
                      value={formData.name}
                      onChange={handleInputChange('name')}
                      variant="outlined"
                    />

                    <TextField
                      fullWidth
                      label={t('player.profile.phone')}
                      value={formData.phone}
                      onChange={handleInputChange('phone')}
                      variant="outlined"
                      placeholder="010-1234-5678"
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <TextField
                      fullWidth
                      label={t('player.profile.province')}
                      value={formData.province}
                      onChange={handleInputChange('province')}
                      variant="outlined"
                      placeholder={t('common.exampleCity', { defaultValue: 'e.g. Ho Chi Minh City' })}
                    />

                    <TextField
                      fullWidth
                      label={t('player.profile.district')}
                      value={formData.district}
                      onChange={handleInputChange('district')}
                      variant="outlined"
                      placeholder={t('common.exampleDistrict', { defaultValue: 'e.g. District 1' })}
                    />
                  </Box>

                  <TextField
                    fullWidth
                    label={t('player.profile.address')}
                    value={formData.address}
                    onChange={handleInputChange('address')}
                    variant="outlined"
                    placeholder={t('common.addressPlaceholder', { defaultValue: 'Enter detailed address (optional)' })}
                    multiline
                    rows={2}
                  />

                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    {t('player.profile.emergencyContact')}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <TextField
                      fullWidth
                      label={t('player.profile.emergencyContact')}
                      value={formData.emergencyContact}
                      onChange={handleInputChange('emergencyContact')}
                      variant="outlined"
                      placeholder={t('common.emergencyContactExample', { defaultValue: 'e.g. John Smith (Father)' })}
                    />

                    <TextField
                      fullWidth
                      label={t('player.profile.emergencyPhone')}
                      value={formData.emergencyPhone}
                      onChange={handleInputChange('emergencyPhone')}
                      variant="outlined"
                      placeholder="010-9876-5432"
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/player/dashboard')}
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<SaveIcon />}
                    >
                      {t('common.saveProfile', { defaultValue: 'Save Profile' })}
                    </Button>
                  </Box>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Container>
  );
};

export default PlayerProfile;