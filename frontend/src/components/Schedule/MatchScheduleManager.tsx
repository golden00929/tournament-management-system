import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import {
  Schedule,
  Stadium,
  AccessTime,
  Edit,
  ExpandMore,
  AutoAwesome,
  Refresh,
  Group,
  EmojiEvents,
} from '@mui/icons-material';

interface Match {
  id: string;
  matchNumber: number;
  roundName: string;
  player1?: { id: string; name: string; };
  player2?: { id: string; name: string; };
  player1Name?: string;
  player2Name?: string;
  player1Score?: number;
  player2Score?: number;
  status: 'pending' | 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  winnerId?: string;
  courtNumber?: number;
  scheduledTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  notes?: string;
}

interface MatchScheduleManagerProps {
  matches: Match[];
  onMatchUpdate: (matchId: string, updates: any) => void;
  onBulkSchedule?: (scheduleData: any) => void;
}

interface CourtSchedule {
  courtNumber: number;
  name: string;
  available: boolean;
  matches: Match[];
}

const MatchScheduleManager: React.FC<MatchScheduleManagerProps> = ({
  matches,
  onMatchUpdate,
  onBulkSchedule
}) => {
  const [scheduleDialog, setScheduleDialog] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [courtNumber, setCourtNumber] = useState<number>(1);
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [autoScheduleDialog, setAutoScheduleDialog] = useState(false);
  const [courtCount, setCourtCount] = useState(4);
  const [startTime, setStartTime] = useState<string>('');
  const [matchDuration, setMatchDuration] = useState(30); // 분
  const [breakTime, setBreakTime] = useState(10); // 분

  // 라운드별로 매치 분류
  const matchesByRound = matches.reduce((acc: any, match) => {
    const roundName = match.roundName;
    if (!acc[roundName]) {
      acc[roundName] = [];
    }
    acc[roundName].push(match);
    return acc;
  }, {});

  // 라운드 순서 정의
  const getRoundOrder = (roundName: string) => {
    if (roundName.includes('Group')) return 1;
    if (roundName.includes('Round of 16') || roundName.includes('16강')) return 2;
    if (roundName.includes('Round of 8') || roundName.includes('8강') || roundName.includes('Quarter')) return 3;
    if (roundName.includes('Round of 4') || roundName.includes('4강') || roundName.includes('Semi')) return 4;
    if (roundName.includes('Final') || roundName.includes('결승')) return 5;
    return 0;
  };

  const sortedRounds = Object.keys(matchesByRound).sort((a, b) => getRoundOrder(a) - getRoundOrder(b));

  // 코트별 일정 생성
  const generateCourtSchedule = (): CourtSchedule[] => {
    const courts: CourtSchedule[] = [];
    
    for (let i = 1; i <= Math.max(courtCount, 4); i++) {
      courts.push({
        courtNumber: i,
        name: `코트 ${i}`,
        available: true,
        matches: matches.filter(m => m.courtNumber === i).sort((a, b) => {
          if (!a.scheduledTime || !b.scheduledTime) return 0;
          return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
        })
      });
    }
    
    return courts;
  };

  const courtSchedules = generateCourtSchedule();

  // 개별 매치 일정 편집
  const handleEditSchedule = (match: Match) => {
    setSelectedMatch(match);
    setCourtNumber(match.courtNumber || 1);
    const now = new Date();
    const defaultTime = now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm 형식
    setScheduledTime(match.scheduledTime ? new Date(match.scheduledTime).toISOString().slice(0, 16) : defaultTime);
    setNotes(match.notes || '');
    setScheduleDialog(true);
  };

  const handleSaveSchedule = () => {
    if (selectedMatch && scheduledTime) {
      onMatchUpdate(selectedMatch.id, {
        courtNumber: courtNumber,
        scheduledTime: new Date(scheduledTime).toISOString(),
        notes: notes,
        status: 'scheduled'
      });
      setScheduleDialog(false);
      setSelectedMatch(null);
    }
  };

  // 자동 일정 배정
  const handleAutoSchedule = () => {
    if (!startTime) {
      alert('시작 시간을 선택해주세요.');
      return;
    }

    const unscheduledMatches = matches
      .filter(m => !m.scheduledTime && (m.player1Name !== 'TBD' && m.player2Name !== 'TBD'))
      .sort((a, b) => getRoundOrder(a.roundName) - getRoundOrder(b.roundName));

    const scheduleData: any[] = [];
    let currentTime = new Date(startTime);
    let currentCourt = 1;

    unscheduledMatches.forEach((match, index) => {
      scheduleData.push({
        matchId: match.id,
        courtNumber: currentCourt,
        scheduledTime: new Date(currentTime),
        status: 'scheduled'
      });

      // 다음 매치 시간 계산
      currentTime = new Date(currentTime.getTime() + matchDuration * 60000);
      
      // 코트 변경
      currentCourt = currentCourt >= courtCount ? 1 : currentCourt + 1;
      
      // 모든 코트를 한 바퀴 돌면 휴식 시간 추가
      if ((index + 1) % courtCount === 0) {
        currentTime = new Date(currentTime.getTime() + breakTime * 60000);
      }
    });

    // 일괄 업데이트
    scheduleData.forEach(schedule => {
      onMatchUpdate(schedule.matchId, {
        courtNumber: schedule.courtNumber,
        scheduledTime: schedule.scheduledTime.toISOString(),
        status: 'scheduled'
      });
    });

    setAutoScheduleDialog(false);
    alert(`${scheduleData.length}개 경기의 일정이 자동으로 배정되었습니다.`);
  };

  // 상태별 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'ongoing': return 'warning';
      case 'scheduled': return 'info';
      case 'pending': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '완료';
      case 'ongoing': return '진행 중';
      case 'scheduled': return '예정';
      case 'pending': return '대기';
      case 'cancelled': return '취소';
      default: return status;
    }
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 컴포넌트 마운트시 기본값 설정
  React.useEffect(() => {
    const now = new Date();
    const defaultTime = now.toISOString().slice(0, 16);
    if (!startTime) {
      setStartTime(defaultTime);
    }
  }, [startTime]);

  return (
    <Box>
        {/* 헤더 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              경기 일정 관리
            </Typography>
            <Typography variant="body2" color="text.secondary">
              생성된 대진표의 모든 경기에 코트와 시간을 배정할 수 있습니다.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<AutoAwesome />}
              onClick={() => setAutoScheduleDialog(true)}
              disabled={matches.length === 0}
            >
              자동 일정 배정
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
            >
              새로고침
            </Button>
          </Box>
        </Box>

        {matches.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            배정할 경기가 없습니다. 먼저 대진표를 생성해주세요.
          </Alert>
        ) : (
          <Box>
            {/* 통계 카드 */}
            <Box sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)',
                md: 'repeat(4, 1fr)'
              },
              mb: 4
            }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {matches.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    총 경기 수
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {matches.filter(m => m.scheduledTime).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    일정 배정 완료
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">
                    {matches.filter(m => m.courtNumber).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    코트 배정 완료
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {matches.filter(m => !m.scheduledTime && m.player1Name !== 'TBD' && m.player2Name !== 'TBD').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    배정 대기 중
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* 라운드별 경기 목록 */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                <Schedule sx={{ mr: 1 }} />
                라운드별 경기 일정
              </Typography>
              
              {sortedRounds.map(roundName => (
                <Accordion key={roundName} defaultExpanded={getRoundOrder(roundName) <= 2}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {roundName.includes('Group') ? <Group /> : <EmojiEvents />}
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {roundName.includes('Group') ? `${roundName.replace('Group ', '')}조` : roundName}
                      </Typography>
                      <Chip 
                        label={`${matchesByRound[roundName].length}경기`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip 
                        label={`${matchesByRound[roundName].filter((m: Match) => m.scheduledTime).length}/${matchesByRound[roundName].length} 배정완료`}
                        size="small"
                        color={matchesByRound[roundName].every((m: Match) => m.scheduledTime) ? 'success' : 'warning'}
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>경기</TableCell>
                            <TableCell>선수</TableCell>
                            <TableCell align="center">코트</TableCell>
                            <TableCell align="center">예정 시간</TableCell>
                            <TableCell align="center">상태</TableCell>
                            <TableCell align="center">액션</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {matchesByRound[roundName].map((match: Match) => (
                            <TableRow key={match.id}>
                              <TableCell>
                                <Box>
                                  <Typography variant="body2" fontWeight="bold">
                                    #{match.matchNumber}
                                  </Typography>
                                  {match.notes && (
                                    <Typography variant="caption" color="text.secondary">
                                      📝 {match.notes}
                                    </Typography>
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Box>
                                  <Typography variant="body2">
                                    {match.player1?.name || match.player1Name || 'TBD'}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    vs
                                  </Typography>
                                  <Typography variant="body2">
                                    {match.player2?.name || match.player2Name || 'TBD'}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                {match.courtNumber ? (
                                  <Chip 
                                    label={`코트 ${match.courtNumber}`}
                                    size="small"
                                    color="primary"
                                    icon={<Stadium />}
                                  />
                                ) : (
                                  <Chip 
                                    label="미배정"
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                  />
                                )}
                              </TableCell>
                              <TableCell align="center">
                                {match.scheduledTime ? (
                                  <Chip 
                                    label={formatDateTime(match.scheduledTime)}
                                    size="small"
                                    color="info"
                                    icon={<AccessTime />}
                                  />
                                ) : (
                                  <Chip 
                                    label="미배정"
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                  />
                                )}
                              </TableCell>
                              <TableCell align="center">
                                <Chip 
                                  label={getStatusText(match.status)}
                                  size="small"
                                  color={getStatusColor(match.status)}
                                />
                              </TableCell>
                              <TableCell align="center">
                                <IconButton 
                                  size="small"
                                  onClick={() => handleEditSchedule(match)}
                                  disabled={match.player1Name === 'TBD' || match.player2Name === 'TBD'}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>

            {/* 코트별 일정 보기 */}
            <Box>
              <Typography variant="h6" gutterBottom>
                <Stadium sx={{ mr: 1 }} />
                코트별 일정
              </Typography>
              
              <Box sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)'
                }
              }}>
                {courtSchedules.slice(0, 6).map(court => (
                  <Card key={court.courtNumber}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        {court.name}
                      </Typography>
                      {court.matches.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          배정된 경기가 없습니다.
                        </Typography>
                      ) : (
                        <Box>
                          {court.matches.slice(0, 5).map(match => (
                            <Box key={match.id} sx={{ mb: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                              <Typography variant="caption" display="block">
                                #{match.matchNumber} - {match.roundName}
                              </Typography>
                              <Typography variant="body2">
                                {match.player1?.name || match.player1Name} vs {match.player2?.name || match.player2Name}
                              </Typography>
                              {match.scheduledTime && (
                                <Typography variant="caption" color="primary">
                                  {formatDateTime(match.scheduledTime)}
                                </Typography>
                              )}
                            </Box>
                          ))}
                          {court.matches.length > 5 && (
                            <Typography variant="caption" color="text.secondary">
                              +{court.matches.length - 5}개 경기 더...
                            </Typography>
                          )}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          </Box>
        )}

        {/* 개별 경기 일정 편집 다이얼로그 */}
        <Dialog 
          open={scheduleDialog} 
          onClose={() => setScheduleDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>경기 일정 편집</DialogTitle>
          <DialogContent>
            {selectedMatch && (
              <Box sx={{ pt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  경기 #{selectedMatch.matchNumber} - {selectedMatch.roundName}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {selectedMatch.player1?.name || selectedMatch.player1Name} vs {selectedMatch.player2?.name || selectedMatch.player2Name}
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <FormControl>
                    <InputLabel>코트 번호</InputLabel>
                    <Select
                      value={courtNumber}
                      label="코트 번호"
                      onChange={(e: SelectChangeEvent<number>) => setCourtNumber(Number(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5, 6].map(num => (
                        <MenuItem key={num} value={num}>코트 {num}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <TextField
                    label="경기 시간"
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                  
                  <TextField
                    label="메모"
                    multiline
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="경기에 대한 추가 정보..."
                  />
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setScheduleDialog(false)}>
              취소
            </Button>
            <Button variant="contained" onClick={handleSaveSchedule}>
              저장
            </Button>
          </DialogActions>
        </Dialog>

        {/* 자동 일정 배정 다이얼로그 */}
        <Dialog 
          open={autoScheduleDialog} 
          onClose={() => setAutoScheduleDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>자동 일정 배정</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              모든 경기에 자동으로 코트와 시간을 배정합니다.
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
              <TextField
                type="number"
                label="코트 수"
                value={courtCount}
                onChange={(e) => setCourtCount(Number(e.target.value))}
                inputProps={{ min: 1, max: 10 }}
              />
              
              <TextField
                label="시작 시간"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              
              <TextField
                type="number"
                label="경기당 소요 시간 (분)"
                value={matchDuration}
                onChange={(e) => setMatchDuration(Number(e.target.value))}
                inputProps={{ min: 10, max: 120 }}
              />
              
              <TextField
                type="number"
                label="경기 간 휴식 시간 (분)"
                value={breakTime}
                onChange={(e) => setBreakTime(Number(e.target.value))}
                inputProps={{ min: 0, max: 60 }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAutoScheduleDialog(false)}>
              취소
            </Button>
            <Button variant="contained" onClick={handleAutoSchedule}>
              자동 배정
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
  );
};

export default MatchScheduleManager;