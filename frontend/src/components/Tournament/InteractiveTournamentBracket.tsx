import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  EmojiEvents as TrophyIcon,
  Groups as GroupsIcon,
} from '@mui/icons-material';

interface Match {
  p1: number;
  p2: number;
  score: string;
  result: 'win' | 'lose';
}

interface Group {
  name: string;
  players: string[];
  matches: Match[];
}

interface TournamentMatch {
  player1: string;
  player2: string;
  score1: number;
  score2: number;
  winner: string;
}

interface InteractiveTournamentBracketProps {
  participants?: Array<{ id: string; name: string; }>;
  onBracketUpdate?: (data: any) => void;
  tournamentName?: string;
}

const InteractiveTournamentBracket: React.FC<InteractiveTournamentBracketProps> = ({ 
  participants = [],
  onBracketUpdate,
  tournamentName = "대회" 
}) => {
  // 초기 데이터 설정
  const [groups, setGroups] = useState<Group[]>([
    {
      name: 'A조',
      players: ['1번선수', '2번선수', '3번선수', '4번선수'],
      matches: [
        { p1: 0, p2: 1, score: '11-3', result: 'win' },
        { p1: 0, p2: 2, score: '11-1', result: 'win' },
        { p1: 0, p2: 3, score: '11-8', result: 'win' },
        { p1: 1, p2: 2, score: '11-7', result: 'win' },
        { p1: 1, p2: 3, score: '9-11', result: 'lose' },
        { p1: 2, p2: 3, score: '4-11', result: 'lose' }
      ]
    },
    {
      name: 'B조',
      players: ['5번선수', '6번선수', '7번선수', '8번선수'],
      matches: [
        { p1: 0, p2: 1, score: '11-3', result: 'win' },
        { p1: 0, p2: 2, score: '11-1', result: 'win' },
        { p1: 0, p2: 3, score: '11-8', result: 'win' },
        { p1: 1, p2: 2, score: '11-7', result: 'win' },
        { p1: 1, p2: 3, score: '9-11', result: 'lose' },
        { p1: 2, p2: 3, score: '4-11', result: 'lose' }
      ]
    },
    {
      name: 'C조',
      players: ['9번선수', '10번선수', '11번선수', '12번선수'],
      matches: [
        { p1: 0, p2: 1, score: '11-3', result: 'win' },
        { p1: 0, p2: 2, score: '11-1', result: 'win' },
        { p1: 0, p2: 3, score: '11-8', result: 'win' },
        { p1: 1, p2: 2, score: '11-7', result: 'win' },
        { p1: 1, p2: 3, score: '9-11', result: 'lose' },
        { p1: 2, p2: 3, score: '4-11', result: 'lose' }
      ]
    },
    {
      name: 'D조',
      players: ['13번선수', '14번선수', '15번선수', '16번선수'],
      matches: [
        { p1: 0, p2: 1, score: '11-3', result: 'win' },
        { p1: 0, p2: 2, score: '11-1', result: 'win' },
        { p1: 0, p2: 3, score: '11-8', result: 'win' },
        { p1: 1, p2: 2, score: '11-7', result: 'win' },
        { p1: 1, p2: 3, score: '9-11', result: 'lose' },
        { p1: 2, p2: 3, score: '4-11', result: 'lose' }
      ]
    }
  ]);

  const [tournament, setTournament] = useState<TournamentMatch[]>([
    { player1: '1번선수', player2: '8번선수', score1: 11, score2: 5, winner: '1번선수' },
    { player1: '4번선수', player2: '5번선수', score1: 11, score2: 0, winner: '4번선수' },
    { player1: '9번선수', player2: '16번선수', score1: 6, score2: 11, winner: '16번선수' },
    { player1: '12번선수', player2: '13번선수', score1: 9, score2: 11, winner: '13번선수' }
  ]);

  const [semifinals, setSemifinals] = useState<TournamentMatch[]>([
    { player1: '1번선수', player2: '4번선수', score1: 3, score2: 11, winner: '4번선수' },
    { player1: '16번선수', player2: '13번선수', score1: 2, score2: 11, winner: '13번선수' }
  ]);

  const [final, setFinal] = useState<TournamentMatch>({
    player1: '4번선수', player2: '13번선수', score1: 11, score2: 10, winner: '4번선수'
  });

  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // 참가자 데이터로 초기화
  useEffect(() => {
    if (participants.length >= 16) {
      const newGroups = [
        {
          name: 'A조',
          players: participants.slice(0, 4).map(p => p.name),
          matches: generateEmptyMatches()
        },
        {
          name: 'B조', 
          players: participants.slice(4, 8).map(p => p.name),
          matches: generateEmptyMatches()
        },
        {
          name: 'C조',
          players: participants.slice(8, 12).map(p => p.name),
          matches: generateEmptyMatches()
        },
        {
          name: 'D조',
          players: participants.slice(12, 16).map(p => p.name),
          matches: generateEmptyMatches()
        }
      ];
      setGroups(newGroups);
    }
  }, [participants]);

  const generateEmptyMatches = (): Match[] => [
    { p1: 0, p2: 1, score: '0-0', result: 'win' },
    { p1: 0, p2: 2, score: '0-0', result: 'win' },
    { p1: 0, p2: 3, score: '0-0', result: 'win' },
    { p1: 1, p2: 2, score: '0-0', result: 'win' },
    { p1: 1, p2: 3, score: '0-0', result: 'win' },
    { p1: 2, p2: 3, score: '0-0', result: 'win' }
  ];

  // 조별 성적 계산
  const calculateGroupStats = (group: Group) => {
    const stats = group.players.map((player, index) => ({
      player,
      wins: 0,
      losses: 0
    }));

    group.matches.forEach(match => {
      if (match.result === 'win') {
        stats[match.p1].wins++;
        stats[match.p2].losses++;
      } else {
        stats[match.p1].losses++;
        stats[match.p2].wins++;
      }
    });

    return stats.sort((a, b) => b.wins - a.wins);
  };

  // 데이터 변경 시 콜백 호출
  useEffect(() => {
    if (onBracketUpdate) {
      const bracketData = {
        groups,
        tournament,
        semifinals,
        final,
        type: 'interactive_bracket'
      };
      onBracketUpdate(bracketData);
    }
  }, [groups, tournament, semifinals, final, onBracketUpdate]);

  // 편집 가능한 셀 컴포넌트
  const EditableCell: React.FC<{
    value: string;
    cellId: string;
    onSave: (value: string) => void;
    type?: 'text' | 'number';
  }> = ({ value, cellId, onSave, type = 'text' }) => {
    const isEditing = editingCell === cellId;

    const handleEdit = () => {
      setEditingCell(cellId);
      setEditValue(value);
    };

    const handleSave = () => {
      onSave(editValue);
      setEditingCell(null);
    };

    const handleCancel = () => {
      setEditingCell(null);
      setEditValue('');
    };

    if (isEditing) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <TextField
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            variant="outlined"
            size="small"
            type={type}
            sx={{ width: '80px' }}
            autoFocus
            onKeyPress={(e) => e.key === 'Enter' && handleSave()}
          />
          <IconButton size="small" onClick={handleSave} color="success">
            <SaveIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={handleCancel} color="error">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      );
    }

    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          cursor: 'pointer',
          p: 0.5,
          '&:hover': { bgcolor: 'grey.100' },
          borderRadius: 1
        }}
        onClick={handleEdit}
      >
        <Typography variant="body2">{value}</Typography>
        <EditIcon sx={{ fontSize: 14, color: 'grey.400' }} />
      </Box>
    );
  };

  // 업데이트 함수들
  const updatePlayerName = (groupIndex: number, playerIndex: number, newName: string) => {
    setGroups(prev => prev.map((group, gIdx) => 
      gIdx === groupIndex 
        ? { ...group, players: group.players.map((player, pIdx) => 
            pIdx === playerIndex ? newName : player
          )}
        : group
    ));
  };

  const updateMatchScore = (groupIndex: number, matchIndex: number, newScore: string) => {
    const [score1, score2] = newScore.split('-').map(s => parseInt(s) || 0);
    const result = score1 > score2 ? 'win' : 'lose';
    
    setGroups(prev => prev.map((group, gIdx) => 
      gIdx === groupIndex 
        ? { ...group, matches: group.matches.map((match, mIdx) => 
            mIdx === matchIndex ? { ...match, score: newScore, result } : match
          )}
        : group
    ));
  };

  const updateTournamentMatch = (index: number, field: keyof TournamentMatch, value: string | number) => {
    setTournament(prev => prev.map((match, idx) => 
      idx === index ? { ...match, [field]: value } : match
    ));
  };

  const updateSemifinalMatch = (index: number, field: keyof TournamentMatch, value: string | number) => {
    setSemifinals(prev => prev.map((match, idx) => 
      idx === index ? { ...match, [field]: value } : match
    ));
  };

  const updateFinalMatch = (field: keyof TournamentMatch, value: string | number) => {
    setFinal(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Box sx={{ p: 3, maxWidth: '1400px', mx: 'auto' }}>
      <Box textAlign="center" mb={4}>
        <Typography variant="h3" component="h1" fontWeight="bold" color="primary" mb={1}>
          {tournamentName} 대진표
        </Typography>
        <Typography variant="body1" color="text.secondary">
          선수명과 점수를 클릭하여 편집할 수 있습니다
        </Typography>
      </Box>

      {/* 예선 리그전 */}
      <Box mb={6}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <GroupsIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" component="h2" fontWeight="bold" color="primary">
            예선 리그전
          </Typography>
        </Box>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
          {groups.map((group, groupIndex) => {
            const stats = calculateGroupStats(group);
            const qualifiers = stats.slice(0, 2);
            
            return (
              <Box key={group.name}>
                <Card elevation={3}>
                  <CardContent>
                    <Typography variant="h5" component="h3" fontWeight="bold" textAlign="center" mb={2} color="primary">
                      {group.name}
                    </Typography>
                    
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'primary.light' }}>
                            <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>선수</TableCell>
                            {group.players.map((player, idx) => (
                              <TableCell key={idx} align="center" sx={{ fontWeight: 'bold', color: 'white', minWidth: 80 }}>
                                <EditableCell 
                                  value={player} 
                                  cellId={`group-${groupIndex}-player-${idx}`}
                                  onSave={(value) => updatePlayerName(groupIndex, idx, value)}
                                />
                              </TableCell>
                            ))}
                            <TableCell align="center" sx={{ fontWeight: 'bold', color: 'white' }}>승패</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', color: 'white' }}>결과</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {group.players.map((player, playerIndex) => (
                            <TableRow key={playerIndex} sx={{ '&:nth-of-type(odd)': { bgcolor: 'grey.50' } }}>
                              <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>
                                <EditableCell 
                                  value={player} 
                                  cellId={`group-${groupIndex}-row-player-${playerIndex}`}
                                  onSave={(value) => updatePlayerName(groupIndex, playerIndex, value)}
                                />
                              </TableCell>
                              {group.players.map((_, opponentIndex) => {
                                if (playerIndex === opponentIndex) {
                                  return <TableCell key={opponentIndex} align="center" sx={{ bgcolor: 'grey.200' }}>-</TableCell>;
                                }
                                
                                const match = group.matches.find(m => 
                                  (m.p1 === playerIndex && m.p2 === opponentIndex) ||
                                  (m.p1 === opponentIndex && m.p2 === playerIndex)
                                );
                                
                                if (match) {
                                  let displayScore = match.score;
                                  if (match.p1 === opponentIndex) {
                                    const [s1, s2] = match.score.split('-');
                                    displayScore = `${s2}-${s1}`;
                                  }
                                  
                                  const matchIndex = group.matches.indexOf(match);
                                  return (
                                    <TableCell key={opponentIndex} align="center">
                                      <EditableCell 
                                        value={displayScore} 
                                        cellId={`group-${groupIndex}-match-${matchIndex}-${playerIndex}-${opponentIndex}`}
                                        onSave={(value) => updateMatchScore(groupIndex, matchIndex, value)}
                                      />
                                    </TableCell>
                                  );
                                }
                                
                                return <TableCell key={opponentIndex} align="center">-</TableCell>;
                              })}
                              
                              <TableCell align="center">
                                <Typography variant="body2">
                                  {stats.find(s => s.player === player)?.wins}승 {stats.find(s => s.player === player)?.losses}패
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                {qualifiers.some(q => q.player === player) ? 
                                  <Chip label="본선진출" color="success" size="small" /> : 
                                  <Chip label="탈락" color="default" size="small" />
                                }
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* 본선 토너먼트 */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <TrophyIcon color="error" sx={{ fontSize: 32 }} />
          <Typography variant="h4" component="h2" fontWeight="bold" color="error">
            본선 토너먼트
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          {/* 8강 */}
          <Box>
            <Typography variant="h5" component="h3" fontWeight="bold" textAlign="center" mb={2} color="error">
              8강
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, justifyItems: 'center' }}>
              {tournament.map((match, index) => (
                <Box key={index} sx={{ width: '100%', maxWidth: 300 }}>
                  <Card sx={{ bgcolor: 'error.light', color: 'white' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <EditableCell 
                          value={match.player1} 
                          cellId={`tournament-${index}-player1`}
                          onSave={(value) => updateTournamentMatch(index, 'player1', value)}
                        />
                        <EditableCell 
                          value={match.score1.toString()} 
                          cellId={`tournament-${index}-score1`}
                          onSave={(value) => updateTournamentMatch(index, 'score1', parseInt(value) || 0)}
                          type="number"
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <EditableCell 
                          value={match.player2} 
                          cellId={`tournament-${index}-player2`}
                          onSave={(value) => updateTournamentMatch(index, 'player2', value)}
                        />
                        <EditableCell 
                          value={match.score2.toString()} 
                          cellId={`tournament-${index}-score2`}
                          onSave={(value) => updateTournamentMatch(index, 'score2', parseInt(value) || 0)}
                          type="number"
                        />
                      </Box>
                      <Typography variant="body2" textAlign="center" fontWeight="bold">
                        승자: {match.winner}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>
          </Box>

          {/* 4강 */}
          <Box>
            <Typography variant="h5" component="h3" fontWeight="bold" textAlign="center" mb={2} color="error">
              4강
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, justifyItems: 'center' }}>
              {semifinals.map((match, index) => (
                <Box key={index} sx={{ width: '100%', maxWidth: 400 }}>
                  <Card sx={{ bgcolor: 'error.light', color: 'white' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <EditableCell 
                          value={match.player1} 
                          cellId={`semifinal-${index}-player1`}
                          onSave={(value) => updateSemifinalMatch(index, 'player1', value)}
                        />
                        <EditableCell 
                          value={match.score1.toString()} 
                          cellId={`semifinal-${index}-score1`}
                          onSave={(value) => updateSemifinalMatch(index, 'score1', parseInt(value) || 0)}
                          type="number"
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <EditableCell 
                          value={match.player2} 
                          cellId={`semifinal-${index}-player2`}
                          onSave={(value) => updateSemifinalMatch(index, 'player2', value)}
                        />
                        <EditableCell 
                          value={match.score2.toString()} 
                          cellId={`semifinal-${index}-score2`}
                          onSave={(value) => updateSemifinalMatch(index, 'score2', parseInt(value) || 0)}
                          type="number"
                        />
                      </Box>
                      <Typography variant="body2" textAlign="center" fontWeight="bold">
                        승자: {match.winner}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>
          </Box>

          {/* 결승 */}
          <Box>
            <Typography variant="h5" component="h3" fontWeight="bold" textAlign="center" mb={2} color="error">
              결승
            </Typography>
            <Card sx={{ 
              maxWidth: 400, 
              mx: 'auto',
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
              color: 'white'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <EditableCell 
                    value={final.player1} 
                    cellId="final-player1"
                    onSave={(value) => updateFinalMatch('player1', value)}
                  />
                  <EditableCell 
                    value={final.score1.toString()} 
                    cellId="final-score1"
                    onSave={(value) => updateFinalMatch('score1', parseInt(value as string) || 0)}
                    type="number"
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <EditableCell 
                    value={final.player2} 
                    cellId="final-player2"
                    onSave={(value) => updateFinalMatch('player2', value)}
                  />
                  <EditableCell 
                    value={final.score2.toString()} 
                    cellId="final-score2"
                    onSave={(value) => updateFinalMatch('score2', parseInt(value as string) || 0)}
                    type="number"
                  />
                </Box>
                <Box textAlign="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <TrophyIcon />
                    <Typography variant="h6" fontWeight="bold">
                      우승: {final.winner}
                    </Typography>
                    <TrophyIcon />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>

      <Box mt={4} textAlign="center">
        <Typography variant="body2" color="text.secondary" mb={2}>
          💡 팁: 선수명이나 점수를 클릭하면 편집할 수 있습니다. Enter키를 누르거나 저장 버튼을 클릭하여 변경사항을 저장하세요.
        </Typography>
        <Box sx={{ mt: 3, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom color="primary">
            대진표 데이터 연동
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            커스텀 생성기에서 편집한 결과를 기본 대진표에 반영하려면 아래 버튼을 클릭하세요.
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            현재 커스텀 생성기는 독립적으로 작동합니다. 기본 대진표와의 실시간 연동은 개발 중입니다.
          </Alert>
        </Box>
      </Box>
    </Box>
  );
};

export default InteractiveTournamentBracket;