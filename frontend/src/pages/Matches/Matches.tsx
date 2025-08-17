import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Avatar,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Grid,
} from '@mui/material';
import { 
  SportsTennis, 
  EmojiEvents,
  Schedule,
  ViewList,
  Add,
  People,
  PersonAdd,
  Check,
  Close,
  Delete,
  Warning,
  Edit,
  AutoAwesome,
  VerifiedUser,
  Notifications,
  Send,
  Campaign,
  Download,
  FileDownload,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatDateTime } from '../../utils/dateUtils';
import { 
  useGetTournamentsQuery, 
  useGenerateBracketMutation,
  useGetTournamentParticipantsQuery,
  useUpdateParticipantStatusMutation,
  useRemoveParticipantMutation,
  useGetPlayersQuery,
  useAddParticipantMutation,
  useCheckTournamentBracketsQuery,
  useUpdatePlayerMutation,
  useGetTournamentMatchesQuery,
  useGetTournamentMatchStatsQuery,
  useStartMatchMutation,
  useCancelMatchMutation,
  useUpdateMatchScheduleMutation,
  useGenerateAIScheduleMutation,
  useValidateScheduleQuery,
  useSendNotificationMutation,
  useSendUrgentAnnouncementMutation,
  useSendMatchStartingNotificationMutation,
  useGetNotificationStatsQuery,
} from '../../store/api/apiSlice';
import BracketConfiguration from '../../components/Tournament/BracketConfiguration';

