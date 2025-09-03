import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Divider,
} from '@mui/material';
import {
  EmojiEvents,
  Schedule,
  Stadium,
  PersonOutline,
  WorkspacePremium,
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
  scheduledTime?: string;
  court?: string;
}

interface TournamentRoundsProps {
  matches: Match[];
  onMatchClick?: (match: Match) => void;
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

const getRoundDisplayName = (roundName: string) => {
  const lowerRoundName = roundName.toLowerCase();
  
  if (lowerRoundName.includes('final') && !lowerRoundName.includes('semi')) {
    return '결승';
  } else if (lowerRoundName.includes('semifinal') || lowerRoundName.includes('semi')) {
    return '준결승';
  } else if (lowerRoundName.includes('quarterfinal') || lowerRoundName.includes('quarter')) {
    return '8강';
  } else if (lowerRoundName.includes('round of 16') || lowerRoundName.includes('16')) {
    return '16강';
  } else if (lowerRoundName.includes('round of 8') || lowerRoundName.includes('8')) {
    return '8강';
  } else if (lowerRoundName.includes('round of 4') || lowerRoundName.includes('4')) {
    return '준결승';
  } else if (lowerRoundName.includes('round of 2') || lowerRoundName.includes('2')) {
    return '결승';
  } else {
    return roundName;
  }
};

const getRoundIcon = (roundName: string) => {
  const displayName = getRoundDisplayName(roundName);
  switch (displayName) {
    case '결승':
      return <WorkspacePremium sx={{ color: 'gold' }} />;
    case '준결승':
      return <EmojiEvents sx={{ color: 'silver' }} />;
    case '8강':
      return <EmojiEvents sx={{ color: '#CD7F32' }} />;
    default:
      return <EmojiEvents color="primary" />;
  }
};

const getRoundOrder = (roundName: string) => {
  const displayName = getRoundDisplayName(roundName);
  switch (displayName) {
    case '16강': return 1;
    case '8강': return 2;
    case '준결승': return 3;
    case '결승': return 4;
    default: return 0;
  }
};

const TournamentRounds: React.FC<TournamentRoundsProps> = ({ matches, onMatchClick }) => {
  // 토너먼트 매치만 필터링 (그룹 단계 제외)
  const tournamentMatches = matches.filter(match => 
    !match.roundName.toLowerCase().includes('group')
  );

  // 라운드별로 매치 분류
  const roundMatches = tournamentMatches.reduce((acc, match) => {
    const displayRoundName = getRoundDisplayName(match.roundName);
    if (!acc[displayRoundName]) {
      acc[displayRoundName] = [];
    }
    acc[displayRoundName].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  const renderMatch = (match: Match, isImportant: boolean = false) => {
    const player1Name = match.player1?.name || match.player1Name || 'TBD';
    const player2Name = match.player2?.name || match.player2Name || 'TBD';
    const isClickable = onMatchClick && match.status !== 'completed' && player1Name !== 'TBD' && player2Name !== 'TBD';

    // 임시 데이터 (실제로는 백엔드에서 받아와야 함)
    const court = match.court || `메인코트 ${(match.matchNumber % 2) + 1}`;
    const time = match.scheduledTime || `${14 + Math.floor(match.matchNumber / 2)}:${(match.matchNumber % 2) * 30 === 0 ? '00' : '30'}`;

    return (
      <Card 
        key={match.id}
        sx={{ 
          mb: 2, 
          cursor: isClickable ? 'pointer' : 'default',
          '&:hover': isClickable ? { backgroundColor: 'action.hover' } : {},
          border: match.status === 'ongoing' ? '3px solid' : isImportant ? '2px solid' : '1px solid',
          borderColor: match.status === 'ongoing' ? 'warning.main' : isImportant ? 'primary.main' : 'divider',
          backgroundColor: isImportant ? 'rgba(25, 118, 210, 0.04)' : 'white'
        }}
        onClick={() => isClickable && onMatchClick!(match)}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                fontWeight: 'bold',
                fontSize: isImportant ? '0.875rem' : '0.75rem'
              }}
            >
              경기 #{match.matchNumber}
            </Typography>
            <Chip 
              label={getStatusText(match.status)} 
              color={getStatusColor(match.status)}
              size="small"
              sx={{ fontWeight: 'bold' }}
            />
          </Box>

          {/* 경기 정보 */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
              <Box sx={{ textAlign: 'center', minWidth: 140 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <PersonOutline fontSize="small" />
                  <Typography 
                    variant={isImportant ? "h6" : "body1"} 
                    sx={{ 
                      fontWeight: isImportant ? 'bold' : 500,
                      color: match.winnerId === match.player1?.id ? 'success.main' : 'text.primary'
                    }}
                  >
                    {player1Name}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ mx: 3, textAlign: 'center' }}>
                {match.status === 'completed' ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip 
                      label={match.player1Score || 0} 
                      size={isImportant ? "medium" : "small"}
                      color={match.winnerId === match.player1?.id ? 'success' : 'default'}
                      sx={{ fontWeight: 'bold', minWidth: 45 }}
                    />
                    <Typography 
                      variant={isImportant ? "h6" : "body1"} 
                      sx={{ fontWeight: 'bold', mx: 1 }}
                    >
                      vs
                    </Typography>
                    <Chip 
                      label={match.player2Score || 0} 
                      size={isImportant ? "medium" : "small"}
                      color={match.winnerId === match.player2?.id ? 'success' : 'default'}
                      sx={{ fontWeight: 'bold', minWidth: 45 }}
                    />
                  </Box>
                ) : (
                  <Typography 
                    variant={isImportant ? "h6" : "body1"} 
                    sx={{ fontWeight: 'bold' }}
                  >
                    vs
                  </Typography>
                )}
              </Box>
              
              <Box sx={{ textAlign: 'center', minWidth: 140 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <Typography 
                    variant={isImportant ? "h6" : "body1"} 
                    sx={{ 
                      fontWeight: isImportant ? 'bold' : 500,
                      color: match.winnerId === match.player2?.id ? 'success.main' : 'text.primary'
                    }}
                  >
                    {player2Name}
                  </Typography>
                  <PersonOutline fontSize="small" />
                </Box>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* 경기장 및 시간 정보 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Stadium fontSize="small" color="primary" />
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontWeight: isImportant ? 'bold' : 'normal' }}
              >
                {court}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Schedule fontSize="small" color="primary" />
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontWeight: isImportant ? 'bold' : 'normal' }}
              >
                {time}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (tournamentMatches.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <EmojiEvents sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          토너먼트 대진표가 없습니다
        </Typography>
        <Typography variant="body2" color="text.secondary">
          조별 리그 결과에 따라 토너먼트 대진표가 생성됩니다
        </Typography>
      </Box>
    );
  }

