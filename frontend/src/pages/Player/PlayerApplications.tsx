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
  Divider,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Stack,
  alpha,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  EmojiEvents as TrophyIcon,
  Cancel as CancelIcon,
  CheckCircle as ApprovedIcon,
  Schedule as PendingIcon,
  Error as RejectedIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import {
  useGetPlayerApplicationsQuery,
  useCancelApplicationMutation,
} from '../../store/api/playerApiSlice';
import LanguageSelector from '../../components/LanguageSelector/LanguageSelector';

const PlayerApplications: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [cancelApplication] = useCancelApplicationMutation();
  
  const [tabValue, setTabValue] = useState(0);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);

  const {
    data: applicationsData,
    isLoading,
    error,
    refetch,
  } = useGetPlayerApplicationsQuery({});

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCancelClick = (application: any) => {
    setSelectedApplication(application);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedApplication) return;

    try {
      const result = await cancelApplication(selectedApplication.id).unwrap();
      
      if (result.success) {
        setCancelDialogOpen(false);
        setSelectedApplication(null);
        refetch();
        alert(t('player.applications.cancelSuccess', { defaultValue: 'Application cancelled successfully.' }));
      }
    } catch (err: any) {
      console.error('Application cancel error:', err);
      alert(err.data?.message || t('player.applications.cancelError', { defaultValue: 'An error occurred while cancelling application.' }));
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <ApprovedIcon color="success" />;
      case 'pending':
        return <PendingIcon color="warning" />;
      case 'rejected':
        return <RejectedIcon color="error" />;
      default:
        return <PendingIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return t('player.applications.approved');
      case 'pending': return t('player.applications.pending');
      case 'rejected': return t('player.applications.rejected');
      default: return status;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      case 'refunded': return 'info';
      default: return 'default';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'completed': return t('player.applications.paid');
      case 'pending': return t('player.applications.unpaid');
      case 'failed': return t('player.applications.paymentFailed', { defaultValue: 'Payment Failed' });
      case 'refunded': return t('player.applications.refunded', { defaultValue: 'Refunded' });
      default: return status;
    }
  };

  const getEventTypeText = (eventType: string) => {
    switch (eventType) {
      case 'singles': return t('player.bracket.singles');
      case 'doubles': return t('player.bracket.doubles');
      case 'mixed': return t('player.applications.mixed', { defaultValue: 'Mixed Doubles' });
      default: return eventType;
    }
  };

  const filterApplications = (applications: any[]) => {
    switch (tabValue) {
      case 0: return applications; // 전체
      case 1: return applications.filter(app => app.approvalStatus === 'pending');
      case 2: return applications.filter(app => app.approvalStatus === 'approved');
      case 3: return applications.filter(app => app.approvalStatus === 'rejected');
      default: return applications;
    }
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
          {t('player.applications.errorLoadingApplications', { defaultValue: 'Failed to load applications. Please try again.' })}
        </Alert>
      </Container>
    );
  }

  const applications = applicationsData?.data?.applications || [];
  const filteredApplications = filterApplications(applications);

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
            <Typography variant="h6" fontWeight="600" color={darkTheme.text.primary}>
              {t('player.applications.title')}
            </Typography>
          </Stack>
          <LanguageSelector darkMode={true} />
        </Stack>
      </Box>

      <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 }, pt: 2 }}>

        {/* 탭 메뉴 */}
        <Paper
          sx={{
            mb: 3,
            bgcolor: darkTheme.card.elevated,
            border: `1px solid ${alpha(darkTheme.text.secondary, 0.1)}`,
            borderRadius: 2,
          }}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                color: darkTheme.text.secondary,
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                minWidth: { xs: 'auto', sm: 160 },
                '&.Mui-selected': {
                  color: darkTheme.accent.primary,
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: darkTheme.accent.primary,
              },
            }}
          >
            <Tab label={`${t('common.all')} (${applications.length})`} />
            <Tab label={`${t('player.applications.pending')} (${applications.filter(app => app.approvalStatus === 'pending').length})`} />
            <Tab label={`${t('player.applications.approved')} (${applications.filter(app => app.approvalStatus === 'approved').length})`} />
            <Tab label={`${t('player.applications.rejected')} (${applications.filter(app => app.approvalStatus === 'rejected').length})`} />
          </Tabs>
        </Paper>

        {/* 신청 내역 */}
        {filteredApplications.length === 0 ? (
          <Alert
            severity="info"
            sx={{
              bgcolor: alpha(darkTheme.accent.secondary, 0.1),
              color: darkTheme.accent.secondary,
              border: `1px solid ${alpha(darkTheme.accent.secondary, 0.3)}`,
            }}
          >
            {tabValue === 0 ? t('player.applications.noApplications') : t('player.applications.noApplicationsForStatus', { defaultValue: 'No applications with this status.' })}
          </Alert>
        ) : (
          <Stack spacing={2}>
            {filteredApplications.map((application) => (
              <Card
                key={application.id}
                sx={{
                  background: darkTheme.card.elevated,
                  border: `1px solid ${alpha(darkTheme.text.secondary, 0.1)}`,
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold" color={darkTheme.text.primary} sx={{ flex: 1, mr: 1 }}>
                      {application.tournament.name}
                    </Typography>
                    <Stack spacing={1}>
                      <Chip
                        size="small"
                        label={getStatusText(application.approvalStatus)}
                        sx={{
                          bgcolor: alpha(
                            application.approvalStatus === 'approved' ? darkTheme.accent.success :
                            application.approvalStatus === 'pending' ? darkTheme.accent.warning :
                            darkTheme.accent.error, 0.2
                          ),
                          color: application.approvalStatus === 'approved' ? darkTheme.accent.success :
                                 application.approvalStatus === 'pending' ? darkTheme.accent.warning :
                                 darkTheme.accent.error,
                          border: `1px solid ${alpha(
                            application.approvalStatus === 'approved' ? darkTheme.accent.success :
                            application.approvalStatus === 'pending' ? darkTheme.accent.warning :
                            darkTheme.accent.error, 0.3
                          )}`,
                          fontSize: '0.7rem'
                        }}
                      />
                      <Chip
                        size="small"
                        label={getPaymentStatusText(application.paymentStatus)}
                        sx={{
                          bgcolor: alpha(
                            application.paymentStatus === 'completed' ? darkTheme.accent.success :
                            application.paymentStatus === 'pending' ? darkTheme.accent.warning :
                            application.paymentStatus === 'failed' ? darkTheme.accent.error :
                            darkTheme.accent.secondary, 0.2
                          ),
                          color: application.paymentStatus === 'completed' ? darkTheme.accent.success :
                                 application.paymentStatus === 'pending' ? darkTheme.accent.warning :
                                 application.paymentStatus === 'failed' ? darkTheme.accent.error :
                                 darkTheme.accent.secondary,
                          border: `1px solid ${alpha(
                            application.paymentStatus === 'completed' ? darkTheme.accent.success :
                            application.paymentStatus === 'pending' ? darkTheme.accent.warning :
                            application.paymentStatus === 'failed' ? darkTheme.accent.error :
                            darkTheme.accent.secondary, 0.3
                          )}`,
                          fontSize: '0.7rem'
                        }}
                      />
                    </Stack>
                  </Stack>

                  <Stack spacing={1}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ fontSize: '1rem' }}>🏆</Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color={darkTheme.text.secondary} sx={{ fontSize: '0.8rem' }}>
                          {t('player.applications.eventType')}
                        </Typography>
                        <Typography variant="body2" color={darkTheme.text.primary} sx={{ fontWeight: 600 }}>
                          {getEventTypeText(application.eventType)}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ fontSize: '1rem' }}>📍</Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color={darkTheme.text.secondary} sx={{ fontSize: '0.8rem' }}>
                          {t('player.matches.location')}
                        </Typography>
                        <Typography variant="body2" color={darkTheme.text.primary} sx={{ fontWeight: 600 }}>
                          {application.tournament.location}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ fontSize: '1rem' }}>📅</Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color={darkTheme.text.secondary} sx={{ fontSize: '0.8rem' }}>
                          {t('player.tournaments.startDate')}
                        </Typography>
                        <Typography variant="body2" color={darkTheme.text.primary} sx={{ fontWeight: 600 }}>
                          {formatDate(application.tournament.startDate)}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ fontSize: '1rem' }}>💰</Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color={darkTheme.text.secondary} sx={{ fontSize: '0.8rem' }}>
                          {t('player.tournaments.fee')}
                        </Typography>
                        <Typography variant="body2" color={darkTheme.accent.gold} sx={{ fontWeight: 600 }}>
                          {formatCurrency(application.tournament.participantFee)}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ fontSize: '1rem' }}>📋</Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color={darkTheme.text.secondary} sx={{ fontSize: '0.8rem' }}>
                          {t('player.applications.registrationDate')}
                        </Typography>
                        <Typography variant="body2" color={darkTheme.text.primary} sx={{ fontWeight: 600 }}>
                          {formatDate(application.registrationDate)}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ fontSize: '1rem' }}>🎯</Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color={darkTheme.text.secondary} sx={{ fontSize: '0.8rem' }}>
                          {t('player.applications.registrationElo', { defaultValue: 'Registration ELO' })}
                        </Typography>
                        <Typography variant="body2" color={darkTheme.accent.gold} sx={{ fontWeight: 600 }}>
                          {application.registrationElo}
                        </Typography>
                      </Box>
                    </Stack>

                    {application.partnerPlayer && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box sx={{ fontSize: '1rem' }}>👥</Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" color={darkTheme.text.secondary} sx={{ fontSize: '0.8rem' }}>
                            {t('player.applications.partner', { defaultValue: 'Partner' })}
                          </Typography>
                          <Typography variant="body2" color={darkTheme.text.primary} sx={{ fontWeight: 600 }}>
                            {`${application.partnerPlayer.name} (ELO: ${application.partnerPlayer.eloRating})`}
                          </Typography>
                        </Box>
                      </Stack>
                    )}
                  </Stack>

                  <Divider sx={{ 
                    my: 2,
                    borderColor: alpha(darkTheme.text.secondary, 0.2),
                  }} />

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {application.approvalStatus === 'pending' && (
                      <Button
                        variant="outlined"
                        startIcon={<CancelIcon />}
                        onClick={() => handleCancelClick(application)}
                        size="small"
                        sx={{
                          borderColor: alpha(darkTheme.accent.error, 0.5),
                          color: darkTheme.accent.error,
                          '&:hover': {
                            borderColor: darkTheme.accent.error,
                            bgcolor: alpha(darkTheme.accent.error, 0.1),
                          },
                        }}
                      >
                        {t('player.applications.cancel')}
                      </Button>
                    )}
                    
                    {application.approvalStatus === 'approved' && application.paymentStatus === 'pending' && (
                      <Button
                        variant="contained"
                        startIcon={<PaymentIcon />}
                        size="small"
                        sx={{
                          bgcolor: darkTheme.accent.success,
                          '&:hover': {
                            bgcolor: alpha(darkTheme.accent.success, 0.8),
                          },
                        }}
                      >
                        {t('player.applications.makePayment', { defaultValue: 'Make Payment' })}
                      </Button>
                    )}

                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate(`/player/tournament/${application.tournament.id}`)}
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
                      {t('player.applications.viewTournament', { defaultValue: 'View Tournament' })}
                    </Button>

                    {application.approvalStatus === 'approved' && (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => navigate(`/player/tournament/${application.tournament.id}/bracket`)}
                        sx={{
                          bgcolor: darkTheme.accent.primary,
                          '&:hover': {
                            bgcolor: alpha(darkTheme.accent.primary, 0.8),
                          },
                        }}
                      >
                        {t('player.matches.viewBracket')}
                      </Button>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}

        {/* 취소 확인 다이얼로그 */}
        <Dialog 
          open={cancelDialogOpen} 
          onClose={() => setCancelDialogOpen(false)}
          PaperProps={{
            sx: {
              bgcolor: darkTheme.background.secondary,
              color: darkTheme.text.primary,
              border: `1px solid ${alpha(darkTheme.text.secondary, 0.2)}`,
            },
          }}
        >
          <DialogTitle sx={{ color: darkTheme.text.primary }}>
            {t('player.applications.cancelTitle', { defaultValue: 'Cancel Application' })}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ color: darkTheme.text.primary }}>
              {t('player.applications.cancelConfirm', { 
                defaultValue: 'Are you sure you want to cancel your application for {{tournamentName}}?',
                tournamentName: selectedApplication?.tournament?.name 
              })}
            </Typography>
            <Alert 
              severity="warning" 
              sx={{ 
                mt: 2,
                bgcolor: alpha(darkTheme.accent.warning, 0.1),
                color: darkTheme.accent.warning,
                border: `1px solid ${alpha(darkTheme.accent.warning, 0.3)}`,
                '& .MuiAlert-icon': {
                  color: darkTheme.accent.warning,
                },
              }}
            >
              {t('player.applications.cancelWarning', { defaultValue: 'After cancellation, you will need to reapply. If payment is completed, refund process will be initiated.' })}
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setCancelDialogOpen(false)}
              sx={{
                color: darkTheme.text.secondary,
                '&:hover': {
                  bgcolor: alpha(darkTheme.text.secondary, 0.1),
                },
              }}
            >
              {t('player.applications.no', { defaultValue: 'No' })}
            </Button>
            <Button
              variant="contained"
              onClick={handleCancelConfirm}
              sx={{
                bgcolor: darkTheme.accent.error,
                '&:hover': {
                  bgcolor: alpha(darkTheme.accent.error, 0.8),
                },
              }}
            >
              {t('player.applications.yesCancel', { defaultValue: 'Yes, Cancel' })}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default PlayerApplications;