// Mock matches data
const mockMatches = [
  {
    id: '1',
    player1: { name: '김철수', rating: 1814 },
    player2: { name: '이영희', rating: 1636 },
    player1Score: 21,
    player2Score: 15,
    status: 'completed',
    tournament: { name: '즉시 테스트 대회' },
    roundName: 'group_stage',
    completedAt: '2025-08-11T04:34:59.536Z',
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'scheduled': return 'default';
    case 'ongoing': return 'warning';
    case 'completed': return 'success';
    case 'cancelled': return 'error';
    default: return 'default';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'scheduled': return '예정';
    case 'ongoing': return '진행 중';
    case 'completed': return '완료';
    case 'cancelled': return '취소';
    default: return status;
  }
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Matches: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [tabValue, setTabValue] = useState(0);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isExportingBracket, setIsExportingBracket] = useState(false);
  const [isExportingSchedule, setIsExportingSchedule] = useState(false);
  
  const { data: tournamentsData, isLoading: isLoadingTournaments } = useGetTournamentsQuery({});
  const [generateBracket, { isLoading: isGeneratingBracket }] = useGenerateBracketMutation();
  const tournaments = tournamentsData?.data?.tournaments || [];

  const handleTournamentChange = (event: SelectChangeEvent) => {
    setSelectedTournament(event.target.value);
    setAlertMessage(null); // 대회 변경 시 알림 초기화
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleGenerateBracket = async () => {
    if (!selectedTournament) return;
    
    try {
      setAlertMessage(null);
      await generateBracket(selectedTournament).unwrap();
      setAlertMessage({ type: 'success', message: '대진표가 성공적으로 생성되었습니다!' });
      // 성공 시 잠시 후 대진표 페이지로 이동
      setTimeout(() => {
        navigate(`/tournaments/${selectedTournament}/bracket`);
      }, 1500);
    } catch (err: any) {
      console.error('대진표 생성 실패:', err);
      setAlertMessage({ 
        type: 'error', 
        message: err.data?.message || '대진표 생성 중 오류가 발생했습니다.' 
      });
    }
  };

  // 📊 대진표 엑셀 다운로드 (fetch 사용)
  const handleExportBracket = async () => {
    if (!selectedTournament || !selectedTournamentData) return;
    
    try {
      setAlertMessage(null);
      setIsExportingBracket(true);
      
      // 토큰 가져오기
      const token = localStorage.getItem('token');
      if (!token) {
        setAlertMessage({ type: 'error', message: '로그인이 필요합니다.' });
        return;
      }

      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/matches/tournament/${selectedTournament}/export/bracket`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('엑셀 파일 다운로드에 실패했습니다.');
      }

      const blob = await response.blob();
      
      // 파일 다운로드
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // 파일명 생성 (한글 대회명 안전하게 처리)
      const safeFileName = selectedTournamentData.name.replace(/[^\w\s-가-힣]/gi, '').trim();
      const timestamp = new Date().toISOString().slice(0, 10);
      link.download = `대진표_${safeFileName}_${timestamp}.xlsx`;
      
      document.body.appendChild(link);
      link.click();
      
      // 정리
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      setAlertMessage({ type: 'success', message: '대진표 엑셀 파일이 다운로드되었습니다!' });
    } catch (err: any) {
      console.error('대진표 엑셀 내보내기 실패:', err);
      setAlertMessage({ 
        type: 'error', 
        message: err.message || '대진표 엑셀 내보내기 중 오류가 발생했습니다.' 
      });
    } finally {
      setIsExportingBracket(false);
    }
  };

  // 📅 시간표 엑셀 다운로드 (fetch 사용)
  const handleExportSchedule = async () => {
    if (!selectedTournament || !selectedTournamentData) return;
    
    try {
      setAlertMessage(null);
      setIsExportingSchedule(true);
      
      // 토큰 가져오기
      const token = localStorage.getItem('token');
      if (!token) {
        setAlertMessage({ type: 'error', message: '로그인이 필요합니다.' });
        return;
      }

      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/matches/tournament/${selectedTournament}/export/schedule`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('엑셀 파일 다운로드에 실패했습니다.');
      }

      const blob = await response.blob();
      
      // 파일 다운로드
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // 파일명 생성
      const safeFileName = selectedTournamentData.name.replace(/[^\w\s-가-힣]/gi, '').trim();
      const timestamp = new Date().toISOString().slice(0, 10);
      link.download = `경기시간표_${safeFileName}_${timestamp}.xlsx`;
      
      document.body.appendChild(link);
      link.click();
      
      // 정리
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      setAlertMessage({ type: 'success', message: '경기 시간표 엑셀 파일이 다운로드되었습니다!' });
    } catch (err: any) {
      console.error('시간표 엑셀 내보내기 실패:', err);
      setAlertMessage({ 
        type: 'error', 
        message: err.message || '시간표 엑셀 내보내기 중 오류가 발생했습니다.' 
      });
    } finally {
      setIsExportingSchedule(false);
    }
  };

  const selectedTournamentData = tournaments.find((t: any) => t.id === selectedTournament);
  
  // 참가자 데이터 가져오기 (선택된 대회가 있을 때만)
  const { data: participantsData } = useGetTournamentParticipantsQuery(
    { tournamentId: selectedTournament!, limit: 200 },
    { skip: !selectedTournament }
  );
  const approvedParticipants = participantsData?.data?.participants?.filter((p: any) => p.approvalStatus === 'approved') || [];
  const hasEnoughParticipants = approvedParticipants.length >= 4;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            경기 관리
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            대회별 경기 일정과 결과를 관리하세요
          </Typography>
        </Box>
      </Box>

      {/* 알림 메시지 */}
      {alertMessage && (
        <Alert 
          severity={alertMessage.type} 
          sx={{ mb: 3 }}
          onClose={() => setAlertMessage(null)}
        >
          {alertMessage.message}
        </Alert>
      )}

      {/* 대회 선택 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <FormControl sx={{ minWidth: 300 }}>
              <InputLabel>대회 선택</InputLabel>
              <Select
                value={selectedTournament}
                onChange={handleTournamentChange}
                label="대회 선택"
                disabled={isLoadingTournaments}
              >
                {tournaments.map((tournament: any) => (
                  <MenuItem key={tournament.id} value={tournament.id}>
                    {tournament.name} ({tournament.status === 'draft' ? '작성 중' : 
                     tournament.status === 'open' ? '모집 중' : 
                     tournament.status === 'ongoing' ? '진행 중' : '완료'})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedTournament && (
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={handleGenerateBracket}
                  disabled={
                    !selectedTournamentData || 
                    isGeneratingBracket || 
                    selectedTournamentData.status === 'draft' ||
                    !hasEnoughParticipants
                  }
                  title={
                    selectedTournamentData?.status === 'draft' 
                      ? '대회가 작성 중 상태입니다. 먼저 대회를 모집 중으로 변경해주세요.' 
                      : !hasEnoughParticipants
                        ? `대진표 생성을 위해서는 최소 4명의 승인된 참가자가 필요합니다. (현재: ${approvedParticipants.length}명)`
                        : '대진표를 생성합니다'
                  }
                >
                  {isGeneratingBracket ? '생성 중...' : '대진표 생성'}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<ViewList />}
                  onClick={() => navigate(`/tournaments/${selectedTournament}/bracket`)}
                >
                  대진표 보기
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FileDownload />}
                  onClick={handleExportBracket}
                  disabled={isExportingBracket}
                  color="secondary"
                >
                  {isExportingBracket ? '내보내는 중...' : '대진표 엑셀'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={handleExportSchedule}
                  disabled={isExportingSchedule}
                  color="secondary"
                >
                  {isExportingSchedule ? '내보내는 중...' : '시간표 엑셀'}
                </Button>
              </Box>
            )}
          </Box>

          {selectedTournamentData && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedTournamentData.name}
                </Typography>
                <Chip 
                  size="small"
                  label={
                    selectedTournamentData.status === 'draft' ? '작성 중' : 
                    selectedTournamentData.status === 'open' ? '모집 중' : 
                    selectedTournamentData.status === 'closed' ? '모집 마감' :
                    selectedTournamentData.status === 'ongoing' ? '진행 중' : '완료'
                  }
                  color={
                    selectedTournamentData.status === 'ongoing' ? 'warning' : 
                    selectedTournamentData.status === 'completed' ? 'success' : 
                    selectedTournamentData.status === 'open' ? 'info' :
                    selectedTournamentData.status === 'closed' ? 'error' : 'default'
                  }
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                📍 {selectedTournamentData.location} | 
                📅 {new Date(selectedTournamentData.startDate).toLocaleDateString('vi-VN')} | 
                👥 참가자 {approvedParticipants.length}/{selectedTournamentData.maxParticipants}명 |
                🏆 {selectedTournamentData.tournamentType === 'single_elimination' ? '단일 토너먼트' : 
                      selectedTournamentData.tournamentType === 'double_elimination' ? '더블 토너먼트' : '리그전'}
              </Typography>
              {selectedTournamentData.status === 'draft' && (
                <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 1 }}>
                  ⚠️ 대회가 작성 중 상태입니다. 대진표 생성 전에 대회를 모집 중으로 변경해주세요.
                </Typography>
              )}
              {!hasEnoughParticipants && selectedTournamentData.status !== 'draft' && (
                <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 1 }}>
                  ⚠️ 대진표 생성을 위해서는 최소 4명의 승인된 참가자가 필요합니다. (현재: {approvedParticipants.length}명)
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {!selectedTournament ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <SportsTennis sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              대회를 선택해주세요
            </Typography>
            <Typography variant="body2" color="text.secondary">
              위에서 대회를 선택하면 해당 대회의 경기 정보를 확인할 수 있습니다.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="경기 목록" icon={<ViewList />} />
            <Tab label="경기 일정" icon={<Schedule />} />
            <Tab label="참가자 관리" icon={<People />} />
            <Tab label="알림 센터" icon={<Notifications />} />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <MatchList tournamentId={selectedTournament} />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <MatchSchedule tournamentId={selectedTournament} />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <ParticipantManagement 
              tournamentId={selectedTournament} 
              selectedTournamentData={selectedTournamentData}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <NotificationCenter tournamentId={selectedTournament} />
          </TabPanel>
        </>
      )}
    </Box>
  );
};

// 경기 목록 컴포넌트
const MatchList: React.FC<{ tournamentId: string }> = ({ tournamentId }) => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [editingMatch, setEditingMatch] = useState<any>(null);
  const [scheduleDialog, setScheduleDialog] = useState(false);
  const [aiScheduleDialog, setAiScheduleDialog] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    courtNumber: '',
    scheduledTime: '',
    notes: ''
  });
  const [aiParams, setAiParams] = useState({
    startTime: '',
    courtCount: 4,
    matchDuration: 60,
    restBetweenMatches: 30,
    courtChangeDuration: 10
  });
  
  const { data: matchesData, isLoading, error, refetch } = useGetTournamentMatchesQuery({
    tournamentId,
    page,
    limit: 50,
    status: statusFilter || undefined,
    sortBy: 'matchNumber',
    sortOrder: 'asc'
  });
  
  const { data: statsData } = useGetTournamentMatchStatsQuery(tournamentId);
  const { data: validationData } = useValidateScheduleQuery(tournamentId);
  const [updateMatchSchedule, { isLoading: isUpdatingSchedule }] = useUpdateMatchScheduleMutation();
  const [generateAISchedule, { isLoading: isGeneratingAI }] = useGenerateAIScheduleMutation();
  
  console.log('🔍 DEBUG - matchesData:', matchesData);
  console.log('🔍 DEBUG - statsData:', statsData);
  console.log('🔍 DEBUG - API Error:', error);
  
  const matches = matchesData?.data?.matches || [];
  const stats = statsData?.data || null;
  
  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
    setPage(1); // 필터 변경 시 첫 페이지로 이동
  };

  const handleEditSchedule = (match: any) => {
    setEditingMatch(match);
    setScheduleForm({
      courtNumber: match.courtNumber?.toString() || '',
      scheduledTime: match.scheduledTime ? new Date(match.scheduledTime).toISOString().slice(0, 16) : '',
      notes: match.notes || ''
    });
    setScheduleDialog(true);
  };

  const handleSaveSchedule = async () => {
    if (!editingMatch) return;

    try {
      await updateMatchSchedule({
        matchId: editingMatch.id,
        courtNumber: scheduleForm.courtNumber ? parseInt(scheduleForm.courtNumber) : undefined,
        scheduledTime: scheduleForm.scheduledTime || undefined,
        notes: scheduleForm.notes || undefined
      }).unwrap();
      
      setScheduleDialog(false);
      setEditingMatch(null);
      refetch(); // 목록 새로고침
    } catch (err: any) {
      console.error('일정 업데이트 실패:', err);
      alert('일정 업데이트에 실패했습니다: ' + (err.data?.message || err.message));
    }
  };

  const handleCloseScheduleDialog = () => {
    setScheduleDialog(false);
    setEditingMatch(null);
    setScheduleForm({ courtNumber: '', scheduledTime: '', notes: '' });
  };

  const handleOpenAISchedule = () => {
    // 현재 시간을 기본값으로 설정
    const now = new Date();
    const defaultStartTime = new Date(now.getTime() + 60 * 60000); // 1시간 후
    setAiParams(prev => ({
      ...prev,
      startTime: defaultStartTime.toISOString().slice(0, 16)
    }));
    setAiScheduleDialog(true);
  };

  const handleGenerateAISchedule = async () => {
    try {
      const result = await generateAISchedule({
        tournamentId,
        ...aiParams
      }).unwrap();

      alert(`🤖 AI 일정 생성 완료!\n${result.message}\n\n📊 결과:\n- 배정된 경기: ${result.data.scheduledMatches}개\n- 예상 소요 시간: ${Math.round(result.data.estimatedDuration / 60)}시간 ${result.data.estimatedDuration % 60}분`);
      
      setAiScheduleDialog(false);
      refetch(); // 목록 새로고침
    } catch (err: any) {
      console.error('AI 일정 생성 실패:', err);
      alert('AI 일정 생성에 실패했습니다: ' + (err.data?.message || err.message));
    }
  };

  const handleCloseAIDialog = () => {
    setAiScheduleDialog(false);
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            경기 목록
          </Typography>
          <Typography variant="body2" color="text.secondary">
            선택한 대회의 모든 경기를 확인할 수 있습니다.
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="contained"
            startIcon={<AutoAwesome />}
            onClick={handleOpenAISchedule}
            disabled={isGeneratingAI || matches.length === 0}
            color="secondary"
            size="small"
          >
            🤖 AI 자동 배정
          </Button>
          
          {validationData?.data?.conflicts?.length > 0 && (
            <Button
              variant="outlined"
              startIcon={<Warning />}
              color="warning"
              size="small"
              title={`${validationData.data.conflicts.length}개의 일정 충돌이 발견되었습니다`}
            >
              충돌 {validationData.data.conflicts.length}개
            </Button>
          )}
          
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel size="small">상태 필터</InputLabel>
            <Select
              size="small"
              value={statusFilter}
              onChange={handleStatusFilterChange}
              label="상태 필터"
            >
              <MenuItem value="">전체</MenuItem>
              <MenuItem value="scheduled">예정</MenuItem>
              <MenuItem value="ongoing">진행 중</MenuItem>
              <MenuItem value="completed">완료</MenuItem>
              <MenuItem value="cancelled">취소</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* 경기 통계 */}
      {stats && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              경기 현황
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Chip label={`전체 ${stats.total}경기`} variant="outlined" />
              <Chip label={`예정 ${stats.byStatus?.scheduled || 0}`} color="default" />
              <Chip label={`진행 중 ${stats.byStatus?.ongoing || 0}`} color="warning" />
              <Chip label={`완료 ${stats.byStatus?.completed || 0}`} color="success" />
              <Chip label={`취소 ${stats.byStatus?.cancelled || 0}`} color="error" />
              <Chip label={`완료율 ${stats.completionRate || 0}%`} color="info" variant="outlined" />
            </Box>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          경기 목록을 불러오는 중 오류가 발생했습니다: {(error as any)?.data?.message || '알 수 없는 오류'}
        </Alert>
      ) : matches.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <SportsTennis sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              경기가 없습니다
            </Typography>
            <Typography variant="body2" color="text.secondary">
              대진표를 생성하면 여기에 경기 목록이 표시됩니다.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {matches.map((match: any) => (
            <Card key={match.id} variant="outlined">
              <CardContent sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Typography variant="h6">
                        경기 #{match.matchNumber}
                      </Typography>
                      <Chip 
                        label={match.roundName} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                      <Chip 
                        label={getStatusText(match.status)} 
                        size="small" 
                        color={getStatusColor(match.status)}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                          {match.player1?.name?.[0] || match.player1Name?.[0] || '?'}
                        </Avatar>
                        <Typography variant="body1">
                          {match.player1?.name || match.player1Name || 'TBD'}
                        </Typography>
                        {match.status === 'completed' && (
                          <Typography variant="h6" color="primary">
                            {match.player1Score}
                          </Typography>
                        )}
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary">
                        vs
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                          {match.player2?.name?.[0] || match.player2Name?.[0] || '?'}
                        </Avatar>
                        <Typography variant="body1">
                          {match.player2?.name || match.player2Name || 'TBD'}
                        </Typography>
                        {match.status === 'completed' && (
                          <Typography variant="h6" color="primary">
                            {match.player2Score}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                      {match.courtNumber ? (
                        <Chip 
                          label={`코트 ${match.courtNumber}`} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      ) : (
                        <Chip 
                          label="코트 미지정" 
                          size="small" 
                          color="warning" 
                          variant="outlined"
                        />
                      )}
                      
                      {match.scheduledTime ? (
                        <Chip 
                          label={`예정: ${formatDateTime(match.scheduledTime)}`}
                          size="small" 
                          color="info" 
                          variant="outlined"
                        />
                      ) : (
                        <Chip 
                          label="시간 미지정" 
                          size="small" 
                          color="warning" 
                          variant="outlined"
                        />
                      )}
                      
                      {match.actualStartTime && (
                        <Chip 
                          label={`시작: ${formatDateTime(match.actualStartTime)}`}
                          size="small" 
                          color="success" 
                          variant="outlined"
                        />
                      )}
                      
                      {match.actualEndTime && (
                        <Chip 
                          label={`종료: ${formatDateTime(match.actualEndTime)}`}
                          size="small" 
                          color="success"
                        />
                      )}
                      
                      {match.notes && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          📝 {match.notes}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton 
                      size="small" 
                      onClick={() => handleEditSchedule(match)}
                      title="경기 일정 편집"
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    {match.bracket && (
                      <Typography variant="caption" color="text.secondary">
                        {match.bracket.name}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
      
      {/* 경기 일정 편집 다이얼로그 */}
      <Dialog open={scheduleDialog} onClose={handleCloseScheduleDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          경기 일정 편집
          {editingMatch && (
            <Typography variant="body2" color="text.secondary">
              경기 #{editingMatch.matchNumber} - {editingMatch.roundName}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField
              type="number"
              label="코트 번호"
              value={scheduleForm.courtNumber}
              onChange={(e) => setScheduleForm(prev => ({ ...prev, courtNumber: e.target.value }))}
              inputProps={{ min: 1, max: 20 }}
              helperText="경기가 진행될 코트 번호를 입력하세요"
            />
            
            <TextField
              type="datetime-local"
              label="예정 시간"
              value={scheduleForm.scheduledTime}
              onChange={(e) => setScheduleForm(prev => ({ ...prev, scheduledTime: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              helperText="경기 예정 시간을 설정하세요"
            />
            
            <TextField
              label="메모"
              multiline
              rows={3}
              value={scheduleForm.notes}
              onChange={(e) => setScheduleForm(prev => ({ ...prev, notes: e.target.value }))}
              helperText="경기에 대한 추가 메모나 주의사항을 입력하세요"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseScheduleDialog}>
            취소
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSaveSchedule}
            disabled={isUpdatingSchedule}
          >
            {isUpdatingSchedule ? '저장 중...' : '저장'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 🤖 AI 자동 일정 생성 다이얼로그 */}
      <Dialog open={aiScheduleDialog} onClose={handleCloseAIDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          🤖 AI 자동 일정 배정
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            인공지능이 코트 사용률과 선수 휴식 시간을 고려하여 최적의 일정을 자동으로 생성합니다.
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField
              type="datetime-local"
              label="대회 시작 시간"
              value={aiParams.startTime}
              onChange={(e) => setAiParams(prev => ({ ...prev, startTime: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              helperText="첫 경기 시작 시간을 설정하세요"
              required
            />
            
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                type="number"
                label="사용 가능한 코트 수"
                value={aiParams.courtCount}
                onChange={(e) => setAiParams(prev => ({ ...prev, courtCount: parseInt(e.target.value) || 1 }))}
                inputProps={{ min: 1, max: 20 }}
                helperText="동시에 사용할 수 있는 코트 개수"
              />
              
              <TextField
                type="number"
                label="경기당 소요 시간 (분)"
                value={aiParams.matchDuration}
                onChange={(e) => setAiParams(prev => ({ ...prev, matchDuration: parseInt(e.target.value) || 60 }))}
                inputProps={{ min: 30, max: 180 }}
                helperText="한 경기당 예상 소요 시간"
              />
            </Box>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                type="number"
                label="선수 휴식 시간 (분)"
                value={aiParams.restBetweenMatches}
                onChange={(e) => setAiParams(prev => ({ ...prev, restBetweenMatches: parseInt(e.target.value) || 30 }))}
                inputProps={{ min: 15, max: 120 }}
                helperText="연속 경기 간 최소 휴식 시간"
              />
              
              <TextField
                type="number"
                label="코트 정리 시간 (분)"
                value={aiParams.courtChangeDuration}
                onChange={(e) => setAiParams(prev => ({ ...prev, courtChangeDuration: parseInt(e.target.value) || 10 }))}
                inputProps={{ min: 5, max: 30 }}
                helperText="경기 간 코트 정리 및 준비 시간"
              />
            </Box>
            
            <Box sx={{ p: 2, bgcolor: 'info.50', borderRadius: 1, border: '1px solid', borderColor: 'info.200' }}>
              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AutoAwesome color="info" />
                AI가 고려하는 요소들:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 라운드별 우선순위 (그룹전 → 토너먼트 순) <br/>
                • 코트 사용률 최적화 <br/>
                • 선수 연속 경기 방지 및 충분한 휴식 보장 <br/>
                • 전체 대회 소요 시간 최소화 <br/>
                • 일정 충돌 자동 감지 및 방지
              </Typography>
            </Box>
            
            {matches.length > 0 && (
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  📊 현재 대회 정보:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • 총 경기 수: {matches.length}개 <br/>
                  • 예상 소요 시간: 약 {Math.ceil(matches.length * aiParams.matchDuration / aiParams.courtCount / 60)}시간 <br/>
                  • 설정된 코트: {aiParams.courtCount}개 <br/>
                  • 동시 진행 경기: 최대 {aiParams.courtCount}경기
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAIDialog}>
            취소
          </Button>
          <Button 
            variant="contained" 
            onClick={handleGenerateAISchedule}
            disabled={!aiParams.startTime || isGeneratingAI}
            startIcon={<AutoAwesome />}
          >
            {isGeneratingAI ? '🤖 AI 생성 중...' : '🚀 AI 일정 생성'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// 참가자 관리 컴포넌트
const ParticipantManagement: React.FC<{ tournamentId: string; selectedTournamentData: any }> = ({ 
  tournamentId, 
  selectedTournamentData 
}) => {
  const [addPlayerDialog, setAddPlayerDialog] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [bracketConfigDialog, setBracketConfigDialog] = useState(false);
  const [showBracketWarning, setShowBracketWarning] = useState(false);
  const [editingName, setEditingName] = useState<{ playerId: string; currentName: string } | null>(null);
  const [newName, setNewName] = useState('');
  const navigate = useNavigate();
  
  const { data: participantsData, isLoading: isLoadingParticipants, refetch: refetchParticipants } = useGetTournamentParticipantsQuery({ 
    tournamentId, 
    limit: 200 
  }, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true
  });
  const { data: playersData, isLoading: isLoadingPlayers } = useGetPlayersQuery({ limit: 500 });
  const { data: bracketsStatus } = useCheckTournamentBracketsQuery(tournamentId);
  const [updateParticipantStatus, { isLoading: isUpdatingStatus }] = useUpdateParticipantStatusMutation();
  const [removeParticipant, { isLoading: isRemoving }] = useRemoveParticipantMutation();
  const [addParticipant, { isLoading: isApplying }] = useAddParticipantMutation();
  const [generateBracket, { isLoading: isGeneratingBracket }] = useGenerateBracketMutation();
  const [updatePlayer, { isLoading: isUpdatingPlayer }] = useUpdatePlayerMutation();

  const participants = participantsData?.data?.participants || [];
  const players = playersData?.data?.players || [];
  
  // 디버그: 참가자 데이터 로그
  console.log('🔍 DEBUG - participantsData:', participantsData);
  console.log('🔍 DEBUG - participants.length:', participants.length);
  console.log('🔍 DEBUG - 첫 5명 참가자:', participants.slice(0, 5).map((p: any) => ({ name: p.player?.name, status: p.approvalStatus })));

  // 중복 이름 감지 함수
  const findDuplicateNames = () => {
    const nameCount: { [key: string]: number } = {};
    const duplicates = new Set<string>();
    
    participants.forEach((participant: any) => {
      const name = participant.player?.name;
      if (name) {
        nameCount[name] = (nameCount[name] || 0) + 1;
        if (nameCount[name] > 1) {
          duplicates.add(name);
        }
      }
    });
    
    return duplicates;
  };

  const duplicateNames = findDuplicateNames();
  
  // 특정 참가자가 중복 이름인지 확인하는 함수
  const isDuplicateName = (participantName: string) => {
    return duplicateNames.has(participantName);
  };

  const handleStatusChange = async (participantId: string, status: string) => {
    try {
      await updateParticipantStatus({ participantId, status }).unwrap();
    } catch (err: any) {
      console.error('참가자 상태 변경 실패:', err);
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    try {
      await removeParticipant({ participantId }).unwrap();
    } catch (err: any) {
      console.error('참가자 제거 실패:', err);
    }
  };

  const handleAddPlayer = async () => {
    if (!selectedPlayer) return;
    
    try {
      await addParticipant({ tournamentId, playerId: selectedPlayer }).unwrap();
      setAddPlayerDialog(false);
      setSelectedPlayer('');
      setShowBracketWarning(false);
    } catch (err: any) {
      console.error('참가자 추가 실패:', err);
      if (err?.data?.error === 'REGISTRATION_CLOSED_BRACKETS_EXIST') {
        alert('대진표가 이미 생성되어 일반 사용자는 참가 신청할 수 없습니다. 관리자에게 문의하세요.');
      } else {
        alert(`참가자 추가 실패: ${err?.data?.message || err.message}`);
      }
    }
  };

  const handleShowAddPlayerDialog = () => {
    if (bracketsStatus?.hasBrackets) {
      setShowBracketWarning(true);
    } else {
      setAddPlayerDialog(true);
    }
  };

  const handleConfirmAddPlayer = () => {
    setShowBracketWarning(false);
    setAddPlayerDialog(true);
  };

  const handleStartEditName = (playerId: string, currentName: string) => {
    setEditingName({ playerId, currentName });
    setNewName(currentName);
  };

  const handleCancelEditName = () => {
    setEditingName(null);
    setNewName('');
  };

  const handleSaveEditName = async () => {
    if (!editingName || !newName.trim()) return;
    
    try {
      await updatePlayer({
        id: editingName.playerId,
        name: newName.trim()
      }).unwrap();
      
      setEditingName(null);
      setNewName('');
      refetchParticipants(); // 참가자 목록 새로고침
    } catch (err: any) {
      console.error('이름 수정 실패:', err);
      alert(`이름 수정 실패: ${err?.data?.message || err.message}`);
    }
  };

  const handleBracketGeneration = async (configs: any[]) => {
    try {
      console.log('대진표 생성 시작, 설정:', configs);
      
      if (configs && configs.length > 0) {
        // 구성된 대진표 생성
        const config = configs[0]; // 첫 번째 설정 사용
        const bracketData = {
          tournamentId,
          eventType: config.eventType,
          name: config.name,
          participantIds: config.participants.map((p: any) => p.id),
          bracketType: config.tournamentType,
          groupSize: config.groupSize,
          advancersPerGroup: config.advancersPerGroup
        };
        console.log('구성된 대진표 데이터:', bracketData);
        const result = await generateBracket(bracketData).unwrap();
        console.log('대진표 생성 성공:', result);
      } else {
        // 기본 대진표 생성
        const result = await generateBracket(tournamentId).unwrap();
        console.log('기본 대진표 생성 성공:', result);
      }
      
      setBracketConfigDialog(false);
      
      // 잠시 대기 후 대진표 페이지로 이동 (캐시 업데이트 대기)
      setTimeout(() => {
        console.log('대진표 페이지로 이동 중...');
        navigate(`/tournaments/${tournamentId}/bracket`);
      }, 1000);
    } catch (err: any) {
      console.error('대진표 생성 실패:', err);
      console.error('오류 상세:', err.data || err.message);
      alert(`대진표 생성 실패: ${err.data?.message || err.message || '알 수 없는 오류'}`);
    }
  };

  const handleQuickBracketGeneration = async () => {
    try {
      console.log('빠른 대진표 생성 시작, tournamentId:', tournamentId);
      const result = await generateBracket(tournamentId).unwrap();
      console.log('빠른 대진표 생성 성공:', result);
      
      // 잠시 대기 후 대진표 페이지로 이동 (캐시 업데이트 대기)
      setTimeout(() => {
        console.log('대진표 페이지로 이동 중...');
        navigate(`/tournaments/${tournamentId}/bracket`);
      }, 1000);
    } catch (err: any) {
      console.error('빠른 대진표 생성 실패:', err);
      console.error('오류 상세:', err.data || err.message);
      alert(`빠른 대진표 생성 실패: ${err.data?.message || err.message || '알 수 없는 오류'}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return '승인됨';
      case 'rejected': return '거부됨';
      case 'pending': return '대기 중';
      default: return status;
    }
  };

  const approvedCount = participants.filter((p: any) => p.approvalStatus === 'approved').length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              참가자 관리
            </Typography>
            <Typography variant="body2" color="text.secondary">
              전체 참가자: {participants.length}명 | 승인된 참가자: {approvedCount}명 / 최대 {selectedTournamentData?.maxParticipants || 0}명
              {duplicateNames.size > 0 && (
                <span style={{ color: '#ed6c02', fontWeight: 'bold' }}>
                  {' '} | ⚠️ 중복 이름: {duplicateNames.size}개
                </span>
              )}
            </Typography>
          </Box>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={() => refetchParticipants()}
            sx={{ minWidth: 'auto' }}
          >
            🔄 새로고침
          </Button>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<PersonAdd />}
            onClick={handleShowAddPlayerDialog}
            disabled={isLoadingPlayers}
          >
            참가자 추가
          </Button>
          {approvedCount >= 4 && (
            <>
              <Button
                variant="outlined"
                startIcon={<EmojiEvents />}
                onClick={() => setBracketConfigDialog(true)}
                disabled={isGeneratingBracket}
              >
                대진표 구성
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleQuickBracketGeneration}
                disabled={isGeneratingBracket}
              >
                {isGeneratingBracket ? '생성 중...' : '빠른 생성'}
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* 중복 이름 경고 */}
      {duplicateNames.size > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          ⚠️ <strong>{duplicateNames.size}개의 중복된 이름이 발견되었습니다!</strong>
          <br />
          중복 이름: {Array.from(duplicateNames).map(name => `"${name}"`).join(', ')}
          <br />
          <Typography variant="body2" sx={{ mt: 1 }}>
            <strong>대진표 생성 시 문제가 발생할 수 있습니다:</strong>
            <br />
            • 실제 32명 참가자가 {32 - duplicateNames.size}명으로 계산됨
            <br />
            • 브라켓 생성 로직에서 참가자 수 불일치 발생
            <br />
            • <strong>해결 방법:</strong> 중복 이름 옆의 ✏️ 수정 버튼을 클릭하여 구분 가능한 이름으로 변경하세요
            <br />
            <em>예: "Lưu Thị Hà" → "Lưu Thị Hà (A팀)" 또는 "Lưu Thị Hà (1992년생)"</em>
          </Typography>
        </Alert>
      )}

      {/* 대진표 생성 조건 및 현재 상태 안내 */}
      {bracketsStatus?.hasBrackets ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          ✅ 이미 대진표가 생성되었습니다! ({bracketsStatus.bracketCount}개 브라켓)
          <br />
          ⚠️ 대진표 생성 후 참가자 추가 시 기존 대진표와 불일치가 발생할 수 있습니다.
        </Alert>
      ) : approvedCount < 4 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          대진표 생성을 위해서는 최소 4명의 승인된 참가자가 필요합니다. 
          (현재: {approvedCount}명)
        </Alert>
      ) : (
        <Alert severity="success" sx={{ mb: 3 }}>
          ✅ 대진표 생성 조건을 만족했습니다! ({approvedCount}명 승인됨)
          <br />
          위의 "대진표 구성" 버튼으로 세부 설정을 하거나 "빠른 생성"으로 즉시 생성할 수 있습니다.
        </Alert>
      )}

      {/* 참가자 목록 */}
      <Card>
        <CardContent>
          {isLoadingParticipants ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : participants.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <People sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                참가자가 없습니다
              </Typography>
              <Typography variant="body2" color="text.secondary">
                참가자 추가 버튼을 클릭하여 선수들을 대회에 등록하세요.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {participants.map((participant: any) => (
                <Card key={participant.id} variant="outlined">
                  <CardContent sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {editingName?.playerId === participant.player?.id ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
                              <TextField
                                size="small"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') handleSaveEditName();
                                  if (e.key === 'Escape') handleCancelEditName();
                                }}
                                autoFocus
                                sx={{ flexGrow: 1 }}
                              />
                              <Button
                                size="small"
                                onClick={handleSaveEditName}
                                disabled={isUpdatingPlayer || !newName.trim()}
                                color="primary"
                                variant="contained"
                              >
                                저장
                              </Button>
                              <Button
                                size="small"
                                onClick={handleCancelEditName}
                                disabled={isUpdatingPlayer}
                              >
                                취소
                              </Button>
                            </Box>
                          ) : (
                            <>
                              <Typography variant="h6">
                                {participant.player?.name}
                              </Typography>
                              {isDuplicateName(participant.player?.name) && (
                                <>
                                  <Chip
                                    icon={<Warning />}
                                    label="중복 이름"
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                  />
                                  <IconButton
                                    size="small"
                                    onClick={() => handleStartEditName(participant.player?.id, participant.player?.name)}
                                    title="이름 수정"
                                    color="warning"
                                  >
                                    <Edit fontSize="small" />
                                  </IconButton>
                                </>
                              )}
                            </>
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          ELO: {participant.player?.eloRating} | 
                          실력: {participant.player?.skillLevel === 'a_class' ? 'Group A' :
                                participant.player?.skillLevel === 'b_class' ? 'Group B' :
                                participant.player?.skillLevel === 'c_class' ? 'Group C' : 'Group D'} |
                          등록일: {new Date(participant.registrationDate).toLocaleDateString('vi-VN')}
                        </Typography>
                        {isDuplicateName(participant.player?.name) && (
                          <Typography variant="caption" color="warning.main" sx={{ fontWeight: 'bold' }}>
                            ⚠️ 이름이 중복되었습니다. 참가자 ID: {participant.player?.id}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          label={getStatusText(participant.approvalStatus)} 
                          color={getStatusColor(participant.approvalStatus)}
                          size="small"
                        />
                        {participant.approvalStatus === 'pending' && (
                          <>
                            <Button
                              size="small"
                              startIcon={<Check />}
                              onClick={() => handleStatusChange(participant.id, 'approved')}
                              disabled={isUpdatingStatus}
                              color="success"
                            >
                              승인
                            </Button>
                            <Button
                              size="small"
                              startIcon={<Close />}
                              onClick={() => handleStatusChange(participant.id, 'rejected')}
                              disabled={isUpdatingStatus}
                              color="error"
                            >
                              거부
                            </Button>
                          </>
                        )}
                        <Button
                          size="small"
                          startIcon={<Delete />}
                          onClick={() => handleRemoveParticipant(participant.id)}
                          disabled={isRemoving}
                          color="error"
                          variant="outlined"
                        >
                          제거
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 참가자 추가 다이얼로그 */}
      <Dialog
        open={addPlayerDialog}
        onClose={() => setAddPlayerDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>참가자 추가</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>선수 선택</InputLabel>
            <Select
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              label="선수 선택"
            >
              {players
                .filter((player: any) => !participants.some((p: any) => p.playerId === player.id))
                .map((player: any) => (
                  <MenuItem key={player.id} value={player.id}>
                    {player.name} (ELO: {player.eloRating})
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddPlayerDialog(false)}>
            취소
          </Button>
          <Button
            variant="contained"
            onClick={handleAddPlayer}
            disabled={!selectedPlayer || isApplying}
          >
            {isApplying ? '추가 중...' : '추가'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 대진표 구성 다이얼로그 */}
      {bracketConfigDialog && (
        <BracketConfiguration
          tournamentId={tournamentId}
          participants={(() => {
            const approvedParticipants = participants.filter((p: any) => p.approvalStatus === 'approved');
            console.log('대진표 구성으로 전달되는 승인된 참가자들:', approvedParticipants);
            console.log('전체 참가자 수:', participants.length);
            console.log('승인된 참가자 수:', approvedParticipants.length);
            return approvedParticipants;
          })()}
          onGenerate={handleBracketGeneration}
          onClose={() => setBracketConfigDialog(false)}
        />
      )}

      {/* 대진표 생성 후 참가자 추가 경고 다이얼로그 */}
      <Dialog open={showBracketWarning} onClose={() => setShowBracketWarning(false)}>
        <DialogTitle>⚠️ 주의사항</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            이미 대진표가 생성된 상태입니다!
          </Alert>
          <Typography variant="body1" gutterBottom>
            대진표가 생성된 후 참가자를 추가하면 다음과 같은 문제가 발생할 수 있습니다:
          </Typography>
          <Box component="ul" sx={{ pl: 2, mt: 1 }}>
            <Typography component="li" variant="body2">기존 대진표에 새 참가자가 포함되지 않음</Typography>
            <Typography component="li" variant="body2">참가자 수 불일치로 인한 혼란</Typography>
            <Typography component="li" variant="body2">대진표 재생성이 필요할 수 있음</Typography>
          </Box>
          <Typography variant="body1" sx={{ mt: 2, fontWeight: 'bold' }}>
            정말로 참가자를 추가하시겠습니까?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBracketWarning(false)}>
            취소
          </Button>
          <Button onClick={handleConfirmAddPlayer} color="warning" variant="contained">
            계속 진행
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// 경기 일정 컴포넌트
const MatchSchedule: React.FC<{ tournamentId: string }> = ({ tournamentId }) => {
  const [viewMode, setViewMode] = useState<'timeline' | 'court' | 'day'>('timeline');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [aiScheduleDialog, setAiScheduleDialog] = useState(false);
  const [aiParams, setAiParams] = useState({
    startTime: '',
    courtCount: 4,
    matchDuration: 60,
    restBetweenMatches: 30,
    courtChangeDuration: 10
  });
  
  const { data: matchesData, isLoading, refetch } = useGetTournamentMatchesQuery({
    tournamentId,
    page: 1,
    limit: 100,
    sortBy: 'scheduledTime',
    sortOrder: 'asc'
  });
  
  const { data: statsData } = useGetTournamentMatchStatsQuery(tournamentId);
  const { data: validationData } = useValidateScheduleQuery(tournamentId);
  const [generateAISchedule, { isLoading: isGeneratingAI }] = useGenerateAIScheduleMutation();
  
  const matches = matchesData?.data?.matches || [];
  const stats = statsData?.data || null;
  
  // 일정이 있는 경기들만 필터링
  const scheduledMatches = matches.filter((match: any) => match.scheduledTime);
  
  // 코트별로 경기 그룹핑
  const groupByCourt = (matches: any[]) => {
    const grouped: { [key: number]: any[] } = {};
    matches.forEach((match: any) => {
      if (match.courtNumber) {
        if (!grouped[match.courtNumber]) {
          grouped[match.courtNumber] = [];
        }
        grouped[match.courtNumber].push(match);
      }
    });
    return grouped;
  };
  
  // 날짜별로 경기 그룹핑
  const groupByDate = (matches: any[]) => {
    const grouped: { [key: string]: any[] } = {};
    matches.forEach((match: any) => {
      if (match.scheduledTime) {
        const date = new Date(match.scheduledTime).toISOString().split('T')[0];
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(match);
      }
    });
    return grouped;
  };
  
  const matchesByCourt = groupByCourt(scheduledMatches);
  const matchesByDate = groupByDate(scheduledMatches);
  const courts = Object.keys(matchesByCourt).map(Number).sort((a, b) => a - b);
  const dates = Object.keys(matchesByDate).sort();
  
  const handleOpenAISchedule = () => {
    const now = new Date();
    const defaultStartTime = new Date(now.getTime() + 60 * 60000);
    setAiParams(prev => ({
      ...prev,
      startTime: defaultStartTime.toISOString().slice(0, 16)
    }));
    setAiScheduleDialog(true);
  };
  
  const handleGenerateAISchedule = async () => {
    try {
      const result = await generateAISchedule({
        tournamentId,
        ...aiParams
      }).unwrap();
      
      alert(`🤖 AI 일정 생성 완료!\n${result.message}\n\n📊 결과:\n- 배정된 경기: ${result.data.scheduledMatches}개\n- 예상 소요 시간: ${Math.round(result.data.estimatedDuration / 60)}시간 ${result.data.estimatedDuration % 60}분`);
      
      setAiScheduleDialog(false);
      refetch();
    } catch (err: any) {
      console.error('AI 일정 생성 실패:', err);
      alert('AI 일정 생성에 실패했습니다: ' + (err.data?.message || err.message));
    }
  };
  
  const MatchCard: React.FC<{ match: any; showCourt?: boolean; showTime?: boolean }> = ({ 
    match, 
    showCourt = false, 
    showTime = true 
  }) => (
    <Card 
      variant="outlined" 
      sx={{ 
        mb: 1, 
        border: match.status === 'ongoing' ? '2px solid' : '1px solid',
        borderColor: match.status === 'ongoing' ? 'warning.main' : 'divider',
        bgcolor: match.status === 'completed' ? 'success.50' : 'background.paper'
      }}
    >
      <CardContent sx={{ py: 1.5, px: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                #{match.matchNumber}
              </Typography>
              <Chip 
                label={match.roundName} 
                size="small" 
                color="primary" 
                variant="outlined"
              />
              {showCourt && match.courtNumber && (
                <Chip 
                  label={`코트 ${match.courtNumber}`} 
                  size="small" 
                  color="secondary" 
                  variant="outlined"
                />
              )}
              <Chip 
                label={getStatusText(match.status)} 
                size="small" 
                color={getStatusColor(match.status)}
              />
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
              <Typography variant="body2">
                {match.player1?.name || match.player1Name || 'TBD'}
              </Typography>
              <Typography variant="body2" color="text.secondary">vs</Typography>
              <Typography variant="body2">
                {match.player2?.name || match.player2Name || 'TBD'}
              </Typography>
              {match.status === 'completed' && (
                <Typography variant="body2" color="primary" fontWeight="bold">
                  ({match.player1Score} - {match.player2Score})
                </Typography>
              )}
            </Box>
            
            {showTime && match.scheduledTime && (
              <Typography variant="caption" color="text.secondary">
                🕒 {formatDateTime(match.scheduledTime)}
                {match.actualStartTime && (
                  <span> → 시작: {formatDateTime(match.actualStartTime)}</span>
                )}
                {match.actualEndTime && (
                  <span> → 종료: {formatDateTime(match.actualEndTime)}</span>
                )}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            경기 일정
          </Typography>
          <Typography variant="body2" color="text.secondary">
            경기 시간표와 코트 배정을 확인할 수 있습니다.
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="contained"
            startIcon={<AutoAwesome />}
            onClick={handleOpenAISchedule}
            disabled={isGeneratingAI || matches.length === 0}
            color="secondary"
            size="small"
          >
            🤖 AI 자동 배정
          </Button>
          
          {validationData?.data?.conflicts?.length > 0 && (
            <Button
              variant="outlined"
              startIcon={<Warning />}
              color="warning"
              size="small"
              title={`${validationData.data.conflicts.length}개의 일정 충돌이 발견되었습니다`}
            >
              충돌 {validationData.data.conflicts.length}개
            </Button>
          )}
          
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel size="small">보기 방식</InputLabel>
            <Select
              size="small"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
              label="보기 방식"
            >
              <MenuItem value="timeline">시간순</MenuItem>
              <MenuItem value="court">코트별</MenuItem>
              <MenuItem value="day">날짜별</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>
      
      {/* 일정 통계 */}
      {stats && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              일정 현황
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Chip label={`전체 ${stats.total}경기`} variant="outlined" />
              <Chip label={`일정 배정 ${scheduledMatches.length}경기`} color="info" />
              <Chip label={`미배정 ${stats.total - scheduledMatches.length}경기`} color="warning" variant="outlined" />
              {courts.length > 0 && (
                <Chip label={`사용 코트 ${courts.length}개`} color="secondary" variant="outlined" />
              )}
              {dates.length > 0 && (
                <Chip label={`진행 일정 ${dates.length}일`} color="primary" variant="outlined" />
              )}
            </Box>
          </CardContent>
        </Card>
      )}
      
      {scheduledMatches.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Schedule sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              배정된 일정이 없습니다
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              AI 자동 배정을 사용하여 최적의 경기 일정을 생성하세요.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AutoAwesome />}
              onClick={handleOpenAISchedule}
              disabled={matches.length === 0}
              color="secondary"
            >
              🤖 AI 일정 생성
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Box>
          {/* 시간순 보기 */}
          {viewMode === 'timeline' && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Schedule color="primary" />
                  시간순 경기 일정
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {scheduledMatches
                    .sort((a: any, b: any) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())
                    .map((match: any) => (
                      <MatchCard key={match.id} match={match} showCourt={true} />
                    ))}
                </Box>
              </CardContent>
            </Card>
          )}
          
          {/* 코트별 보기 */}
          {viewMode === 'court' && (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 3 }}>
              {courts.map((courtNumber: number) => (
                <Card key={courtNumber}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SportsTennis color="primary" />
                      코트 {courtNumber}
                      <Chip 
                        label={`${matchesByCourt[courtNumber].length}경기`} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {matchesByCourt[courtNumber]
                        .sort((a: any, b: any) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())
                        .map((match: any) => (
                          <MatchCard key={match.id} match={match} showTime={true} />
                        ))}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
          
          {/* 날짜별 보기 */}
          {viewMode === 'day' && (
            <Box>
              {dates.length > 1 && (
                <FormControl sx={{ mb: 3, minWidth: 200 }}>
                  <InputLabel>날짜 선택</InputLabel>
                  <Select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    label="날짜 선택"
                  >
                    {dates.map((date: string) => (
                      <MenuItem key={date} value={date}>
                        {new Date(date).toLocaleDateString('ko-KR')} ({matchesByDate[date].length}경기)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              
              {dates.map((date: string) => (
                <Card key={date} sx={{ mb: 3, display: dates.length > 1 && date !== selectedDate ? 'none' : 'block' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      📅 {new Date(date).toLocaleDateString('ko-KR')}
                      <Chip 
                        label={`${matchesByDate[date].length}경기`} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                        sx={{ ml: 2 }}
                      />
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {matchesByDate[date]
                        .sort((a: any, b: any) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())
                        .map((match: any) => (
                          <MatchCard key={match.id} match={match} showCourt={true} showTime={true} />
                        ))}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      )}
      
      {/* 🤖 AI 자동 일정 생성 다이얼로그 */}
      <Dialog open={aiScheduleDialog} onClose={() => setAiScheduleDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          🤖 AI 자동 일정 배정
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            인공지능이 코트 사용률과 선수 휴식 시간을 고려하여 최적의 일정을 자동으로 생성합니다.
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField
              type="datetime-local"
              label="대회 시작 시간"
              value={aiParams.startTime}
              onChange={(e) => setAiParams(prev => ({ ...prev, startTime: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              helperText="첫 경기 시작 시간을 설정하세요"
              required
            />
            
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                type="number"
                label="사용 가능한 코트 수"
                value={aiParams.courtCount}
                onChange={(e) => setAiParams(prev => ({ ...prev, courtCount: parseInt(e.target.value) || 1 }))}
                inputProps={{ min: 1, max: 20 }}
                helperText="동시에 사용할 수 있는 코트 개수"
              />
              
              <TextField
                type="number"
                label="경기당 소요 시간 (분)"
                value={aiParams.matchDuration}
                onChange={(e) => setAiParams(prev => ({ ...prev, matchDuration: parseInt(e.target.value) || 60 }))}
                inputProps={{ min: 30, max: 180 }}
                helperText="한 경기당 예상 소요 시간"
              />
            </Box>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                type="number"
                label="선수 휴식 시간 (분)"
                value={aiParams.restBetweenMatches}
                onChange={(e) => setAiParams(prev => ({ ...prev, restBetweenMatches: parseInt(e.target.value) || 30 }))}
                inputProps={{ min: 15, max: 120 }}
                helperText="연속 경기 간 최소 휴식 시간"
              />
              
              <TextField
                type="number"
                label="코트 정리 시간 (분)"
                value={aiParams.courtChangeDuration}
                onChange={(e) => setAiParams(prev => ({ ...prev, courtChangeDuration: parseInt(e.target.value) || 10 }))}
                inputProps={{ min: 5, max: 30 }}
                helperText="경기 간 코트 정리 및 준비 시간"
              />
            </Box>
            
            {matches.length > 0 && (
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  📊 현재 대회 정보:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • 총 경기 수: {matches.length}개 <br/>
                  • 예상 소요 시간: 약 {Math.ceil(matches.length * aiParams.matchDuration / aiParams.courtCount / 60)}시간 <br/>
                  • 설정된 코트: {aiParams.courtCount}개 <br/>
                  • 동시 진행 경기: 최대 {aiParams.courtCount}경기
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAiScheduleDialog(false)}>
            취소
          </Button>
          <Button 
            variant="contained" 
            onClick={handleGenerateAISchedule}
            disabled={!aiParams.startTime || isGeneratingAI}
            startIcon={<AutoAwesome />}
          >
            {isGeneratingAI ? '🤖 AI 생성 중...' : '🚀 AI 일정 생성'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// 알림 센터 컴포넌트
const NotificationCenter: React.FC<{ tournamentId: string }> = ({ tournamentId }) => {
  const [notificationDialog, setNotificationDialog] = useState(false);
  const [urgentDialog, setUrgentDialog] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'urgent' | 'success',
    actionUrl: ''
  });

  const { data: statsData } = useGetNotificationStatsQuery(tournamentId);
  const [sendNotification, { isLoading: isSendingNotification }] = useSendNotificationMutation();
  const [sendUrgentAnnouncement, { isLoading: isSendingUrgent }] = useSendUrgentAnnouncementMutation();
  const [sendMatchStarting, { isLoading: isSendingMatchStart }] = useSendMatchStartingNotificationMutation();

  const { data: matchesData } = useGetTournamentMatchesQuery({
    tournamentId,
    page: 1,
    limit: 50,
    sortBy: 'scheduledTime',
    sortOrder: 'asc'
  });

  const matches = matchesData?.data?.matches || [];
  const scheduledMatches = matches.filter((match: any) => 
    match.scheduledTime && 
    match.courtNumber && 
    (match.player1?.name || match.player1Name) && 
    (match.player2?.name || match.player2Name) &&
    match.status !== 'completed'
  );

  const handleSendNotification = async () => {
    try {
      const result = await sendNotification({
        tournamentId,
        ...notificationForm
      }).unwrap();

      alert(`✅ ${result.data.sentCount}명에게 알림을 전송했습니다!`);
      setNotificationDialog(false);
      setNotificationForm({ title: '', message: '', type: 'info', actionUrl: '' });
    } catch (err: any) {
      alert('❌ 알림 전송에 실패했습니다: ' + (err.data?.message || err.message));
    }
  };

  const handleSendUrgent = async () => {
    try {
      const result = await sendUrgentAnnouncement({
        tournamentId,
        title: notificationForm.title,
        message: notificationForm.message
      }).unwrap();

      alert(`🚨 ${result.data.sentCount}명에게 긴급 공지를 전송했습니다!`);
      setUrgentDialog(false);
      setNotificationForm({ title: '', message: '', type: 'info', actionUrl: '' });
    } catch (err: any) {
      alert('❌ 긴급 공지 전송에 실패했습니다: ' + (err.data?.message || err.message));
    }
  };

  const handleSendMatchStarting = async (matchId: string, minutes: number) => {
    try {
      const result = await sendMatchStarting({
        matchId,
        minutesUntilStart: minutes
      }).unwrap();

      alert(`⏰ ${result.data.sentCount}명에게 경기 시작 알림을 전송했습니다!`);
    } catch (err: any) {
      alert('❌ 경기 시작 알림 전송에 실패했습니다: ' + (err.data?.message || err.message));
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'error';
      case 'warning': return 'warning';
      case 'success': return 'success';
      default: return 'info';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            알림 센터
          </Typography>
          <Typography variant="body2" color="text.secondary">
            대회 참가자들에게 실시간 알림을 전송할 수 있습니다.
          </Typography>
        </Box>
      </Box>

      {/* 연결 상태 및 통계 */}
      {statsData && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              연결 현황
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Chip 
                label={`연결된 참가자 ${statsData.data.connectedParticipants}명`} 
                color={statsData.data.connectedParticipants > 0 ? 'success' : 'default'}
                icon={<People />}
              />
              <Chip 
                label={`전체 연결 ${statsData.data.totalConnections}명`} 
                variant="outlined"
              />
              <Chip 
                label={statsData.data.canSendNotifications ? '알림 전송 가능' : '알림 전송 불가'} 
                color={statsData.data.canSendNotifications ? 'success' : 'error'}
                variant="outlined"
              />
            </Box>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        {/* 일반 알림 전송 */}
        <Grid sx={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Send color="primary" />
                일반 알림 전송
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                대회 참가자들에게 일반적인 알림을 전송합니다.
              </Typography>
              <Button
                variant="contained"
                startIcon={<Send />}
                onClick={() => setNotificationDialog(true)}
                fullWidth
                disabled={!statsData?.data?.canSendNotifications}
              >
                알림 작성하기
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* 긴급 공지 */}
        <Grid sx={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Campaign color="error" />
                긴급 공지
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                중요한 상황 발생 시 긴급 공지를 전송합니다.
              </Typography>
              <Button
                variant="contained"
                color="error"
                startIcon={<Campaign />}
                onClick={() => setUrgentDialog(true)}
                fullWidth
                disabled={!statsData?.data?.canSendNotifications}
              >
                긴급 공지 작성
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* 경기별 알림 */}
        <Grid sx={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Schedule color="primary" />
                경기 시작 알림
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                예정된 경기의 참가자들에게 경기 시작 알림을 전송합니다.
              </Typography>
              
              {scheduledMatches.length === 0 ? (
                <Alert severity="info">
                  시간이 배정된 예정 경기가 없습니다.
                </Alert>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {scheduledMatches.slice(0, 5).map((match: any) => (
                    <Card key={match.id} variant="outlined">
                      <CardContent sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="subtitle2">
                              경기 #{match.matchNumber} - {match.roundName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              코트 {match.courtNumber}: {match.player1?.name || match.player1Name} vs {match.player2?.name || match.player2Name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              📅 {formatDateTime(match.scheduledTime)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleSendMatchStarting(match.id, 10)}
                              disabled={isSendingMatchStart}
                            >
                              10분 전 알림
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleSendMatchStarting(match.id, 5)}
                              disabled={isSendingMatchStart}
                            >
                              5분 전 알림
                            </Button>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                  {scheduledMatches.length > 5 && (
                    <Typography variant="caption" color="text.secondary" textAlign="center">
                      ... 및 {scheduledMatches.length - 5}개의 추가 경기
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 일반 알림 작성 다이얼로그 */}
      <Dialog open={notificationDialog} onClose={() => setNotificationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          알림 작성
          <Typography variant="body2" color="text.secondary">
            대회 참가자들에게 전송할 알림을 작성하세요.
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField
              label="제목"
              value={notificationForm.title}
              onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
              required
              helperText="알림의 제목을 입력하세요"
            />
            
            <TextField
              label="메시지"
              multiline
              rows={4}
              value={notificationForm.message}
              onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
              required
              helperText="전송할 메시지 내용을 입력하세요"
            />
            
            <FormControl>
              <InputLabel>알림 종류</InputLabel>
              <Select
                value={notificationForm.type}
                onChange={(e) => setNotificationForm(prev => ({ ...prev, type: e.target.value as any }))}
                label="알림 종류"
              >
                <MenuItem value="info">정보 (파란색)</MenuItem>
                <MenuItem value="success">성공 (초록색)</MenuItem>
                <MenuItem value="warning">경고 (노란색)</MenuItem>
                <MenuItem value="urgent">긴급 (빨간색)</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="연결 URL (선택사항)"
              value={notificationForm.actionUrl}
              onChange={(e) => setNotificationForm(prev => ({ ...prev, actionUrl: e.target.value }))}
              helperText="클릭 시 이동할 페이지 URL (예: /tournaments/123/bracket)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotificationDialog(false)}>
            취소
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSendNotification}
            disabled={!notificationForm.title || !notificationForm.message || isSendingNotification}
            color={getTypeColor(notificationForm.type)}
          >
            {isSendingNotification ? '전송 중...' : '알림 전송'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 긴급 공지 작성 다이얼로그 */}
      <Dialog open={urgentDialog} onClose={() => setUrgentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          🚨 긴급 공지 작성
          <Typography variant="body2" color="error">
            긴급 상황 발생 시에만 사용하세요. 모든 참가자에게 즉시 전송됩니다.
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField
              label="긴급 공지 제목"
              value={notificationForm.title}
              onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
              required
              error={!notificationForm.title}
              helperText="긴급 상황의 제목을 명확히 입력하세요"
            />
            
            <TextField
              label="긴급 공지 내용"
              multiline
              rows={4}
              value={notificationForm.message}
              onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
              required
              error={!notificationForm.message}
              helperText="긴급 상황에 대한 자세한 안내를 입력하세요"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUrgentDialog(false)}>
            취소
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleSendUrgent}
            disabled={!notificationForm.title || !notificationForm.message || isSendingUrgent}
            startIcon={<Campaign />}
          >
            {isSendingUrgent ? '전송 중...' : '🚨 긴급 공지 전송'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Matches;