  // 라운드를 순서대로 정렬
  const sortedRounds = Object.keys(roundMatches).sort((a, b) => getRoundOrder(a) - getRoundOrder(b));

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, justifyContent: 'center' }}>
        <EmojiEvents sx={{ mr: 1, color: 'primary.main', fontSize: 32 }} />
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          토너먼트 대진표
        </Typography>
      </Box>

      {/* 라운드별 경기 표시 */}
      <Box sx={{
        display: 'grid',
        gap: 3,
        gridTemplateColumns: {
          xs: '1fr',
          lg: 'repeat(auto-fit, minmax(400px, 1fr))'
        }
      }}>
        {sortedRounds.map((roundName) => {
          const isImportant = roundName === '결승' || roundName === '준결승';
          
          return (
            <Box 
              key={roundName}
              sx={{
                gridColumn: isImportant && sortedRounds.length > 1 ? { lg: '1 / -1' } : 'auto'
              }}
            >
              <Card 
                sx={{ 
                  height: 'fit-content',
                  border: isImportant ? '2px solid' : '1px solid',
                  borderColor: isImportant ? 'primary.main' : 'divider',
                  backgroundColor: isImportant ? 'rgba(25, 118, 210, 0.02)' : 'white'
                }}
              >
                <CardContent>
                  <Typography 
                    variant={isImportant ? "h5" : "h6"} 
                    gutterBottom 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      color: 'primary.main',
                      fontWeight: 'bold',
                      mb: 3,
                      justifyContent: 'center'
                    }}
                  >
                    {getRoundIcon(roundName)}
                    {roundName}
                  </Typography>
                  
                  <Box>
                    {roundMatches[roundName]
                      .sort((a, b) => a.matchNumber - b.matchNumber)
                      .map(match => renderMatch(match, isImportant))}
                  </Box>

                  {/* 라운드 통계 */}
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      총 {roundMatches[roundName].length}경기 • 
                      완료 {roundMatches[roundName].filter(m => m.status === 'completed').length}경기 • 
                      진행예정 {roundMatches[roundName].filter(m => m.status !== 'completed').length}경기
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default TournamentRounds;