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
  Groups,
  Schedule,
  Stadium,
  PersonOutline,
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

interface GroupStageMatchesProps {
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

const GroupStageMatches: React.FC<GroupStageMatchesProps> = ({ matches, onMatchClick }) => {
  // 그룹별로 매치 분류 (Group A, Group B 등)
  const groupMatches = matches.reduce((acc, match) => {
    let groupName = match.roundName;
    
    // "Group A Round 1" -> "Group A"로 변환
    if (groupName.includes('Group')) {
      const groupMatch = groupName.match(/Group\s+([A-Z])/);
      if (groupMatch) {
        groupName = `Group ${groupMatch[1]}`;
      }
    }
    
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  const renderMatch = (match: Match) => {
    const player1Name = match.player1?.name || match.player1Name || 'TBD';
    const player2Name = match.player2?.name || match.player2Name || 'TBD';
    const isClickable = onMatchClick && match.status !== 'completed' && player1Name !== 'TBD' && player2Name !== 'TBD';

    // 임시 데이터 (실제로는 백엔드에서 받아와야 함)
    const court = match.court || `코트 ${(match.matchNumber % 4) + 1}`;
    const time = match.scheduledTime || `${9 + Math.floor(match.matchNumber / 2)}:${(match.matchNumber % 2) * 30 === 0 ? '00' : '30'}`;

    return (
      <Card 
        key={match.id}
        sx={{ 
          mb: 2, 
          cursor: isClickable ? 'pointer' : 'default',
          '&:hover': isClickable ? { backgroundColor: 'action.hover' } : {},
          border: match.status === 'ongoing' ? '2px solid' : '1px solid',
          borderColor: match.status === 'ongoing' ? 'warning.main' : 'divider'
        }}
        onClick={() => isClickable && onMatchClick!(match)}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
              경기 #{match.matchNumber}
            </Typography>
            <Chip 
              label={getStatusText(match.status)} 
              color={getStatusColor(match.status)}
              size="small"
            />
          </Box>

          {/* 경기 정보 */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
              <Box sx={{ textAlign: 'center', minWidth: 120 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <PersonOutline fontSize="small" />
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {player1Name}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ mx: 3, textAlign: 'center' }}>
                {match.status === 'completed' ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip 
                      label={match.player1Score || 0} 
                      size="small" 
                      color={match.winnerId === match.player1?.id ? 'success' : 'default'}
                    />
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>vs</Typography>
                    <Chip 
                      label={match.player2Score || 0} 
                      size="small" 
                      color={match.winnerId === match.player2?.id ? 'success' : 'default'}
                    />
                  </Box>
                ) : (
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>vs</Typography>
                )}
              </Box>
              
              <Box sx={{ textAlign: 'center', minWidth: 120 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {player2Name}
                  </Typography>
                  <PersonOutline fontSize="small" />
                </Box>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 1 }} />

          {/* 경기장 및 시간 정보 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Stadium fontSize="small" color="primary" />
              <Typography variant="body2" color="text.secondary">
                {court}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Schedule fontSize="small" color="primary" />
              <Typography variant="body2" color="text.secondary">
                {time}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (matches.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Groups sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          조별 리그 경기가 없습니다
        </Typography>
      </Box>
    );
  }

  const groupNames = Object.keys(groupMatches).sort();

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, justifyContent: 'center' }}>
        <Groups sx={{ mr: 1, color: 'primary.main', fontSize: 32 }} />
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          조별 리그전
        </Typography>
      </Box>

      {/* 그룹별 경기 표시 */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, 
        gap: 3 
      }}>
        {groupNames.map((groupName) => (
          <Card key={groupName} sx={{ height: 'fit-content' }}>
            <CardContent>
              <Typography 
                variant="h6" 
                gutterBottom 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  color: 'primary.main',
                  fontWeight: 'bold',
                  mb: 3
                }}
              >
                <Groups color="primary" />
                {groupName.includes('Group') ? `${groupName}조` : groupName}
              </Typography>
              
              <Box>
                {groupMatches[groupName]
                  .sort((a, b) => a.matchNumber - b.matchNumber)
                  .map(renderMatch)}
              </Box>

              {/* 조별 통계 */}
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  총 {groupMatches[groupName].length}경기 • 
                  완료 {groupMatches[groupName].filter(m => m.status === 'completed').length}경기 • 
                  진행예정 {groupMatches[groupName].filter(m => m.status !== 'completed').length}경기
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default GroupStageMatches;