import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Edit,
  Save,
  Close,
  EmojiEvents,
  Groups,
} from '@mui/icons-material';

interface Match {
  id: string;
  matchNumber: number;
  roundName: string;
  player1?: {
    id: string;
    name: string;
  };
  player2?: {
    id: string;
    name: string;
  };
  player1Name?: string;
  player2Name?: string;
  player1Score?: number;
  player2Score?: number;
  status: 'pending' | 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  winnerId?: string;
}

interface InteractiveMatchBracketProps {
  matches: Match[];
  onMatchUpdate?: (matchId: string, updates: any) => void;
}

interface GroupStats {
  player: string;
  wins: number;
  losses: number;
  qualified: boolean;
}

const InteractiveMatchBracket: React.FC<InteractiveMatchBracketProps> = ({ 
  matches, 
  onMatchUpdate 
}) => {
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');

  // 조별로 매치 분류
  const groupMatches = matches.reduce((acc: any, match) => {
    let groupName = 'Group';
    if (match.roundName.includes('Group')) {
      const groupMatch = match.roundName.match(/Group\s+([A-Z])/);
      if (groupMatch) {
        groupName = `Group ${groupMatch[1]}`;
      }
    } else {
      groupName = match.roundName;
    }
    
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(match);
    return acc;
  }, {});

  // 조별 리그 그룹들 (Group으로 시작하는 것들)
  const leagueGroups = Object.keys(groupMatches).filter(key => key.startsWith('Group'));
  
  // 토너먼트 라운드들 (Group이 아닌 것들)
  const tournamentRounds = Object.keys(groupMatches).filter(key => !key.startsWith('Group'));

  // 조별 통계 계산
  const calculateGroupStats = (matches: Match[]): GroupStats[] => {
    const playerStats: { [key: string]: GroupStats } = {};
    
    // 모든 선수 초기화
    matches.forEach(match => {
      const player1Name = match.player1?.name || match.player1Name || 'TBD';
      const player2Name = match.player2?.name || match.player2Name || 'TBD';
      
      if (player1Name !== 'TBD' && !playerStats[player1Name]) {
        playerStats[player1Name] = { player: player1Name, wins: 0, losses: 0, qualified: false };
      }
      if (player2Name !== 'TBD' && !playerStats[player2Name]) {
        playerStats[player2Name] = { player: player2Name, wins: 0, losses: 0, qualified: false };
      }
    });

    // 경기 결과 집계
    matches.forEach(match => {
      if (match.status === 'completed' && match.winnerId) {
        const player1Name = match.player1?.name || match.player1Name || 'TBD';
        const player2Name = match.player2?.name || match.player2Name || 'TBD';
        
        if (match.winnerId === match.player1?.id || match.winnerId === player1Name) {
          if (playerStats[player1Name]) playerStats[player1Name].wins++;
          if (playerStats[player2Name]) playerStats[player2Name].losses++;
        } else if (match.winnerId === match.player2?.id || match.winnerId === player2Name) {
          if (playerStats[player2Name]) playerStats[player2Name].wins++;
          if (playerStats[player1Name]) playerStats[player1Name].losses++;
        }
      }
    });

    // 순위 정렬
    const sortedStats = Object.values(playerStats).sort((a, b) => b.wins - a.wins);
    
    // 상위 2명 본선 진출
    sortedStats.forEach((stat, index) => {
      stat.qualified = index < 2;
    });

    return sortedStats;
  };

  // 편집 가능한 셀 컴포넌트
  const EditableCell: React.FC<{
    value: string | number;
    onSave: (value: string) => void;
    type?: 'text' | 'number';
  }> = ({ value, onSave, type = 'text' }) => {
    const cellKey = `${value}-${type}`;
    const isEditing = editingCell === cellKey;

    const handleEdit = () => {
      setEditingCell(cellKey);
      setTempValue(value.toString());
    };

    const handleSave = () => {
      onSave(tempValue);
      setEditingCell(null);
      setTempValue('');
    };

    const handleCancel = () => {
      setEditingCell(null);
      setTempValue('');
    };

    if (isEditing) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 120 }}>
          <TextField
            size="small"
            type={type}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSave()}
            sx={{ width: type === 'number' ? 60 : 100 }}
            autoFocus
          />
          <IconButton size="small" onClick={handleSave} color="success">
            <Save fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={handleCancel} color="error">
            <Close fontSize="small" />
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
          '&:hover': { bgcolor: 'action.hover' },
          px: 1,
          py: 0.5,
          borderRadius: 1,
          minWidth: type === 'number' ? 50 : 100
        }}
        onClick={handleEdit}
      >
        <Typography variant="body2">{value}</Typography>
        <Edit fontSize="small" sx={{ color: 'action.disabled' }} />
      </Box>
    );
  };

  // 매치 카드 렌더링
  const renderMatchCard = (match: Match, isImportant: boolean = false) => {
    const player1Name = match.player1?.name || match.player1Name || 'TBD';
    const player2Name = match.player2?.name || match.player2Name || 'TBD';
    
    return (
      <Card 
        key={match.id}
        sx={{ 
          mb: 2,
          border: isImportant ? 2 : 1,
          borderColor: isImportant ? 'primary.main' : 'divider',
          bgcolor: isImportant ? 'primary.light' : 'white'
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              경기 #{match.matchNumber}
            </Typography>
            <Chip 
              label={match.status === 'completed' ? '완료' : 
                     match.status === 'ongoing' ? '진행중' : 
                     match.status === 'scheduled' ? '예정' : '대기'} 
              size="small"
              color={match.status === 'completed' ? 'success' : 'default'}
            />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {/* Player 1 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <EditableCell 
                value={player1Name} 
                onSave={(value) => onMatchUpdate?.(match.id, { player1Name: value })}
              />
              <EditableCell 
                value={match.player1Score || 0} 
                onSave={(value) => onMatchUpdate?.(match.id, { player1Score: parseInt(value) || 0 })}
                type="number"
              />
            </Box>

            {/* VS */}
            <Typography variant="body2" sx={{ textAlign: 'center', py: 0.5 }}>
              VS
            </Typography>

            {/* Player 2 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <EditableCell 
                value={player2Name} 
                onSave={(value) => onMatchUpdate?.(match.id, { player2Name: value })}
              />
              <EditableCell 
                value={match.player2Score || 0} 
                onSave={(value) => onMatchUpdate?.(match.id, { player2Score: parseInt(value) })}
                type="number"
              />
            </Box>

            {match.status === 'completed' && match.winnerId && (
              <Box sx={{ textAlign: 'center', mt: 1 }}>
                <Chip 
                  label={`승자: ${match.winnerId === match.player1?.id ? player1Name : player2Name}`}
                  size="small"
                  color="success"
                  icon={<EmojiEvents />}
                />
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  // 조별 리그 렌더링
  const renderGroupStage = (groupName: string, matches: Match[]) => {
    const stats = calculateGroupStats(matches);
    // const qualifiedPlayers = stats.filter(s => s.qualified); // 사용하지 않으므로 주석 처리
    
    return (
      <Card key={groupName} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', color: 'primary.main' }}>
            <Groups sx={{ mr: 1 }} />
            {groupName.replace('Group ', '')}조
          </Typography>

          {/* 경기 결과 표 */}
          <TableContainer sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.light' }}>
                  <TableCell>선수</TableCell>
                  {stats.map((stat, idx) => (
                    <TableCell key={idx} align="center" sx={{ minWidth: 80 }}>
                      <EditableCell 
                        value={stat.player}
                        onSave={(value) => {
                          // 선수명 업데이트 로직
                          console.log('선수명 업데이트:', stat.player, '→', value);
                        }}
                      />
                    </TableCell>
                  ))}
                  <TableCell align="center">승패</TableCell>
                  <TableCell align="center">결과</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.map((stat, playerIndex) => (
                  <TableRow key={stat.player}>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 'bold' }}>
                      <EditableCell 
                        value={stat.player}
                        onSave={(value) => {
                          console.log('선수명 업데이트:', stat.player, '→', value);
                        }}
                      />
                    </TableCell>
                    {stats.map((_, opponentIndex) => {
                      if (playerIndex === opponentIndex) {
                        return <TableCell key={opponentIndex} align="center" sx={{ bgcolor: 'grey.200' }}>-</TableCell>;
                      }
                      
                      // 해당하는 매치 찾기
                      const match = matches.find(m => {
                        const p1Name = m.player1?.name || m.player1Name;
                        const p2Name = m.player2?.name || m.player2Name;
                        return (p1Name === stat.player && p2Name === stats[opponentIndex].player) ||
                               (p1Name === stats[opponentIndex].player && p2Name === stat.player);
                      });
                      
                      if (match) {
                        let displayScore = `${match.player1Score || 0}-${match.player2Score || 0}`;
                        const p1Name = match.player1?.name || match.player1Name;
                        
                        // 점수 순서 조정 (현재 행의 선수가 앞에 오도록)
                        if (p1Name !== stat.player) {
                          displayScore = `${match.player2Score || 0}-${match.player1Score || 0}`;
                        }
                        
                        return (
                          <TableCell key={opponentIndex} align="center">
                            <EditableCell 
                              value={displayScore}
                              onSave={(value) => {
                                const [score1, score2] = value.split('-').map(s => parseInt(s) || 0);
                                onMatchUpdate?.(match.id, {
                                  player1Score: p1Name === stat.player ? score1 : score2,
                                  player2Score: p1Name === stat.player ? score2 : score1
                                });
                              }}
                            />
                          </TableCell>
                        );
                      }
                      
                      return <TableCell key={opponentIndex} align="center">-</TableCell>;
                    })}
                    <TableCell align="center">
                      {stat.wins}승 {stat.losses}패
                    </TableCell>
                    <TableCell align="center">
                      {stat.qualified ? (
                        <Chip label="본선진출" size="small" color="success" />
                      ) : (
                        <Chip label="탈락" size="small" color="default" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      {/* 조별 리그 */}
      {leagueGroups.length > 0 && (
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" sx={{ mb: 4, textAlign: 'center', color: 'primary.main' }}>
            <Groups sx={{ mr: 1 }} />
            예선 리그전
          </Typography>
          <Typography variant="body2" sx={{ mb: 4, textAlign: 'center', color: 'text.secondary' }}>
            💡 팁: 선수명이나 점수를 클릭하면 편집할 수 있습니다. Enter키를 누르거나 저장 버튼을 클릭하여 변경사항을 저장하세요.
          </Typography>
          
          <Box sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: {
              xs: '1fr',
              lg: 'repeat(2, 1fr)'
            }
          }}>
            {leagueGroups.map((groupName) => (
              <Box key={groupName}>
                {renderGroupStage(groupName, groupMatches[groupName])}
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* 토너먼트 본선 */}
      {tournamentRounds.length > 0 && (
        <Box>
          <Typography variant="h4" sx={{ mb: 4, textAlign: 'center', color: 'error.main' }}>
            <EmojiEvents sx={{ mr: 1 }} />
            본선 토너먼트
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            {tournamentRounds
              .sort((a, b) => {
                // 라운드 순서 정렬
                const order: { [key: string]: number } = {
                  'Round of 16': 1, '16강': 1,
                  'Round of 8': 2, '8강': 2, 'Quarterfinal': 2,
                  'Round of 4': 3, '4강': 3, 'Semifinal': 3, '준결승': 3,
                  'Round of 2': 4, '2강': 4, 'Final': 4, '결승': 4
                };
                return (order[a] || 0) - (order[b] || 0);
              })
              .map((roundName) => {
                const roundMatches = groupMatches[roundName];
                const isImportant = roundName.includes('Final') || roundName.includes('결승') || roundName.includes('준결승');
                
                return (
                  <Box key={roundName} sx={{ width: '100%', maxWidth: isImportant ? 800 : 1000 }}>
                    <Typography variant="h5" sx={{ mb: 3, textAlign: 'center', color: 'error.main' }}>
                      {roundName.includes('Final') && !roundName.includes('Semi') ? '결승' :
                       roundName.includes('Semi') ? '준결승' :
                       roundName.includes('Quarter') || roundName.includes('8') ? '8강' :
                       roundName}
                    </Typography>
                    
                    <Box sx={{
                      display: 'grid',
                      gap: 2,
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: isImportant ? '1fr' : 'repeat(2, 1fr)',
                        md: isImportant ? '1fr' : 'repeat(3, 1fr)'
                      },
                      justifyContent: 'center'
                    }}>
                      {roundMatches.map((match: Match) => (
                        <Box key={match.id}>
                          {renderMatchCard(match, isImportant)}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                );
              })}
          </Box>
        </Box>
      )}

      {/* 안내 메시지 */}
      <Box sx={{ mt: 4, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
        <Typography variant="body2" sx={{ textAlign: 'center', color: 'info.contrastText' }}>
          💡 팁: 선수명이나 점수를 클릭하면 편집할 수 있습니다. Enter키를 누르거나 저장 버튼을 클릭하여 변경사항을 저장하세요.
        </Typography>
      </Box>
    </Box>
  );
};

export default InteractiveMatchBracket;