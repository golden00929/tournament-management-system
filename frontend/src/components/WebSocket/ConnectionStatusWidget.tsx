/**
 * WebSocket Connection Status Widget
 * Displays real-time connection status with manual controls for testing reconnection
 */

import React, { useState } from 'react';
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Typography,
  LinearProgress,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse
} from '@mui/material';
import {
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useWebSocketStatus, useTournamentWebSocket } from '../../hooks/useWebSocketReconnection';

interface ConnectionStatusWidgetProps {
  tournamentId: string;
  position?: 'fixed' | 'relative';
  showDetails?: boolean;
}

export const ConnectionStatusWidget: React.FC<ConnectionStatusWidgetProps> = ({
  tournamentId,
  position = 'fixed',
  showDetails = false
}) => {
  const status = useWebSocketStatus(tournamentId);
  const tournamentSocket = useTournamentWebSocket(tournamentId);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleForceReconnect = () => {
    tournamentSocket.forceReconnect();
  };

  const handleConnect = () => {
    tournamentSocket.connect();
  };

  const handleDisconnect = () => {
    tournamentSocket.disconnect();
  };

  const formatUptime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}시간 ${minutes % 60}분`;
    } else if (minutes > 0) {
      return `${minutes}분 ${seconds % 60}초`;
    } else {
      return `${seconds}초`;
    }
  };

  const StatusChip = () => (
    <Chip
      icon={status.isHealthy ? <WifiIcon /> : <WifiOffIcon />}
      label={status.statusText}
      color={status.statusColor}
      size="small"
      variant={status.isHealthy ? "filled" : "outlined"}
      onClick={() => setShowDetailDialog(true)}
      sx={{ cursor: 'pointer' }}
    />
  );

  const QuickActions = () => (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <Tooltip title="연결 상태 새로고침">
        <IconButton 
          size="small" 
          onClick={handleForceReconnect}
          disabled={tournamentSocket.isConnecting}
        >
          <RefreshIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="상세 정보">
        <IconButton size="small" onClick={() => setShowDetailDialog(true)}>
          <SettingsIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );

  const ReconnectionProgress = () => {
    if (status.status !== 'reconnecting') return null;

    const progress = (status.statistics.currentRetryCount / 10) * 100;
    
    return (
      <Box sx={{ width: '200px', mt: 1 }}>
        <Typography variant="caption" color="textSecondary">
          재연결 중... ({status.statistics.currentRetryCount}/10)
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ mt: 0.5 }}
        />
      </Box>
    );
  };

  const DetailDialog = () => (
    <Dialog 
      open={showDetailDialog} 
      onClose={() => setShowDetailDialog(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {status.statusIcon} WebSocket 연결 상태
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          {/* Current Status */}
          <Grid sx={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  현재 상태
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <WifiIcon color={status.isHealthy ? 'success' : 'error'} />
                    </ListItemIcon>
                    <ListItemText
                      primary="연결 상태"
                      secondary={status.statusText}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <TimelineIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="업타임"
                      secondary={formatUptime(status.statistics.uptime)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <SpeedIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="건강 상태"
                      secondary={status.isHealthy ? '정상' : '불안정'}
                    />
                  </ListItem>
                  {status.lastError && (
                    <ListItem>
                      <ListItemIcon>
                        <ErrorIcon color="error" />
                      </ListItemIcon>
                      <ListItemText
                        primary="마지막 오류"
                        secondary={status.lastError}
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Statistics */}
          <Grid sx={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  통계
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="총 재연결 횟수"
                      secondary={status.statistics.totalReconnections}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="현재 재시도 횟수"
                      secondary={status.statistics.currentRetryCount}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="대기 중인 메시지"
                      secondary={status.statistics.queuedMessages}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Connection Controls */}
          <Grid sx={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  연결 제어
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleConnect}
                    disabled={tournamentSocket.isConnected || tournamentSocket.isConnecting}
                    startIcon={<WifiIcon />}
                  >
                    연결
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleDisconnect}
                    disabled={!tournamentSocket.isConnected}
                    startIcon={<WifiOffIcon />}
                  >
                    연결 해제
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleForceReconnect}
                    disabled={tournamentSocket.isConnecting}
                    startIcon={<RefreshIcon />}
                  >
                    강제 재연결
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Advanced Details */}
          <Grid sx={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Box
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  onClick={() => toggleSection('advanced')}
                >
                  <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    고급 정보
                  </Typography>
                  {expandedSections.advanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </Box>
                
                <Collapse in={expandedSections.advanced}>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      <strong>Tournament ID:</strong> {tournamentId}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      <strong>WebSocket URL:</strong> {process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:5000'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      <strong>Auto Reconnect:</strong> 활성화됨
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      <strong>Max Retries:</strong> 10회
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      <strong>Heartbeat Interval:</strong> 25초
                    </Typography>
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={() => setShowDetailDialog(false)}>
            닫기
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );

  if (showDetails) {
    return (
      <Box sx={{ width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <StatusChip />
          <QuickActions />
        </Box>
        <ReconnectionProgress />
        <DetailDialog />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: position,
        top: position === 'fixed' ? 16 : 'auto',
        right: position === 'fixed' ? 16 : 'auto',
        zIndex: position === 'fixed' ? 1200 : 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        backgroundColor: position === 'fixed' ? 'background.paper' : 'transparent',
        padding: position === 'fixed' ? 1 : 0,
        borderRadius: position === 'fixed' ? 1 : 0,
        boxShadow: position === 'fixed' ? 2 : 0
      }}
    >
      <StatusChip />
      <QuickActions />
      <ReconnectionProgress />
      <DetailDialog />
    </Box>
  );
};

export default ConnectionStatusWidget;