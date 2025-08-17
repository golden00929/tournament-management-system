import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Paper,
} from '@mui/material';
import { SportsTennis, EmojiEvents } from '@mui/icons-material';

interface Player {
  id: string;
  name: string;
  eloRating?: number;
}

interface Match {
  id: string;
  roundName: string;
  matchNumber: number;
  player1?: Player;
  player2?: Player;
  winnerId?: string;
  player1Score?: number;
  player2Score?: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
}

interface SingleEliminationBracketProps {
  matches: Match[];
  onMatchClick?: (match: Match) => void;
}

const SingleEliminationBracket: React.FC<SingleEliminationBracketProps> = ({
  matches,
  onMatchClick,
}) => {
  // 디버깅을 위한 로그
  console.log('=== SingleEliminationBracket 디버깅 ===');
  console.log('받은 matches:', matches);
  console.log('matches 개수:', matches?.length || 0);
  if (matches && matches.length > 0) {
    console.log('첫 번째 match 전체:', matches[0]);
    console.log('player1:', matches[0].player1);
    console.log('player2:', matches[0].player2);
    console.log('roundName:', matches[0].roundName);
    console.log('status:', matches[0].status);
  }
  
  // Group matches by round and organize them
  const organizeMatches = () => {
    const roundsMap = new Map<string, Match[]>();
    
    // Remove duplicates and group by round
    const uniqueMatches = matches.filter((match, index, self) => 
      index === self.findIndex(m => m.id === match.id)
    );
    
    uniqueMatches.forEach(match => {
      if (!roundsMap.has(match.roundName)) {
        roundsMap.set(match.roundName, []);
      }
      roundsMap.get(match.roundName)!.push(match);
    });

    // Get all available rounds and sort them properly
    const allRounds = Array.from(roundsMap.keys());
    
    // Define round priority (lower number = earlier round)
    const getRoundPriority = (roundName: string): number => {
      if (roundName.includes('Round of 64')) return 1;
      if (roundName.includes('Round of 32')) return 2;
      if (roundName.includes('Round of 16')) return 3;
      if (roundName.includes('Round of 8') || roundName.includes('Quarter')) return 4;
      if (roundName.includes('Round of 4') || roundName.includes('Semi')) return 5;
      if (roundName.includes('Final') && !roundName.includes('Semi')) return 6;
      if (roundName.includes('Round 1')) return 1;
      if (roundName.includes('Round 2')) return 2;
      if (roundName.includes('Round 3')) return 3;
      if (roundName.includes('group_stage')) return 0; // Group stage comes first
      return 99; // Unknown rounds go to end
    };

    // Sort rounds by priority
    const sortedRounds = allRounds.sort((a, b) => getRoundPriority(a) - getRoundPriority(b));
    
    const organizedRounds = sortedRounds.map(round => ({
      name: round,
      matches: roundsMap.get(round)!.sort((a, b) => a.matchNumber - b.matchNumber)
    }));

    console.log('Organized rounds:', organizedRounds.map(r => ({ name: r.name, count: r.matches.length })));
    console.log('Organized rounds 상세:', organizedRounds);
    return organizedRounds;
  };

  const getPlayerName = (player?: Player): string => {
    return player ? player.name : 'TBD';
  };

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'ongoing': return 'warning';
      case 'scheduled': return 'info';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const renderPlayer = (player?: Player, isWinner: boolean = false, score?: number) => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 1,
        backgroundColor: isWinner ? 'success.light' : 'grey.50',
        border: isWinner ? '2px solid' : '1px solid',
        borderColor: isWinner ? 'success.main' : 'grey.300',
        borderRadius: 1,
        minHeight: 35,
        mb: 0.5,
      }}
    >
      <Typography
        variant="body2"
        sx={{
          fontWeight: isWinner ? 'bold' : 'normal',
          fontSize: '0.9rem',
        }}
      >
        {getPlayerName(player)}
      </Typography>
      {score !== undefined && (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 'bold',
            color: isWinner ? 'success.dark' : 'text.secondary',
          }}
        >
          {score}
        </Typography>
      )}
    </Box>
  );

  const renderMatch = (match: Match, roundIndex: number, matchIndex: number, totalRounds: number) => {
    const isWinner1 = match.winnerId === match.player1?.id;
    const isWinner2 = match.winnerId === match.player2?.id;
    const isFinal = roundIndex === totalRounds - 1;

    return (
      <Paper
        elevation={isFinal ? 8 : 2}
        sx={{
          p: 2,
          border: isFinal ? '3px solid gold' : 'none',
          backgroundColor: isFinal ? 'warning.light' : 'white',
          cursor: onMatchClick ? 'pointer' : 'default',
          maxWidth: 600,
          mx: 'auto',
          '&:hover': onMatchClick ? {
            transform: 'scale(1.02)',
            transition: 'transform 0.2s',
          } : {},
        }}
        onClick={() => onMatchClick && onMatchClick(match)}
      >
        {/* Match header */}
        <Box sx={{ mb: 2, textAlign: 'center' }}>
          <Chip
            label={`Match ${match.matchNumber}`}
            size="medium"
            color={getMatchStatusColor(match.status)}
            icon={isFinal ? <EmojiEvents /> : <SportsTennis />}
          />
        </Box>

        {/* Players */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {renderPlayer(match.player1, isWinner1, match.player1Score)}
          {renderPlayer(match.player2, isWinner2, match.player2Score)}
        </Box>

        {/* Winner indicator */}
        {match.winnerId && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="success.main" fontWeight="bold">
              🏆 Winner: {getPlayerName(isWinner1 ? match.player1 : match.player2)}
            </Typography>
          </Box>
        )}
      </Paper>
    );
  };


  if (!matches || matches.length === 0) {
    console.log('SingleEliminationBracket: matches가 비어있음', { matches, length: matches?.length });
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          대진표가 생성되지 않았습니다
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          matches: {matches ? `빈 배열 (길이: ${matches.length})` : 'undefined/null'}
        </Typography>
      </Box>
    );
  }
  
  console.log('SingleEliminationBracket: 대진표 렌더링 진행...');

  const organizedRounds = organizeMatches();
  
  console.log('SingleEliminationBracket: 컴포넌트 렌더링 시작');
  console.log('organizedRounds.length:', organizedRounds.length);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, justifyContent: 'center' }}>
        <EmojiEvents sx={{ mr: 1, color: 'gold', fontSize: 32 }} />
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          토너먼트 대진표
        </Typography>
      </Box>

      {/* 라운드별 리스트식 대진표 */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {organizedRounds.map((round, roundIndex) => (
          <Box key={round.name}>
            {/* 라운드 제목 */}
            <Typography
              variant="h5"
              sx={{
                mb: 2,
                textAlign: 'center',
                fontWeight: 'bold',
                color: roundIndex === organizedRounds.length - 1 ? 'warning.main' : 'primary.main',
                px: 2,
                py: 1,
                backgroundColor: roundIndex === organizedRounds.length - 1 ? 'warning.light' : 'primary.light',
                borderRadius: 2,
              }}
            >
              {round.name}
            </Typography>

            {/* 매치 리스트 */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {round.matches.map((match, matchIndex) => (
                <Box key={match.id}>
                  {renderMatch(match, roundIndex, matchIndex, organizedRounds.length)}
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>

      {/* Legend */}
      <Box sx={{ mt: 4, p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          범례
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip label="예정됨" color="info" size="small" />
          <Chip label="진행중" color="warning" size="small" />
          <Chip label="완료됨" color="success" size="small" />
          <Chip label="취소됨" color="error" size="small" />
        </Box>
      </Box>
    </Box>
  );
};

export default SingleEliminationBracket;