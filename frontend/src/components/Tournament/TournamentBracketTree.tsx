import React from 'react';
import {
  Box,
  Card,
  CardContent,
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

interface TournamentRound {
  roundNumber: number;
  roundName: string;
  matches: Match[];
}

interface TournamentBracketTreeProps {
  matches: Match[];
  onMatchClick?: (match: Match) => void;
}

const TournamentBracketTree: React.FC<TournamentBracketTreeProps> = ({
  matches,
  onMatchClick,
}) => {
  // Group matches by round
  const roundsMap = new Map<string, Match[]>();
  matches.forEach(match => {
    if (!roundsMap.has(match.roundName)) {
      roundsMap.set(match.roundName, []);
    }
    roundsMap.get(match.roundName)!.push(match);
  });

  // Convert to sorted rounds array
  const rounds: TournamentRound[] = Array.from(roundsMap.entries())
    .map(([roundName, roundMatches]) => ({
      roundNumber: getRoundNumber(roundName),
      roundName,
      matches: roundMatches.sort((a, b) => a.matchNumber - b.matchNumber)
    }))
    .sort((a, b) => a.roundNumber - b.roundNumber);

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'ongoing': return 'warning';
      case 'scheduled': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPlayerName = (player?: Player): string => {
    return player ? player.name : 'TBD';
  };

  const renderMatch = (match: Match, roundIndex: number, matchIndex: number) => {
    const isWinner1 = match.winnerId === match.player1?.id;
    const isWinner2 = match.winnerId === match.player2?.id;

    return (
      <Box
        key={match.id}
        sx={{
          position: 'relative',
          mb: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Enhanced Connection lines */}
        {roundIndex > 0 && (
          <>
            {/* Left horizontal line */}
            <Box
              sx={{
                position: 'absolute',
                left: -40,
                top: '50%',
                width: 30,
                height: 2,
                backgroundColor: match.winnerId ? 'success.main' : 'divider',
                transform: 'translateY(-50%)',
                zIndex: 0,
                borderRadius: 1,
                opacity: 0.8
              }}
            />
            {/* Left connecting vertical line (for pairing matches) */}
            {matchIndex % 2 === 0 && round.matches.length > 1 && (
              <Box
                sx={{
                  position: 'absolute',
                  left: -40,
                  top: matchIndex === round.matches.length - 1 ? '-50%' : '50%',
                  width: 2,
                  height: '100%',
                  backgroundColor: 'divider',
                  zIndex: 0,
                  borderRadius: 1,
                  opacity: 0.6
                }}
              />
            )}
          </>
        )}
        
        {roundIndex < rounds.length - 1 && (
          <>
            {/* Right horizontal line */}
            <Box
              sx={{
                position: 'absolute',
                right: -40,
                top: '50%',
                width: 30,
                height: 2,
                backgroundColor: match.winnerId ? 'success.main' : 'divider',
                transform: 'translateY(-50%)',
                zIndex: 0,
                borderRadius: 1,
                opacity: 0.8
              }}
            />
            {/* Right connecting vertical line (for pairing matches) */}
            {matchIndex % 2 === 0 && round.matches.length > 1 && (
              <Box
                sx={{
                  position: 'absolute',
                  right: -40,
                  top: matchIndex === round.matches.length - 1 ? '-50%' : '50%',
                  width: 2,
                  height: '100%',
                  backgroundColor: 'divider',
                  zIndex: 0,
                  borderRadius: 1,
                  opacity: 0.6
                }}
              />
            )}
          </>
        )}

        <Paper
          elevation={2}
          sx={{
            width: 240,
            cursor: onMatchClick ? 'pointer' : 'default',
            border: match.winnerId ? '2px solid' : '1px solid',
            borderColor: match.winnerId ? 'success.main' : 'divider',
            position: 'relative',
            zIndex: 1,
            '&:hover': onMatchClick ? {
              elevation: 4,
              backgroundColor: 'action.hover',
            } : {},
          }}
          onClick={() => onMatchClick?.(match)}
        >
          <CardContent sx={{ p: 2 }}>
            {/* Match header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                #{match.matchNumber}
              </Typography>
              <Chip
                size="small"
                label={match.status === 'completed' ? '완료' : 
                       match.status === 'ongoing' ? '진행 중' : 
                       match.status === 'cancelled' ? '취소' : '예정'}
                color={getMatchStatusColor(match.status)}
              />
            </Box>

            {/* Player 1 */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1,
                mb: 0.5,
                backgroundColor: isWinner1 ? 'success.light' : 'transparent',
                borderRadius: 1,
                border: isWinner1 ? '1px solid' : 'none',
                borderColor: isWinner1 ? 'success.main' : 'transparent',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: isWinner1 ? 'bold' : 'normal',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '140px'
                }}
              >
                {getPlayerName(match.player1)}
              </Typography>
              {match.player1Score !== undefined && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: isWinner1 ? 'bold' : 'normal',
                    color: isWinner1 ? 'success.main' : 'text.primary'
                  }}
                >
                  {match.player1Score}
                </Typography>
              )}
            </Box>

            {/* VS divider */}
            <Box sx={{ textAlign: 'center', my: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                VS
              </Typography>
            </Box>

            {/* Player 2 */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1,
                backgroundColor: isWinner2 ? 'success.light' : 'transparent',
                borderRadius: 1,
                border: isWinner2 ? '1px solid' : 'none',
                borderColor: isWinner2 ? 'success.main' : 'transparent',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: isWinner2 ? 'bold' : 'normal',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '140px'
                }}
              >
                {getPlayerName(match.player2)}
              </Typography>
              {match.player2Score !== undefined && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: isWinner2 ? 'bold' : 'normal',
                    color: isWinner2 ? 'success.main' : 'text.primary'
                  }}
                >
                  {match.player2Score}
                </Typography>
              )}
            </Box>
          </CardContent>
        </Paper>
      </Box>
    );
  };

  const renderRound = (round: TournamentRound, roundIndex: number) => {
    const isFinal = round.roundName === 'Final';
    
    return (
      <Box key={round.roundName} sx={{ display: 'flex', flexDirection: 'column', mx: 6 }}>
        {/* Round header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
          {isFinal && <EmojiEvents sx={{ mr: 1, color: 'gold' }} />}
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {round.roundName}
          </Typography>
        </Box>

        {/* Matches */}
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: roundIndex === 0 ? 2 : roundIndex === 1 ? 4 : 6,
            minHeight: '400px',
            justifyContent: 'space-around'
          }}
        >
          {round.matches.map((match, matchIndex) => 
            renderMatch(match, roundIndex, matchIndex)
          )}
        </Box>
      </Box>
    );
  };

  if (matches.length === 0) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <SportsTennis sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            대진표가 아직 생성되지 않았습니다
          </Typography>
          <Typography variant="body2" color="text.secondary">
            대회 관리자가 대진표를 생성하면 여기에 표시됩니다.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <SportsTennis sx={{ mr: 1 }} />
        <Typography variant="h5">
          토너먼트 대진표
        </Typography>
      </Box>
      
      <Box 
        sx={{ 
          display: 'flex', 
          overflowX: 'auto',
          py: 2,
          minHeight: '500px',
          backgroundColor: 'background.paper',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        {rounds.map((round, index) => renderRound(round, index))}
      </Box>
    </Box>
  );
};

// Helper function to determine round order
function getRoundNumber(roundName: string): number {
  if (roundName.includes('Final')) return 99; // Final is always last
  if (roundName.includes('Semi-Final')) return 98;
  if (roundName.includes('Quarter-Final')) return 97;
  if (roundName.includes('Round of 16')) return 16;
  if (roundName.includes('Round of 32')) return 32;
  if (roundName.includes('Round of 64')) return 64;
  if (roundName.includes('Round')) {
    const match = roundName.match(/Round (\d+)/);
    return match ? parseInt(match[1]) : 1;
  }
  return 1; // Default
}

export default TournamentBracketTree;