import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  EmojiEvents,
  SportsScore,
  PersonOutline,
} from '@mui/icons-material';

interface Match {
  id: string;
  matchNumber: number;
  roundName: string;
  player1?: {
    id: string;
    name: string;
    eloRating?: number;
  };
  player2?: {
    id: string;
    name: string;
    eloRating?: number;
  };
  player1Name?: string;
  player2Name?: string;
  player1Score?: number;
  player2Score?: number;
  status: 'pending' | 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  winnerId?: string;
}

interface RoundRobinBracketProps {
  matches: Match[];
  onMatchClick?: (match: Match) => void;
  hideStats?: boolean; // 통계 표시 숨김 옵션
}

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

const RoundRobinBracket: React.FC<RoundRobinBracketProps> = ({ matches, onMatchClick, hideStats = false }) => {
  // 라운드별로 매치 그룹화
  const roundMatches = matches.reduce((acc, match) => {
    const roundName = match.roundName;
    if (!acc[roundName]) {
      acc[roundName] = [];
    }
    acc[roundName].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  // 모든 참가자 목록 생성
  const allParticipants = new Set<string>();
  matches.forEach(match => {
    if (match.player1?.name) allParticipants.add(match.player1.name);
    if (match.player2?.name) allParticipants.add(match.player2.name);
    if (match.player1Name && match.player1Name !== 'TBD') allParticipants.add(match.player1Name);
    if (match.player2Name && match.player2Name !== 'TBD') allParticipants.add(match.player2Name);
  });

  const participants = Array.from(allParticipants);

  // 참가자별 통계 계산
  const calculateStats = (playerName: string) => {
    let wins = 0;
    let losses = 0;
    let draws = 0;
    let played = 0;
    let pointsFor = 0;
    let pointsAgainst = 0;

    matches.forEach(match => {
      if (match.status === 'completed') {
        const isPlayer1 = (match.player1?.name || match.player1Name) === playerName;
        const isPlayer2 = (match.player2?.name || match.player2Name) === playerName;
        
        if (isPlayer1 || isPlayer2) {
          played++;
          const player1Score = match.player1Score || 0;
          const player2Score = match.player2Score || 0;
          
          if (isPlayer1) {
            pointsFor += player1Score;
            pointsAgainst += player2Score;
            if (player1Score > player2Score) wins++;
            else if (player1Score < player2Score) losses++;
            else draws++;
          } else {
            pointsFor += player2Score;
            pointsAgainst += player1Score;
            if (player2Score > player1Score) wins++;
            else if (player2Score < player1Score) losses++;
            else draws++;
          }
        }
      }
    });

    return { wins, losses, draws, played, pointsFor, pointsAgainst, points: wins * 3 + draws };
  };

  // 참가자를 승점순으로 정렬
  const sortedParticipants = participants
    .map(name => ({ name, ...calculateStats(name) }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points; // 승점
      if (b.wins !== a.wins) return b.wins - a.wins; // 승수
      const aGoalDiff = a.pointsFor - a.pointsAgainst;
      const bGoalDiff = b.pointsFor - b.pointsAgainst;
      if (bGoalDiff !== aGoalDiff) return bGoalDiff - aGoalDiff; // 득실차
      return b.pointsFor - a.pointsFor; // 득점
    });

  const renderMatch = (match: Match) => {
    const player1Name = match.player1?.name || match.player1Name || 'TBD';
    const player2Name = match.player2?.name || match.player2Name || 'TBD';
    const isClickable = onMatchClick && match.status !== 'completed' && player1Name !== 'TBD' && player2Name !== 'TBD';

    return (
      <Card 
        key={match.id}
        sx={{ 
          mb: 1, 
          cursor: isClickable ? 'pointer' : 'default',
          '&:hover': isClickable ? { backgroundColor: 'action.hover' } : {},
          border: match.status === 'ongoing' ? '2px solid' : '1px solid',
          borderColor: match.status === 'ongoing' ? 'warning.main' : 'divider'
        }}
        onClick={() => isClickable && onMatchClick!(match)}
      >
        <CardContent sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60 }}>
                #{match.matchNumber}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                <PersonOutline fontSize="small" />
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {player1Name}
                </Typography>
                
                {match.status === 'completed' && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip 
                      label={match.player1Score || 0} 
                      size="small" 
                      color={match.winnerId === match.player1?.id ? 'success' : 'default'}
                    />
                    <Typography variant="body2">vs</Typography>
                    <Chip 
                      label={match.player2Score || 0} 
                      size="small" 
                      color={match.winnerId === match.player2?.id ? 'success' : 'default'}
                    />
                  </Box>
                )}
                
                {match.status !== 'completed' && (
                  <Typography variant="body2" color="text.secondary">vs</Typography>
                )}
                
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {player2Name}
                </Typography>
                <PersonOutline fontSize="small" />
              </Box>
            </Box>
            
            <Chip 
              label={getStatusText(match.status)} 
              color={getStatusColor(match.status)}
              size="small"
            />
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (matches.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <SportsScore sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          라운드로빈 대진표가 없습니다
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, justifyContent: 'center' }}>
        <EmojiEvents sx={{ mr: 1, color: 'primary.main', fontSize: 32 }} />
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          라운드로빈 리그전
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {/* 순위표 */}
        <Box sx={{ flex: '1 1 500px', minWidth: '500px' }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmojiEvents color="primary" />
                순위표
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell align="center">순위</TableCell>
                      <TableCell>선수명</TableCell>
                      <TableCell align="center">경기수</TableCell>
                      <TableCell align="center">승</TableCell>
                      <TableCell align="center">무</TableCell>
                      <TableCell align="center">패</TableCell>
                      <TableCell align="center">득점</TableCell>
                      <TableCell align="center">실점</TableCell>
                      <TableCell align="center">승점</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedParticipants.map((participant, index) => (
                      <TableRow 
                        key={participant.name}
                        sx={{ 
                          backgroundColor: index === 0 ? 'gold' : 
                                          index === 1 ? 'silver' : 
                                          index === 2 ? '#CD7F32' : 'transparent',
                          '&:nth-of-type(odd)': { backgroundColor: index < 3 ? undefined : 'action.hover' }
                        }}
                      >
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: index < 3 ? 'bold' : 'normal' }}>
                            {index === 0 && '🥇'} {index === 1 && '🥈'} {index === 2 && '🥉'} {index + 1}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: index < 3 ? 'bold' : 'normal' }}>
                            {participant.name}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">{participant.played}</TableCell>
                        <TableCell align="center">{participant.wins}</TableCell>
                        <TableCell align="center">{participant.draws}</TableCell>
                        <TableCell align="center">{participant.losses}</TableCell>
                        <TableCell align="center">{participant.pointsFor}</TableCell>
                        <TableCell align="center">{participant.pointsAgainst}</TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={participant.points} 
                            size="small" 
                            color={index < 3 ? 'primary' : 'default'}
                            sx={{ fontWeight: 'bold' }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>

        {/* 경기 일정 */}
        <Box sx={{ flex: '1 1 500px', minWidth: '500px' }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SportsScore color="primary" />
                경기 일정
              </Typography>
              
              {Object.keys(roundMatches).sort().map(roundName => (
                <Box key={roundName} sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
                    {roundName}
                  </Typography>
                  <Box sx={{ pl: 1 }}>
                    {roundMatches[roundName]
                      .sort((a, b) => a.matchNumber - b.matchNumber)
                      .map(renderMatch)
                    }
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* 통계 요약 - 조건부 표시 */}
      {!hideStats && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            총 {participants.length}명 참가 • {matches.length}경기 • {matches.filter(m => m.status === 'completed').length}경기 완료
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default RoundRobinBracket;