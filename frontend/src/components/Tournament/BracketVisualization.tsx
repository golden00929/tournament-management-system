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

interface BracketVisualizationProps {
  matches: Match[];
  tournamentType: 'single_elimination' | 'double_elimination' | 'round_robin';
  onMatchClick?: (match: Match) => void;
}

const BracketVisualization: React.FC<BracketVisualizationProps> = ({
  matches,
  tournamentType,
  onMatchClick,
}) => {
  const getUniqueRounds = () => {
    if (matches.length === 0) return [];
    const roundsSet = new Set(matches.map(m => m.roundName));
    const rounds = Array.from(roundsSet);
    return rounds.sort();
  };

  const getMatchesByRound = (roundName: string): Match[] => {
    return matches.filter(m => m.roundName === roundName);
  };

  const getPlayerName = (player?: Player): string => {
    return player ? player.name : 'TBD';
  };

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'ongoing': return 'warning';
      case 'scheduled': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getRoundDisplayName = (roundName: string) => {
    switch (roundName) {
      case 'group_stage':
        return '예선전 - 조별 리그';
      case 'round_of_16':
        return '본선 - 16강 토너먼트';
      case 'quarter_finals':
        return '본선 - 8강 토너먼트';
      case 'semi_finals':
        return '본선 - 4강 토너먼트';
      case 'finals':
        return '본선 - 결승전';
      case 'third_place':
        return '본선 - 3/4위전';
      default:
        // group_stage 변형들 처리
        if (roundName.includes('group')) {
          return '예선전 - 조별 리그';
        }
        // 기타 토너먼트 라운드들은 본선으로 표시
        if (roundName.includes('round') || roundName.includes('final')) {
          return `본선 - ${roundName}`;
        }
        return roundName;
    }
  };

  const isGroupStage = (roundName: string) => {
    return roundName === 'group_stage' || roundName.includes('group');
  };

  const renderMatch = (match: Match) => {
    return (
      <Paper
        key={match.id}
        elevation={2}
        sx={{
          p: 2,
          mb: 2,
          cursor: onMatchClick ? 'pointer' : 'default',
          border: match.winnerId ? '2px solid' : '1px solid',
          borderColor: match.winnerId ? 'success.main' : 'divider',
          '&:hover': onMatchClick ? {
            elevation: 4,
            backgroundColor: 'action.hover',
          } : {},
        }}
        onClick={() => onMatchClick?.(match)}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            매치 #{match.matchNumber}
          </Typography>
          <Chip
            size="small"
            label={match.status === 'completed' ? '완료' : match.status === 'ongoing' ? '진행 중' : match.status === 'cancelled' ? '취소' : '예정'}
            color={getMatchStatusColor(match.status)}
          />
        </Box>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1,
              backgroundColor: match.winnerId === match.player1?.id ? 'success.light' : 'transparent',
              borderRadius: 1,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: match.winnerId === match.player1?.id ? 'bold' : 'normal',
              }}
            >
              {getPlayerName(match.player1)}
            </Typography>
            {match.player1?.eloRating && (
              <Typography variant="caption" color="text.secondary">
                {match.player1.eloRating}
              </Typography>
            )}
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              VS
            </Typography>
          </Box>
          
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1,
              backgroundColor: match.winnerId === match.player2?.id ? 'success.light' : 'transparent',
              borderRadius: 1,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: match.winnerId === match.player2?.id ? 'bold' : 'normal',
              }}
            >
              {getPlayerName(match.player2)}
            </Typography>
            {match.player2?.eloRating && (
              <Typography variant="caption" color="text.secondary">
                {match.player2.eloRating}
              </Typography>
            )}
          </Box>
        </Box>
        
        {(match.player1Score !== undefined && match.player2Score !== undefined) && (
          <Box sx={{ mt: 1, textAlign: 'center' }}>
            <Typography variant="body2" color="primary">
              {match.player1Score} - {match.player2Score}
            </Typography>
          </Box>
        )}
      </Paper>
    );
  };

  const renderSingleElimination = () => {
    const rounds = getUniqueRounds();
    
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <SportsTennis sx={{ mr: 1 }} />
          <Typography variant="h5">
            단일 토너먼트 대진표
          </Typography>
        </Box>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: `repeat(${rounds.length}, 1fr)` }, gap: 2 }}>
          {rounds.map((roundName, index) => {
            const roundMatches = getMatchesByRound(roundName);
            const isChampionshipRound = index === rounds.length - 1;
            
            return (
              <Box key={roundName}>
                <Card 
                  sx={{ 
                    border: '2px solid',
                    borderColor: isGroupStage(roundName) ? 'primary.main' : 'secondary.main',
                    backgroundColor: isGroupStage(roundName) ? 'primary.50' : 'secondary.50'
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {isChampionshipRound && <EmojiEvents sx={{ mr: 1, color: 'gold' }} />}
                      {isGroupStage(roundName) && <SportsTennis sx={{ mr: 1, color: 'primary.main' }} />}
                      <Typography 
                        variant="h6"
                        sx={{ 
                          color: isGroupStage(roundName) ? 'primary.main' : 'secondary.main',
                          fontWeight: 'bold'
                        }}
                      >
                        {getRoundDisplayName(roundName)}
                      </Typography>
                    </Box>
                    
                    {roundMatches.map(renderMatch)}
                    
                    {roundMatches.length === 0 && (
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        매치가 없습니다
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };

  const renderRoundRobin = () => {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <SportsTennis sx={{ mr: 1 }} />
          <Typography variant="h5">
            리그전 대진표
          </Typography>
        </Box>
        
        <Card>
          <CardContent>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
              {matches.map((match, index) => (
                <Box key={match.id}>
                  {renderMatch(match)}
                </Box>
              ))}
              
              {matches.length === 0 && (
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    매치가 없습니다
                  </Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
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
      {tournamentType === 'single_elimination' || tournamentType === 'double_elimination'
        ? renderSingleElimination()
        : renderRoundRobin()
      }
    </Box>
  );
};

export default BracketVisualization;