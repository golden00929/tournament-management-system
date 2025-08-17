import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayArrowIcon,
  EmojiEvents as TrophyIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

// Types
interface SwissParticipant {
  id: string;
  name: string;
  eloRating: number;
  points: number;
  buchholzScore: number;
  opponents: string[];
  matchHistory: SwissMatchResult[];
}

interface SwissMatchResult {
  roundNumber: number;
  opponentId: string;
  opponentName: string;
  result: 'win' | 'loss' | 'draw';
  points: number;
}

interface SwissMatch {
  player1Id: string;
  player2Id: string;
  player1Name: string;
  player2Name: string;
  player1Rating: number;
  player2Rating: number;
  result?: 'win' | 'loss' | 'draw';
  winnerId?: string;
}

interface SwissRound {
  roundNumber: number;
  matches: SwissMatch[];
}

interface SwissBracketData {
  tournamentId: string;
  totalRounds: number;
  currentRound: number;
  participants: SwissParticipant[];
  rounds: SwissRound[];
  fairnessScore: number;
  statistics: {
    averageEloVariance: number;
    balanceScore: number;
    rematchCount: number;
  };
}

interface SwissBracketProps {
  tournamentId: string;
  bracketData?: SwissBracketData;
  onGenerateBracket?: (config: SwissConfig) => void;
  onGenerateNextRound?: () => void;
  onUpdateResults?: (roundNumber: number, results: any[]) => void;
  isLoading?: boolean;
  canEdit?: boolean;
}

interface SwissConfig {
  allowRematch: boolean;
  maxEloVariance: number;
  useBuchholz: boolean;
  preferBalanced: boolean;
}

