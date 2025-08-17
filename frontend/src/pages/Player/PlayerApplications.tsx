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
          {t('player.applications.title')}
        </Typography>
        <LanguageSelector />
      </Box>

      {/* 탭 메뉴 */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label={`${t('common.all')} (${applications.length})`} />
          <Tab label={`${t('player.applications.pending')} (${applications.filter(app => app.approvalStatus === 'pending').length})`} />
          <Tab label={`${t('player.applications.approved')} (${applications.filter(app => app.approvalStatus === 'approved').length})`} />
          <Tab label={`${t('player.applications.rejected')} (${applications.filter(app => app.approvalStatus === 'rejected').length})`} />
        </Tabs>
      </Paper>

      {/* 신청 내역 */}
      {filteredApplications.length === 0 ? (
        <Alert severity="info">
          {tabValue === 0 ? t('player.applications.noApplications') : t('player.applications.noApplicationsForStatus', { defaultValue: 'No applications with this status.' })}
        </Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {filteredApplications.map((application) => (
            <Box key={application.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold">
                      {application.tournament.name}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Chip
                        size="small"
                        label={getStatusText(application.approvalStatus)}
                        color={getStatusColor(application.approvalStatus)}
                        icon={getStatusIcon(application.approvalStatus)}
                      />
                      <Chip
                        size="small"
                        label={getPaymentStatusText(application.paymentStatus)}
                        color={getPaymentStatusColor(application.paymentStatus)}
                        icon={<PaymentIcon />}
                      />
                    </Box>
                  </Box>

                  <List dense>
                    <ListItem disablePadding>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <TrophyIcon fontSize="small" color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={t('player.applications.eventType')}
                        secondary={getEventTypeText(application.eventType)}
                      />
                    </ListItem>

                    <ListItem disablePadding>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        📍
                      </ListItemIcon>
                      <ListItemText
                        primary={t('player.matches.location')}
                        secondary={application.tournament.location}
                      />
                    </ListItem>

                    <ListItem disablePadding>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        📅
                      </ListItemIcon>
                      <ListItemText
                        primary={t('player.tournaments.startDate')}
                        secondary={formatDate(application.tournament.startDate)}
                      />
                    </ListItem>

                    <ListItem disablePadding>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        💰
                      </ListItemIcon>
                      <ListItemText
                        primary={t('player.tournaments.fee')}
                        secondary={formatCurrency(application.tournament.participantFee)}
                      />
                    </ListItem>

                    <ListItem disablePadding>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        📋
                      </ListItemIcon>
                      <ListItemText
                        primary={t('player.applications.registrationDate')}
                        secondary={formatDate(application.registrationDate)}
                      />
                    </ListItem>

                    <ListItem disablePadding>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        🎯
                      </ListItemIcon>
                      <ListItemText
                        primary={t('player.applications.registrationElo', { defaultValue: 'Registration ELO' })}
                        secondary={application.registrationElo}
                      />
                    </ListItem>

                    {application.partnerPlayer && (
                      <ListItem disablePadding>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          👥
                        </ListItemIcon>
                        <ListItemText
                          primary={t('player.applications.partner', { defaultValue: 'Partner' })}
                          secondary={`${application.partnerPlayer.name} (ELO: ${application.partnerPlayer.eloRating})`}
                        />
                      </ListItem>
                    )}
                  </List>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {application.approvalStatus === 'pending' && (
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={() => handleCancelClick(application)}
                        size="small"
                      >
                        {t('player.applications.cancel')}
                      </Button>
                    )}
                    
                    {application.approvalStatus === 'approved' && application.paymentStatus === 'pending' && (
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<PaymentIcon />}
                        size="small"
                      >
                        {t('player.applications.makePayment', { defaultValue: 'Make Payment' })}
                      </Button>
                    )}

                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate(`/player/tournament/${application.tournament.id}`)}
                    >
                      {t('player.applications.viewTournament', { defaultValue: 'View Tournament' })}
                    </Button>

                    {application.approvalStatus === 'approved' && (
                      <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        onClick={() => navigate(`/player/tournament/${application.tournament.id}/bracket`)}
                      >
                        {t('player.matches.viewBracket')}
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      {/* 취소 확인 다이얼로그 */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>
          {t('player.applications.cancelTitle', { defaultValue: 'Cancel Application' })}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            {t('player.applications.cancelConfirm', { 
              defaultValue: 'Are you sure you want to cancel your application for {{tournamentName}}?',
              tournamentName: selectedApplication?.tournament?.name 
            })}
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            {t('player.applications.cancelWarning', { defaultValue: 'After cancellation, you will need to reapply. If payment is completed, refund process will be initiated.' })}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>
            {t('player.applications.no', { defaultValue: 'No' })}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelConfirm}
          >
            {t('player.applications.yesCancel', { defaultValue: 'Yes, Cancel' })}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PlayerApplications;