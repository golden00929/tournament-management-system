import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Container,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  SelectChangeEvent,
  Button,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  EmojiEvents,
  People,
  Schedule,
  Notifications,
  AccountTree,
  Build,
  Settings,
  Check,
  Close,
  Person,
  Groups,
  Refresh,
} from '@mui/icons-material';

import { 
  useGetTournamentsQuery,
  useGetTournamentQuery,
  useGetTournamentBracketQuery,
  useGenerateBracketMutation,
  useGetTournamentParticipantsQuery,
  useUpdateParticipantStatusMutation,
  useGetTournamentMatchesQuery,
  useUpdateMatchMutation
} from '../../store/api/apiSlice';
import BracketConfiguration from '../../components/Tournament/BracketConfiguration';
import InteractiveMatchBracket from '../../components/Tournament/InteractiveMatchBracket';
import MatchScheduleManager from '../../components/Schedule/MatchScheduleManager';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const a11yProps = (index: number) => {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
};

interface MatchResult {
  matchId: string;
  winnerId: string;
  player1Score: number;
  player2Score: number;
}

const Matches: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [matchResultDialog, setMatchResultDialog] = useState(false);
  const [configurationDialog, setConfigurationDialog] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResult>({
    matchId: '',
    winnerId: '',
    player1Score: 0,
    player2Score: 0,
  });

  const { data: tournamentsData, isLoading: tournamentsLoading } = useGetTournamentsQuery({
    page: 1,
    limit: 100
  });

  const { data: tournament, isLoading: tournamentLoading } = useGetTournamentQuery(
    selectedTournament,
    { skip: !selectedTournament }
  );

  const { data: bracketData, refetch: refetchBracket } = useGetTournamentBracketQuery(
    selectedTournament!,
    { skip: !selectedTournament }
  );

  const { data: participantsData, refetch: refetchParticipants } = useGetTournamentParticipantsQuery({
    tournamentId: selectedTournament!,
    limit: 200
  }, { skip: !selectedTournament });

  const { data: matchesData } = useGetTournamentMatchesQuery({
    tournamentId: selectedTournament!,
    page: 1,
    limit: 100
  }, { skip: !selectedTournament });

  const [generateBracket, { isLoading: isGenerating }] = useGenerateBracketMutation();
  const [updateParticipantStatus] = useUpdateParticipantStatusMutation();
  const [updateMatch, { isLoading: isUpdatingMatch }] = useUpdateMatchMutation();

  const tournaments = tournamentsData?.data?.tournaments || [];
  const participants = participantsData?.data?.participants || [];
  const matches = matchesData?.data?.matches || [];

  // 디버깅을 위한 useEffect
  useEffect(() => {
    if (selectedTournament) {
      console.log('=== 디버깅 정보 ===');
      console.log('selectedTournament:', selectedTournament);
      console.log('tournament:', tournament);
      console.log('bracketData:', bracketData);
      console.log('matches:', matches);
      console.log('matches.length:', matches.length);
      if (tournament) {
        console.log('tournament.format:', tournament.format);
        console.log('tournament.tournamentType:', tournament.tournamentType);
      }
    }
  }, [selectedTournament, tournament, bracketData, matches]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };


  const handleTournamentChange = (event: SelectChangeEvent) => {
    setSelectedTournament(event.target.value);
    setTabValue(0); // 대회 변경시 첫 번째 탭으로 이동
  };

  const handleGenerateBracket = async () => {
    if (!selectedTournament) return;
    
    try {
      await generateBracket(selectedTournament).unwrap();
      alert('대진표가 성공적으로 생성되었습니다!');
      setTimeout(() => {
        refetchBracket();
      }, 1000);
    } catch (err: any) {
      console.error('Failed to generate bracket:', err);
      alert('대진표 생성에 실패했습니다: ' + (err?.data?.message || '알 수 없는 오류'));
    }
  };

  const handleConfigureBracket = () => {
    setConfigurationDialog(true);
  };

  const handleBracketConfiguration = async (configs: any[]) => {
    try {
      if (configs && configs.length > 0) {
        const config = configs[0];
        await generateBracket({
          tournamentId: selectedTournament!,
          eventType: config.eventType,
          name: config.name,
          participantIds: config.participants.map((p: any) => p.id),
          tournamentType: config.tournamentType,
          groupSize: config.groupSize,
          advancersPerGroup: config.advancersPerGroup
        }).unwrap();
      } else {
        await generateBracket(selectedTournament!).unwrap();
      }
      
      setConfigurationDialog(false);
      setTimeout(() => {
        refetchBracket();
      }, 500);
    } catch (err: any) {
      console.error('Failed to generate configured brackets:', err);
      alert('대진표 생성에 실패했습니다: ' + (err?.data?.message || err.message));
    }
  };

  // 기존 handleMatchClick 기능은 InteractiveMatchBracket에서 처리됨
  // const handleMatchClick = (match: any) => {
  //   if (match.status !== 'completed' && match.player1 && match.player2) {
  //     setSelectedMatch(match);
  //     setMatchResult({
  //       matchId: match.id,
  //       winnerId: '',
  //       player1Score: 0,
  //       player2Score: 0,
  //     });
  //     setMatchResultDialog(true);
  //   }
  // };

  const handleCloseMatchDialog = () => {
    setMatchResultDialog(false);
    setSelectedMatch(null);
    setMatchResult({
      matchId: '',
      winnerId: '',
      player1Score: 0,
      player2Score: 0,
    });
  };

  const handleSubmitMatchResult = async () => {
    if (!matchResult.winnerId || (matchResult.player1Score === 0 && matchResult.player2Score === 0)) {
      return;
    }

    try {
      await updateMatch({
        matchId: matchResult.matchId,
        winnerId: matchResult.winnerId,
        player1Score: matchResult.player1Score,
        player2Score: matchResult.player2Score,
      }).unwrap();
      
      refetchBracket();
      handleCloseMatchDialog();
      alert('매치 결과가 저장되었습니다.');
    } catch (err: any) {
      console.error('Failed to update match result:', err);
      alert('매치 결과 저장에 실패했습니다: ' + (err?.data?.message || err.message));
    }
  };

  const getWinnerOptions = () => {
    if (!selectedMatch) return [];
    
    const options = [];
    if (selectedMatch.player1) {
      options.push({
        value: selectedMatch.player1.id,
        label: selectedMatch.player1.name,
      });
    }
    if (selectedMatch.player2) {
      options.push({
        value: selectedMatch.player2.id,
        label: selectedMatch.player2.name,
      });
    }
    
    return options;
  };

  const handleAutoPlayerAssignment = async () => {
    // 자동 선수 배치 로직 (임시 구현)
    alert('자동 선수 배치 기능이 곧 구현될 예정입니다.');
  };

  const handleMatchUpdate = async (matchId: string, updates: any) => {
    try {
      await updateMatch({
        matchId,
        ...updates
      }).unwrap();
      
      // 대진표 새로고침
      refetchBracket();
      alert('경기 정보가 업데이트되었습니다.');
    } catch (err: any) {
      console.error('Failed to update match:', err);
      alert('경기 정보 업데이트에 실패했습니다: ' + (err?.data?.message || err.message));
    }
  };

  const handleParticipantApproval = async (participantId: string, status: string) => {
    try {
      await updateParticipantStatus({
        participantId,
        status: status
      }).unwrap();
      alert('참가자 상태가 업데이트되었습니다.');
      refetchParticipants();
    } catch (err: any) {
      console.error('Failed to update participant:', err);
      alert('참가자 상태 업데이트에 실패했습니다.');
    }
  };

  if (tournamentsLoading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Typography>대회 목록을 불러오는 중...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          경기 관리
        </Typography>
        <Typography variant="body2" color="text.secondary">
          대회의 대진표, 참가선수, 경기일정, 알림을 통합 관리할 수 있습니다.
        </Typography>
      </Box>

      {/* Tournament Selector */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <FormControl sx={{ minWidth: 300 }}>
              <InputLabel>대회 선택</InputLabel>
              <Select
                value={selectedTournament}
                onChange={handleTournamentChange}
                label="대회 선택"
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
            
            {selectedTournament && tournament && (
              <Box>
                <Typography variant="h6" color="primary">
                  {tournament.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  참가자: {tournament.maxParticipants}명 | 형식: {
                    tournament.format === 'single_elimination' ? '단일 토너먼트' :
                    tournament.format === 'round_robin' ? '리그전' : '하이브리드'
                  }
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {!selectedTournament ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <EmojiEvents sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              대회를 선택해주세요
            </Typography>
            <Typography variant="body2" color="text.secondary">
              위에서 대회를 선택하면 해당 대회의 관리 기능을 사용할 수 있습니다.
            </Typography>
          </CardContent>
        </Card>
      ) : tournamentLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <Typography>대회 정보를 불러오는 중...</Typography>
        </Box>
      ) : (
        <Paper sx={{ p: 0, borderRadius: 2 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="경기 관리 탭"
            variant="scrollable"
            scrollButtons="auto"
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              px: 3,
              pt: 2 
            }}
          >
            <Tab 
              label="대진표" 
              icon={<AccountTree />} 
              iconPosition="start" 
              {...a11yProps(0)} 
            />
            <Tab 
              label="참가선수 관리" 
              icon={<People />} 
              iconPosition="start" 
              {...a11yProps(1)} 
            />
            <Tab 
              label="경기 일정" 
              icon={<Schedule />} 
              iconPosition="start" 
              {...a11yProps(2)} 
            />
            <Tab 
              label="알림" 
              icon={<Notifications />} 
              iconPosition="start" 
              {...a11yProps(3)} 
            />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ px: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    대진표 관리
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    대회의 대진표를 생성하고 관리할 수 있습니다.
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Settings />}
                    onClick={handleConfigureBracket}
                    disabled={!selectedTournament}
                  >
                    대진표 구성
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Build />}
                    onClick={handleGenerateBracket}
                    disabled={isGenerating || !selectedTournament}
                  >
                    {isGenerating ? '생성 중...' : '대진표 생성'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Groups />}
                    onClick={handleAutoPlayerAssignment}
                    disabled={!matches || matches.length === 0}
                  >
                    자동 선수 배치
                  </Button>
                </Box>
              </Box>

              {(!matches || matches.length === 0) ? (
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 6 }}>
                    <AccountTree sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      대진표가 생성되지 않았습니다
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      위의 "대진표 생성" 버튼을 클릭하여 대진표를 생성해주세요.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<Build />}
                      onClick={handleGenerateBracket}
                      disabled={isGenerating}
                    >
                      {isGenerating ? '생성 중...' : '대진표 생성'}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Box>
                  {/* 인터랙티브 대진표 - 사용자 제공 디자인 기반 */}
                  <InteractiveMatchBracket
                    matches={matches}
                    onMatchUpdate={handleMatchUpdate}
                  />
                </Box>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ px: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    참가선수 관리
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    참가 신청한 선수들을 승인하고 관리할 수 있습니다.
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={() => refetchParticipants()}
                >
                  새로고침
                </Button>
              </Box>

              {participants.length === 0 ? (
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 6 }}>
                    <People sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      참가선수가 없습니다
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      아직 이 대회에 참가 신청한 선수가 없습니다.
                    </Typography>
                  </CardContent>
                </Card>
              ) : (
                <TableContainer component={Card}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>선수명</TableCell>
                        <TableCell>연락처</TableCell>
                        <TableCell>실력 등급</TableCell>
                        <TableCell>신청일</TableCell>
                        <TableCell>결제 상태</TableCell>
                        <TableCell>승인 상태</TableCell>
                        <TableCell>액션</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {participants.map((participant: any) => (
                        <TableRow key={participant.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ width: 32, height: 32 }}>
                                <Person />
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="bold">
                                  {participant.player?.name || 'Unknown'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  ID: {participant.player?.id}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {participant.player?.phone || '-'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {participant.player?.email || ''}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={`${participant.player?.skillLevel || 'N/A'}`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(participant.registrationDate).toLocaleDateString('ko-KR')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={participant.paymentStatus === 'paid' ? '완료' : '미결제'}
                              size="small"
                              color={participant.paymentStatus === 'paid' ? 'success' : 'warning'}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={
                                participant.approvalStatus === 'approved' ? '승인' :
                                participant.approvalStatus === 'rejected' ? '거절' : '대기'
                              }
                              size="small"
                              color={
                                participant.approvalStatus === 'approved' ? 'success' :
                                participant.approvalStatus === 'rejected' ? 'error' : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            {participant.approvalStatus === 'pending' && (
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <IconButton 
                                  size="small" 
                                  color="success"
                                  onClick={() => handleParticipantApproval(participant.id, 'approved')}
                                  title="승인"
                                >
                                  <Check />
                                </IconButton>
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={() => handleParticipantApproval(participant.id, 'rejected')}
                                  title="거절"
                                >
                                  <Close />
                                </IconButton>
                              </Box>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Box sx={{ px: 3 }}>
              <MatchScheduleManager 
                matches={matches}
                onMatchUpdate={handleMatchUpdate}
              />
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Box sx={{ px: 3 }}>
              <Typography variant="h6" gutterBottom>
                알림 관리
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                참가자들에게 경기 시간 알림 및 공지사항을 발송할 수 있습니다.
              </Typography>

              <Box sx={{
                display: 'grid',
                gap: 3,
                gridTemplateColumns: {
                  xs: '1fr',
                  md: '1fr 1fr'
                }
              }}>
                {/* 알림 발송 */}
                <Box>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        📢 경기 알림 발송
                      </Typography>
                      
                      <Box sx={{ mb: 3 }}>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                          <InputLabel>알림 유형</InputLabel>
                          <Select
                            defaultValue=""
                            label="알림 유형"
                          >
                            <MenuItem value="match_start">경기 시작 알림</MenuItem>
                            <MenuItem value="schedule_change">일정 변경 알림</MenuItem>
                            <MenuItem value="general">일반 공지사항</MenuItem>
                          </Select>
                        </FormControl>

                        <TextField
                          fullWidth
                          multiline
                          rows={4}
                          label="알림 내용"
                          placeholder="참가자들에게 보낼 메시지를 입력하세요..."
                          sx={{ mb: 2 }}
                        />

                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Button
                            variant="contained"
                            startIcon={<Notifications />}
                            fullWidth
                          >
                            전체 참가자에게 발송
                          </Button>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>

                {/* 선수별 개별 알림 */}
                <Box>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        👤 개별 알림
                      </Typography>
                      
                      <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                        {participants.length === 0 ? (
                          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                            참가자가 없습니다.
                          </Typography>
                        ) : (
                          participants.map((participant: any) => (
                            <Box 
                              key={participant.id}
                              sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                py: 1,
                                borderBottom: '1px solid',
                                borderColor: 'divider'
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ width: 24, height: 24 }}>
                                  <Person />
                                </Avatar>
                                <Box>
                                  <Typography variant="body2">
                                    {participant.player?.name || 'Unknown'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {participant.player?.phone || '연락처 없음'}
                                  </Typography>
                                </Box>
                              </Box>
                              <IconButton size="small" title="개별 알림 발송">
                                <Notifications fontSize="small" />
                              </IconButton>
                            </Box>
                          ))
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              </Box>

              {/* 경기별 알림 */}
              <Box sx={{ mt: 3 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        🏸 경기별 자동 알림
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        각 경기 시작 30분 전에 참가 선수들에게 자동으로 알림을 발송합니다.
                      </Typography>

                      <TableContainer sx={{ maxHeight: 400 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>경기</TableCell>
                              <TableCell>참가자</TableCell>
                              <TableCell>예정 시간</TableCell>
                              <TableCell>자동 알림</TableCell>
                              <TableCell>수동 발송</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {matches.slice(0, 10).map((match: any) => (
                              <TableRow key={match.id}>
                                <TableCell>
                                  <Typography variant="body2">
                                    #{match.matchNumber}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {match.roundName}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Box>
                                    <Typography variant="caption" color="text.secondary">
                                      {match.player1Name || 'TBD'}
                                    </Typography>
                                    <br />
                                    <Typography variant="caption" color="text.secondary">
                                      {match.player2Name || 'TBD'}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {match.scheduledTime ? 
                                      new Date(match.scheduledTime).toLocaleString('ko-KR', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      }) : 
                                      '미정'
                                    }
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip 
                                    label={match.scheduledTime ? "활성" : "비활성"}
                                    size="small"
                                    color={match.scheduledTime ? "success" : "default"}
                                  />
                                </TableCell>
                                <TableCell>
                                  <IconButton 
                                    size="small"
                                    disabled={!match.player1Name || !match.player2Name}
                                    title="경기 알림 발송"
                                  >
                                    <Notifications fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      {matches.length > 10 && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          * 처음 10개 경기만 표시됩니다. 총 {matches.length}개 경기
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
              </Box>
            </Box>
          </TabPanel>
        </Paper>
      )}

      {/* 대진표 구성 다이얼로그 */}
      {configurationDialog && tournament && (
        <BracketConfiguration
          tournamentId={selectedTournament}
          participants={participants}
          tournamentType={tournament.format as 'single_elimination' | 'round_robin' | 'hybrid'}
          onGenerate={handleBracketConfiguration}
          onClose={() => setConfigurationDialog(false)}
        />
      )}

      {/* 매치 결과 입력 다이얼로그 */}
      <Dialog 
        open={matchResultDialog} 
        onClose={handleCloseMatchDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          매치 결과 입력
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            {selectedMatch && (
              <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  매치 #{selectedMatch.matchNumber}
                </Typography>
                <Typography variant="body2">
                  {selectedMatch.player1?.name || selectedMatch.player1Name || 'TBD'} vs {selectedMatch.player2?.name || selectedMatch.player2Name || 'TBD'}
                </Typography>
              </Box>
            )}
            
            <TextField
              select
              label="승자"
              value={matchResult.winnerId}
              onChange={(e) => setMatchResult(prev => ({ ...prev, winnerId: e.target.value }))}
              required
              fullWidth
            >
              {getWinnerOptions().map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                type="number"
                label={selectedMatch?.player1?.name || selectedMatch?.player1Name || '선수1'} 
                value={matchResult.player1Score}
                onChange={(e) => setMatchResult(prev => ({ ...prev, player1Score: parseInt(e.target.value) || 0 }))}
                required
                inputProps={{ min: 0, max: 99 }}
                sx={{ flex: 1 }}
              />
              <Typography variant="h6">vs</Typography>
              <TextField
                type="number"
                label={selectedMatch?.player2?.name || selectedMatch?.player2Name || '선수2'}
                value={matchResult.player2Score}
                onChange={(e) => setMatchResult(prev => ({ ...prev, player2Score: parseInt(e.target.value) || 0 }))}
                required
                inputProps={{ min: 0, max: 99 }}
                sx={{ flex: 1 }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMatchDialog}>
            취소
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitMatchResult}
            disabled={!matchResult.winnerId || (matchResult.player1Score === 0 && matchResult.player2Score === 0) || isUpdatingMatch}
          >
            {isUpdatingMatch ? '저장 중...' : '결과 저장'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Matches;