const SwissBracket: React.FC<SwissBracketProps> = ({
  tournamentId,
  bracketData,
  onGenerateBracket,
  onGenerateNextRound,
  onUpdateResults,
  isLoading = false,
  canEdit = false
}) => {
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [config, setConfig] = useState<SwissConfig>({
    allowRematch: false,
    maxEloVariance: 300,
    useBuchholz: true,
    preferBalanced: true
  });

  useEffect(() => {
    if (bracketData && bracketData.currentRound > 1) {
      setSelectedRound(bracketData.currentRound - 1);
    }
  }, [bracketData]);

  // 공정성 점수에 따른 색상 반환
  const getFairnessColor = (score: number): string => {
    if (score >= 90) return '#4caf50'; // 초록
    if (score >= 70) return '#ff9800'; // 주황
    return '#f44336'; // 빨강
  };

  // 라운드별 매칭 표시
  const renderRoundMatches = (round: SwissRound) => {
    return (
      <TableContainer component={Paper} elevation={1}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>경기</TableCell>
              <TableCell align="center">선수 1</TableCell>
              <TableCell align="center">vs</TableCell>
              <TableCell align="center">선수 2</TableCell>
              <TableCell align="center">ELO 차이</TableCell>
              <TableCell align="center">결과</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {round.matches.map((match, index) => {
              const eloDiff = Math.abs(match.player1Rating - match.player2Rating);
              return (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell align="center">
                    <Box>
                      <Typography variant="body2" fontWeight={match.winnerId === match.player1Id ? 'bold' : 'normal'}>
                        {match.player1Name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ELO: {match.player1Rating}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">vs</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box>
                      <Typography variant="body2" fontWeight={match.winnerId === match.player2Id ? 'bold' : 'normal'}>
                        {match.player2Name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ELO: {match.player2Rating}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={eloDiff}
                      size="small"
                      color={eloDiff < 100 ? 'success' : eloDiff < 200 ? 'warning' : 'error'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    {match.result ? (
                      <Chip
                        label={
                          match.result === 'draw' ? '무승부' :
                          match.winnerId === match.player1Id ? match.player1Name :
                          match.player2Name
                        }
                        size="small"
                        color={match.result === 'draw' ? 'default' : 'primary'}
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        미정
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // 현재 순위 표시
  const renderCurrentRankings = () => {
    if (!bracketData || !bracketData.participants) return null;

    // 점수순으로 정렬
    const sortedParticipants = [...bracketData.participants].sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points;
      if (a.buchholzScore !== b.buchholzScore) return b.buchholzScore - a.buchholzScore;
      return b.eloRating - a.eloRating;
    });

    return (
      <TableContainer component={Paper} elevation={1}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>순위</TableCell>
              <TableCell>선수명</TableCell>
              <TableCell align="center">점수</TableCell>
              <TableCell align="center">Buchholz</TableCell>
              <TableCell align="center">ELO</TableCell>
              <TableCell align="center">경기수</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedParticipants.map((participant, index) => (
              <TableRow key={participant.id}>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    {index < 3 && (
                      <TrophyIcon 
                        sx={{ 
                          mr: 1, 
                          color: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : '#cd7f32',
                          fontSize: 16
                        }} 
                      />
                    )}
                    {index + 1}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={index < 3 ? 'bold' : 'normal'}>
                    {participant.name}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={participant.points}
                    size="small"
                    color="primary"
                    variant={index < 3 ? 'filled' : 'outlined'}
                  />
                </TableCell>
                <TableCell align="center">
                  {participant.buchholzScore}
                </TableCell>
                <TableCell align="center">
                  {participant.eloRating}
                </TableCell>
                <TableCell align="center">
                  {participant.matchHistory.length}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // 통계 정보 표시
  const renderStatistics = () => {
    if (!bracketData) return null;

    return (
      <Grid container spacing={2}>
        <Grid sx={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                공정성 점수
              </Typography>
              <Box display="flex" alignItems="center">
                <CircularProgress
                  variant="determinate"
                  value={bracketData.fairnessScore}
                  size={60}
                  sx={{ color: getFairnessColor(bracketData.fairnessScore) }}
                />
                <Box ml={2}>
                  <Typography variant="h4" sx={{ color: getFairnessColor(bracketData.fairnessScore) }}>
                    {bracketData.fairnessScore}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid sx={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                평균 ELO 차이
              </Typography>
              <Typography variant="h4">
                {bracketData.statistics.averageEloVariance}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                낮을수록 좋음
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid sx={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                밸런스 점수
              </Typography>
              <Typography variant="h4">
                {bracketData.statistics.balanceScore}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={bracketData.statistics.balanceScore}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid sx={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                재매칭 횟수
              </Typography>
              <Typography variant="h4" color={bracketData.statistics.rematchCount > 0 ? 'error' : 'success'}>
                {bracketData.statistics.rematchCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                적을수록 좋음
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // 설정 다이얼로그
  const renderConfigDialog = () => {
    return (
      <Dialog open={configDialogOpen} onClose={() => setConfigDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Swiss System 설정</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.allowRematch}
                  onChange={(e) => setConfig({ ...config, allowRematch: e.target.checked })}
                />
              }
              label="재매칭 허용"
            />
            <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 4, mt: -1 }}>
              이미 대전한 선수끼리 다시 매칭 허용
            </Typography>

            <Box sx={{ mt: 3 }}>
              <TextField
                fullWidth
                label="최대 ELO 차이"
                type="number"
                value={config.maxEloVariance}
                onChange={(e) => setConfig({ ...config, maxEloVariance: parseInt(e.target.value) || 300 })}
                helperText="같은 라운드에서 매칭될 수 있는 최대 ELO 차이"
                InputProps={{ inputProps: { min: 100, max: 1000 } }}
              />
            </Box>

            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.useBuchholz}
                    onChange={(e) => setConfig({ ...config, useBuchholz: e.target.checked })}
                  />
                }
                label="Buchholz 점수 사용"
              />
              <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 4, mt: -1 }}>
                순위 결정시 상대방들의 점수 합계 고려
              </Typography>
            </Box>

            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.preferBalanced}
                    onChange={(e) => setConfig({ ...config, preferBalanced: e.target.checked })}
                  />
                }
                label="균형 우선 매칭"
              />
              <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 4, mt: -1 }}>
                ELO 차이를 최소화하는 매칭 우선
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialogOpen(false)}>취소</Button>
          <Button
            onClick={() => {
              setConfigDialogOpen(false);
              onGenerateBracket?.(config);
            }}
            variant="contained"
          >
            대진표 생성
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (!bracketData) {
    return (
      <Card>
        <CardContent>
          <Box textAlign="center" py={4}>
            <TimelineIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Swiss System 대진표
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Swiss System 방식으로 대진표를 생성하세요.
              모든 참가자가 동일한 라운드 수를 경기하며, 비슷한 실력끼리 매칭됩니다.
            </Typography>
            {canEdit && (
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={() => setConfigDialogOpen(true)}
              >
                Swiss System 대진표 생성
              </Button>
            )}
          </Box>
        </CardContent>
        {renderConfigDialog()}
      </Card>
    );
  }

  return (
    <Box>
      {/* 헤더 */}
      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Swiss System 대진표
          </Typography>
          <Typography variant="body2" color="text.secondary">
            라운드 {bracketData.currentRound - 1} / {bracketData.totalRounds} 완료
          </Typography>
        </Box>
        <Box>
          {canEdit && (
            <>
              <Tooltip title="설정 변경">
                <IconButton onClick={() => setConfigDialogOpen(true)}>
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
              {bracketData.currentRound <= bracketData.totalRounds && (
                <Button
                  variant="contained"
                  startIcon={<PlayArrowIcon />}
                  onClick={onGenerateNextRound}
                  sx={{ ml: 1 }}
                >
                  다음 라운드 생성
                </Button>
              )}
            </>
          )}
        </Box>
      </Box>

      {/* 진행률 */}
      <Box mb={3}>
        <Typography variant="body2" gutterBottom>
          대회 진행률: {Math.round((bracketData.currentRound - 1) / bracketData.totalRounds * 100)}%
        </Typography>
        <LinearProgress
          variant="determinate"
          value={(bracketData.currentRound - 1) / bracketData.totalRounds * 100}
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Box>

      {/* 통계 */}
      <Box mb={3}>
        {renderStatistics()}
      </Box>

      {/* 아코디언 섹션 */}
      <Box>
        {/* 현재 순위 */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <TrophyIcon sx={{ mr: 1 }} />
            <Typography variant="h6">현재 순위</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {renderCurrentRankings()}
          </AccordionDetails>
        </Accordion>

        {/* 라운드별 경기 */}
        {bracketData.rounds.map((round) => (
          <Accordion key={round.roundNumber}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <TimelineIcon sx={{ mr: 1 }} />
              <Typography variant="h6">
                라운드 {round.roundNumber} ({round.matches.length}경기)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {renderRoundMatches(round)}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      {/* 설정 다이얼로그 */}
      {renderConfigDialog()}

      {/* 완료 메시지 */}
      {bracketData.currentRound > bracketData.totalRounds && (
        <Alert severity="success" sx={{ mt: 3 }}>
          <Typography variant="h6">Swiss System 대회 완료!</Typography>
          <Typography variant="body2">
            모든 라운드가 완료되었습니다. 최종 순위를 확인하세요.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default SwissBracket;