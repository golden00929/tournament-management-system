import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Grid,
  Paper,
  Divider,
  Alert,
  IconButton,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Tooltip,
  Switch,
  FormControlLabel,
  Stack,
  Badge,
} from '@mui/material';
import {
  Add,
  Delete,
  Settings,
  Shuffle,
  PlayArrow,
  Edit,
  Save,
  Cancel,
  DragHandle,
  Group,
  EmojiEvents,
  Schedule,
  Refresh,
  ExpandMore,
  People,
  SportsTennis,
  TableChart,
  Hub,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface Player {
  id: string;
  name: string;
  eloRating: number;
  skillLevel: string;
  province?: string;
  district?: string;
}

interface Group {
  id: string;
  name: string;
  players: Player[];
  advancingCount: number;
  matches: Match[];
}

interface Match {
  id: string;
  player1: Player | null;
  player2: Player | null;
  player1Score: number;
  player2Score: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  round: string;
  matchNumber: number;
  court?: string;
  scheduledTime?: Date;
  winnerId?: string;
}

interface BracketSettings {
  tournamentType: 'groups_only' | 'knockout_only' | 'groups_knockout' | 'swiss_system';
  groupCount: number;
  playersPerGroup: number;
  advancingPerGroup: number;
  knockoutType: 'single_elimination' | 'double_elimination';
  seedingMethod: 'elo' | 'manual' | 'random';
  enableThirdPlace: boolean;
  roundRobinInGroups: boolean;
}

interface CustomTournamentBracketProps {
  participants: Player[];
  onBracketGenerated: (bracket: any) => void;
  onMatchUpdate: (matchId: string, result: any) => void;
  isLoading?: boolean;
}

const CustomTournamentBracket: React.FC<CustomTournamentBracketProps> = ({
  participants,
  onBracketGenerated,
  onMatchUpdate,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [scoreDialog, setScoreDialog] = useState(false);
  
  const [settings, setSettings] = useState<BracketSettings>({
    tournamentType: 'groups_knockout',
    groupCount: 4,
    playersPerGroup: 4,
    advancingPerGroup: 2,
    knockoutType: 'single_elimination',
    seedingMethod: 'elo',
    enableThirdPlace: false,
    roundRobinInGroups: true,
  });

  const [groups, setGroups] = useState<Group[]>([]);
  const [knockoutBracket, setKnockoutBracket] = useState<Match[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>(participants);

  // 초기화
  useEffect(() => {
    setAvailablePlayers(participants);
  }, [participants]);

  // 그룹 생성 및 시딩
  const generateGroups = () => {
    if (availablePlayers.length === 0) return;

    const newGroups: Group[] = [];
    const playersCopy = [...availablePlayers];

    // 시딩 방법에 따른 정렬
    if (settings.seedingMethod === 'elo') {
      playersCopy.sort((a, b) => b.eloRating - a.eloRating);
    } else if (settings.seedingMethod === 'random') {
      for (let i = playersCopy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [playersCopy[i], playersCopy[j]] = [playersCopy[j], playersCopy[i]];
      }
    }

    // 그룹 배정 (스네이크 드래프트 방식)
    for (let i = 0; i < settings.groupCount; i++) {
      newGroups.push({
        id: `group-${i + 1}`,
        name: `${t('tournament.group')} ${String.fromCharCode(65 + i)}`,
        players: [],
        advancingCount: settings.advancingPerGroup,
        matches: [],
      });
    }

    let groupIndex = 0;
    let direction = 1;

    playersCopy.forEach((player, index) => {
      newGroups[groupIndex].players.push(player);
      
      if (direction === 1) {
        groupIndex++;
        if (groupIndex >= settings.groupCount) {
          groupIndex = settings.groupCount - 1;
          direction = -1;
        }
      } else {
        groupIndex--;
        if (groupIndex < 0) {
          groupIndex = 0;
          direction = 1;
        }
      }
    });

    // 각 그룹에서 리그전 경기 생성
    if (settings.roundRobinInGroups) {
      newGroups.forEach(group => {
        group.matches = generateRoundRobinMatches(group.players, group.id);
      });
    }

    setGroups(newGroups);
    setActiveStep(1);
  };

  // 리그전 경기 생성
  const generateRoundRobinMatches = (players: Player[], groupId: string): Match[] => {
    const matches: Match[] = [];
    let matchNumber = 1;

    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        matches.push({
          id: `${groupId}-match-${matchNumber}`,
          player1: players[i],
          player2: players[j],
          player1Score: 0,
          player2Score: 0,
          status: 'scheduled',
          round: 'group_stage',
          matchNumber,
          court: `Court ${Math.ceil(matchNumber / 2)}`,
        });
        matchNumber++;
      }
    }

    return matches;
  };

  // 본선 토너먼트 생성
  const generateKnockoutBracket = () => {
    if (settings.tournamentType === 'groups_only') {
      setActiveStep(2);
      return;
    }

    const advancingPlayers: Player[] = [];
    
    // 각 그룹에서 진출자 선별
    groups.forEach(group => {
      const groupStandings = calculateGroupStandings(group);
      advancingPlayers.push(...groupStandings.slice(0, group.advancingCount));
    });

    // 토너먼트 브라켓 생성
    const knockoutMatches = generateSingleEliminationBracket(advancingPlayers);
    setKnockoutBracket(knockoutMatches);
    setActiveStep(2);
  };

  // 그룹 순위 계산
  const calculateGroupStandings = (group: Group): Player[] => {
    const standings = group.players.map(player => {
      let wins = 0;
      let losses = 0;
      let pointsFor = 0;
      let pointsAgainst = 0;

      group.matches.forEach(match => {
        if (match.status === 'completed') {
          if (match.player1?.id === player.id) {
            pointsFor += match.player1Score;
            pointsAgainst += match.player2Score;
            if (match.winnerId === player.id) wins++;
            else losses++;
          } else if (match.player2?.id === player.id) {
            pointsFor += match.player2Score;
            pointsAgainst += match.player1Score;
            if (match.winnerId === player.id) wins++;
            else losses++;
          }
        }
      });

      return {
        ...player,
        wins,
        losses,
        pointsFor,
        pointsAgainst,
        pointDiff: pointsFor - pointsAgainst,
        winRate: wins + losses > 0 ? wins / (wins + losses) : 0,
      };
    });

    // 순위 정렬: 승수 > 승률 > 득실차 > ELO
    return standings.sort((a, b) => {
      if (a.wins !== b.wins) return b.wins - a.wins;
      if (a.winRate !== b.winRate) return b.winRate - a.winRate;
      if (a.pointDiff !== b.pointDiff) return b.pointDiff - a.pointDiff;
      return b.eloRating - a.eloRating;
    });
  };

  // 싱글 엘리미네이션 브라켓 생성
  const generateSingleEliminationBracket = (players: Player[]): Match[] => {
    const matches: Match[] = [];
    let matchId = 1;
    let currentRound = players.slice();

    // 2의 제곱수로 맞추기 위해 부전승 처리
    const targetSize = Math.pow(2, Math.ceil(Math.log2(currentRound.length)));
    while (currentRound.length < targetSize) {
      currentRound.push(null as any);
    }

    let roundNumber = 1;
    const totalRounds = Math.log2(targetSize);

    while (currentRound.length > 1) {
      const roundMatches: Match[] = [];
      const nextRound: (Player | null)[] = [];

      for (let i = 0; i < currentRound.length; i += 2) {
        const player1 = currentRound[i];
        const player2 = currentRound[i + 1];

        const match: Match = {
          id: `knockout-${matchId}`,
          player1,
          player2,
          player1Score: 0,
          player2Score: 0,
          status: 'scheduled',
          round: getRoundName(roundNumber, totalRounds),
          matchNumber: matchId,
        };

        roundMatches.push(match);
        nextRound.push(null); // 승자가 들어갈 자리
        matchId++;
      }

      matches.push(...roundMatches);
      currentRound = nextRound;
      roundNumber++;
    }

    return matches;
  };

  // 라운드 이름 생성
  const getRoundName = (roundNumber: number, totalRounds: number): string => {
    const roundsLeft = totalRounds - roundNumber + 1;
    
    if (roundsLeft === 1) return t('tournament.final');
    if (roundsLeft === 2) return t('tournament.semifinal');
    if (roundsLeft === 3) return t('tournament.quarterfinal');
    return `${t('tournament.round')} ${roundNumber}`;
  };

  // 점수 업데이트 처리
  const handleScoreUpdate = (matchId: string, player1Score: number, player2Score: number) => {
    const winnerId = player1Score > player2Score 
      ? editingMatch?.player1?.id 
      : editingMatch?.player2?.id;

    const result = {
      player1Score,
      player2Score,
      winnerId,
      status: 'completed' as const,
    };

    onMatchUpdate(matchId, result);
    
    // 로컬 상태 업데이트
    updateLocalMatch(matchId, result);
    setScoreDialog(false);
    setEditingMatch(null);
  };

  // 로컬 경기 상태 업데이트
  const updateLocalMatch = (matchId: string, result: any) => {
    // 그룹 경기 업데이트
    setGroups(prevGroups => 
      prevGroups.map(group => ({
        ...group,
        matches: group.matches.map(match =>
          match.id === matchId ? { ...match, ...result } : match
        ),
      }))
    );

    // 본선 경기 업데이트
    setKnockoutBracket(prevMatches =>
      prevMatches.map(match =>
        match.id === matchId ? { ...match, ...result } : match
      )
    );
  };

  // 플레이어 드래그 앤 드롭
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    // 그룹 간 플레이어 이동 로직
    if (source.droppableId !== destination.droppableId) {
      const sourceGroup = groups.find(g => g.id === source.droppableId);
      const destGroup = groups.find(g => g.id === destination.droppableId);
      
      if (sourceGroup && destGroup) {
        const [movedPlayer] = sourceGroup.players.splice(source.index, 1);
        destGroup.players.splice(destination.index, 0, movedPlayer);
        
        setGroups([...groups]);
      }
    }
  };

  // 설정 변경 핸들러
  const handleSettingsChange = (field: keyof BracketSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const steps = [
    {
      label: t('tournament.bracketSettings'),
      description: t('tournament.configureBasicSettings'),
    },
    {
      label: t('tournament.groupStage'),
      description: t('tournament.manageGroupMatches'),
    },
    {
      label: t('tournament.knockoutStage'),
      description: t('tournament.finalTournament'),
    },
  ];

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      {/* 헤더 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            🏆 {t('customBracket.customBracketGenerator')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('tournament.customBracketDescription')}
          </Typography>
        </CardContent>
      </Card>

      {/* 진행 단계 */}
      <Stepper activeStep={activeStep} orientation="vertical" sx={{ mb: 3 }}>
        {steps.map((step, index) => (
          <Step key={index}>
            <StepLabel>
              <Typography variant="h6">{step.label}</Typography>
            </StepLabel>
            <StepContent>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {step.description}
              </Typography>

              {/* 단계별 컨텐츠 */}
              {index === 0 && (
                <Card sx={{ p: 2, mb: 2 }}>
                  <Grid container spacing={2}>
                    {/* 토너먼트 형식 */}
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>{t('tournament.tournamentType')}</InputLabel>
                        <Select
                          value={settings.tournamentType}
                          onChange={(e) => handleSettingsChange('tournamentType', e.target.value)}
                        >
                          <MenuItem value="groups_only">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Group />
                              {t('tournament.groupsOnly')}
                            </Box>
                          </MenuItem>
                          <MenuItem value="knockout_only">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <EmojiEvents />
                              {t('tournament.knockoutOnly')}
                            </Box>
                          </MenuItem>
                          <MenuItem value="groups_knockout">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Hub />
                              {t('tournament.groupsKnockout')}
                            </Box>
                          </MenuItem>
                          <MenuItem value="swiss_system">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <TableChart />
                              {t('tournament.swissSystem')}
                            </Box>
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* 시딩 방법 */}
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>{t('tournament.seedingMethod')}</InputLabel>
                        <Select
                          value={settings.seedingMethod}
                          onChange={(e) => handleSettingsChange('seedingMethod', e.target.value)}
                        >
                          <MenuItem value="elo">ELO {t('tournament.rating')}</MenuItem>
                          <MenuItem value="manual">{t('tournament.manual')}</MenuItem>
                          <MenuItem value="random">{t('tournament.random')}</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* 그룹 설정 (그룹이 포함된 경우만) */}
                    {(settings.tournamentType === 'groups_only' || settings.tournamentType === 'groups_knockout') && (
                      <>
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            type="number"
                            label={t('tournament.groupCount')}
                            value={settings.groupCount}
                            onChange={(e) => handleSettingsChange('groupCount', parseInt(e.target.value))}
                            inputProps={{ min: 2, max: 8 }}
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            type="number"
                            label={t('tournament.playersPerGroup')}
                            value={settings.playersPerGroup}
                            onChange={(e) => handleSettingsChange('playersPerGroup', parseInt(e.target.value))}
                            inputProps={{ min: 3, max: 8 }}
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            type="number"
                            label={t('tournament.advancingPerGroup')}
                            value={settings.advancingPerGroup}
                            onChange={(e) => handleSettingsChange('advancingPerGroup', parseInt(e.target.value))}
                            inputProps={{ min: 1, max: settings.playersPerGroup - 1 }}
                          />
                        </Grid>
                      </>
                    )}

                    {/* 추가 옵션 */}
                    <Grid item xs={12}>
                      <Stack direction="row" spacing={2} flexWrap="wrap">
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.roundRobinInGroups}
                              onChange={(e) => handleSettingsChange('roundRobinInGroups', e.target.checked)}
                            />
                          }
                          label={t('tournament.roundRobinInGroups')}
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.enableThirdPlace}
                              onChange={(e) => handleSettingsChange('enableThirdPlace', e.target.checked)}
                            />
                          }
                          label={t('tournament.enableThirdPlace')}
                        />
                      </Stack>
                    </Grid>

                    {/* 참가자 정보 */}
                    <Grid item xs={12}>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          {t('tournament.participantCount', { count: availablePlayers.length })}
                        </Typography>
                      </Alert>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={generateGroups}
                      startIcon={<PlayArrow />}
                      disabled={availablePlayers.length === 0}
                    >
                      {t('tournament.generateBracket')}
                    </Button>
                  </Box>
                </Card>
              )}

              {/* 그룹 스테이지 */}
              {index === 1 && groups.length > 0 && (
                <Box>
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Grid container spacing={2}>
                      {groups.map((group, groupIndex) => (
                        <Grid item xs={12} md={6} key={group.id}>
                          <Card>
                            <CardContent>
                              <Typography variant="h6" gutterBottom>
                                {group.name}
                                <Chip
                                  size="small"
                                  label={`${group.players.length}명`}
                                  sx={{ ml: 1 }}
                                />
                              </Typography>

                              {/* 참가자 목록 */}
                              <Droppable droppableId={group.id}>
                                {(provided, snapshot) => (
                                  <List
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    sx={{
                                      minHeight: 100,
                                      bgcolor: snapshot.isDraggingOver ? 'action.hover' : 'inherit',
                                      borderRadius: 1,
                                    }}
                                  >
                                    {group.players.map((player, playerIndex) => (
                                      <Draggable
                                        key={player.id}
                                        draggableId={player.id}
                                        index={playerIndex}
                                      >
                                        {(provided, snapshot) => (
                                          <ListItem
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            sx={{
                                              bgcolor: snapshot.isDragging ? 'action.selected' : 'inherit',
                                              borderRadius: 1,
                                              mb: 0.5,
                                            }}
                                          >
                                            <DragHandle sx={{ mr: 1, color: 'text.secondary' }} />
                                            <ListItemText
                                              primary={player.name}
                                              secondary={`ELO: ${player.eloRating}`}
                                            />
                                          </ListItem>
                                        )}
                                      </Draggable>
                                    ))}
                                    {provided.placeholder}
                                  </List>
                                )}
                              </Droppable>

                              {/* 그룹 경기 목록 */}
                              {group.matches.length > 0 && (
                                <Box sx={{ mt: 2 }}>
                                  <Typography variant="subtitle2" gutterBottom>
                                    {t('tournament.groupMatches')}
                                  </Typography>
                                  {group.matches.map((match) => (
                                    <Paper
                                      key={match.id}
                                      sx={{ p: 1, mb: 1, cursor: 'pointer' }}
                                      onClick={() => {
                                        setEditingMatch(match);
                                        setScoreDialog(true);
                                      }}
                                    >
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="body2">
                                          {match.player1?.name} vs {match.player2?.name}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          {match.status === 'completed' ? (
                                            <Chip
                                              size="small"
                                              label={`${match.player1Score}-${match.player2Score}`}
                                              color="primary"
                                            />
                                          ) : (
                                            <Chip size="small" label={t(`tournament.${match.status}`)} />
                                          )}
                                          <IconButton size="small">
                                            <Edit fontSize="small" />
                                          </IconButton>
                                        </Box>
                                      </Box>
                                    </Paper>
                                  ))}
                                </Box>
                              )}
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </DragDropContext>

                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={generateKnockoutBracket}
                      startIcon={<EmojiEvents />}
                    >
                      {t('tournament.generateKnockout')}
                    </Button>
                  </Box>
                </Box>
              )}

              {/* 본선 토너먼트 */}
              {index === 2 && knockoutBracket.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {t('tournament.knockoutBracket')}
                  </Typography>
                  <Grid container spacing={2}>
                    {knockoutBracket.map((match) => (
                      <Grid item xs={12} md={6} key={match.id}>
                        <Paper
                          sx={{ p: 2, cursor: 'pointer' }}
                          onClick={() => {
                            setEditingMatch(match);
                            setScoreDialog(true);
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="subtitle2">
                                {match.round} - Match {match.matchNumber}
                              </Typography>
                              <Typography variant="body1">
                                {match.player1?.name || 'TBD'} vs {match.player2?.name || 'TBD'}
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              {match.status === 'completed' ? (
                                <Typography variant="h6">
                                  {match.player1Score}-{match.player2Score}
                                </Typography>
                              ) : (
                                <Chip label={t(`tournament.${match.status}`)} />
                              )}
                            </Box>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </StepContent>
          </Step>
        ))}
      </Stepper>

      {/* 점수 입력 다이얼로그 */}
      <Dialog open={scoreDialog} onClose={() => setScoreDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {t('tournament.enterScore')}
        </DialogTitle>
        <DialogContent>
          {editingMatch && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={4}>
                  <Typography variant="h6" align="center">
                    {editingMatch.player1?.name}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <TextField
                      type="number"
                      size="small"
                      sx={{ width: 60 }}
                      defaultValue={editingMatch.player1Score}
                      inputProps={{ min: 0, max: 99 }}
                      id="player1Score"
                    />
                    <Typography variant="h5" sx={{ alignSelf: 'center' }}>
                      :
                    </Typography>
                    <TextField
                      type="number"
                      size="small"
                      sx={{ width: 60 }}
                      defaultValue={editingMatch.player2Score}
                      inputProps={{ min: 0, max: 99 }}
                      id="player2Score"
                    />
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="h6" align="center">
                    {editingMatch.player2?.name}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScoreDialog(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              const player1Score = parseInt(
                (document.getElementById('player1Score') as HTMLInputElement)?.value || '0'
              );
              const player2Score = parseInt(
                (document.getElementById('player2Score') as HTMLInputElement)?.value || '0'
              );
              handleScoreUpdate(editingMatch!.id, player1Score, player2Score);
            }}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomTournamentBracket;