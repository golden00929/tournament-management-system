import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import { 
  SportsTennis, 
  EmojiEvents,
  Add,
  Edit,
  AutoAwesome,
  Refresh,
} from '@mui/icons-material';
import { formatDateTime } from '../../utils/dateUtils';
import { 
  useGetTournamentMatchesQuery,
} from '../../store/api/apiSlice';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'scheduled': return 'default';
    case 'ongoing': return 'warning';
    case 'completed': return 'success';
    case 'cancelled': return 'error';
    default: return 'default';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'scheduled': return '예정';
    case 'ongoing': return '진행 중';
    case 'completed': return '완료';
    case 'cancelled': return '취소';
    default: return status;
  }
};

interface MatchListProps {
  tournamentId: string;
}

const MatchList: React.FC<MatchListProps> = ({ tournamentId }) => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data: matchesData, isLoading, error, refetch } = useGetTournamentMatchesQuery({
    tournamentId,
    page,
    limit: 50,
    status: statusFilter || undefined,
    sortBy: 'matchNumber',
    sortOrder: 'asc'
  }, {
    // 30초마다 자동 새로고침으로 대진표와 데이터 동기화
    pollingInterval: 30000,
    refetchOnFocus: true,
    refetchOnReconnect: true
  });
  
  const matches = matchesData?.data?.matches || [];
  
  const handleEditSchedule = (match: any) => {
    // 경기 일정 편집 로직 (필요시 구현)
    console.log('Edit schedule for match:', match);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            경기 목록
          </Typography>
          <Typography variant="body2" color="text.secondary">
            선택한 대회의 모든 경기를 조별로 구분하여 확인할 수 있습니다.
          </Typography>
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              label="대진표 연동" 
              size="small" 
              color="success" 
              variant="outlined"
              icon={<AutoAwesome />}
            />
            <Typography variant="caption" color="text.secondary">
              대진표 변경사항이 자동으로 반영됩니다
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={() => refetch()}
          >
            새로고침
          </Button>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>상태 필터</InputLabel>
            <Select
              value={statusFilter}
              label="상태 필터"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">전체</MenuItem>
              <MenuItem value="scheduled">예정</MenuItem>
              <MenuItem value="ongoing">진행 중</MenuItem>
              <MenuItem value="completed">완료</MenuItem>
              <MenuItem value="cancelled">취소</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          경기 목록을 불러오는 중 오류가 발생했습니다: {(error as any)?.data?.message || '알 수 없는 오류'}
        </Alert>
      ) : matches.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <SportsTennis sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              경기가 없습니다
            </Typography>
            <Typography variant="body2" color="text.secondary">
              대진표를 생성하면 여기에 경기 목록이 표시됩니다.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box>
          {/* 조별로 경기 그룹화 */}
          {(() => {
            // 조별로 매치 분류
            const groupMatches = matches.reduce((acc: any, match: any) => {
              let groupName = match.roundName;
              
              // "Group A Round 1" -> "Group A"로 변환
              if (groupName.includes('Group')) {
                const groupMatch = groupName.match(/Group\s+([A-Z])/);
                if (groupMatch) {
                  groupName = `Group ${groupMatch[1]}`;
                }
              } else if (groupName.toLowerCase().includes('final')) {
                groupName = '결승전';
              } else if (groupName.toLowerCase().includes('semifinal')) {
                groupName = '준결승';
              } else if (groupName.toLowerCase().includes('quarter')) {
                groupName = '8강';
              }
              
              if (!acc[groupName]) {
                acc[groupName] = [];
              }
              acc[groupName].push(match);
              return acc;
            }, {});

            const groupNames = Object.keys(groupMatches).sort();

            return groupNames.map((groupName) => (
              <Box key={groupName} sx={{ mb: 4 }}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    color: 'primary.main',
                    fontWeight: 'bold',
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <EmojiEvents />
                  {groupName.includes('Group') ? `${groupName}조` : groupName}
                  <Chip 
                    label={`${groupMatches[groupName].length}경기`}
                    size="small"
                    variant="outlined"
                  />
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {groupMatches[groupName].map((match: any) => (
                    <Card key={match.id} variant="outlined">
                      <CardContent sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                              <Typography variant="h6">
                                경기 #{match.matchNumber}
                              </Typography>
                              <Chip 
                                label={match.roundName} 
                                size="small" 
                                color="primary" 
                                variant="outlined" 
                              />
                              <Chip 
                                label={getStatusText(match.status)} 
                                size="small" 
                                color={getStatusColor(match.status)}
                              />
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                                  {match.player1?.name?.[0] || match.player1Name?.[0] || '?'}
                                </Avatar>
                                <Typography variant="body1">
                                  {match.player1?.name || match.player1Name || 'TBD'}
                                </Typography>
                                {match.status === 'completed' && (
                                  <Typography variant="h6" color="primary">
                                    {match.player1Score}
                                  </Typography>
                                )}
                              </Box>
                              
                              <Typography variant="body2" color="text.secondary">
                                vs
                              </Typography>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                                  {match.player2?.name?.[0] || match.player2Name?.[0] || '?'}
                                </Avatar>
                                <Typography variant="body1">
                                  {match.player2?.name || match.player2Name || 'TBD'}
                                </Typography>
                                {match.status === 'completed' && (
                                  <Typography variant="h6" color="primary">
                                    {match.player2Score}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                            
                            <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                              {match.courtNumber ? (
                                <Chip 
                                  label={`코트 ${match.courtNumber}`} 
                                  size="small" 
                                  color="primary" 
                                  variant="outlined"
                                />
                              ) : (
                                <Chip 
                                  label="코트 미지정" 
                                  size="small" 
                                  color="warning" 
                                  variant="outlined"
                                />
                              )}
                              
                              {match.scheduledTime ? (
                                <Chip 
                                  label={`예정: ${formatDateTime(match.scheduledTime)}`}
                                  size="small" 
                                  color="info" 
                                  variant="outlined"
                                />
                              ) : (
                                <Chip 
                                  label="시간 미지정" 
                                  size="small" 
                                  color="warning" 
                                  variant="outlined"
                                />
                              )}
                              
                              {match.actualStartTime && (
                                <Chip 
                                  label={`시작: ${formatDateTime(match.actualStartTime)}`}
                                  size="small" 
                                  color="success" 
                                  variant="outlined"
                                />
                              )}
                              
                              {match.actualEndTime && (
                                <Chip 
                                  label={`종료: ${formatDateTime(match.actualEndTime)}`}
                                  size="small" 
                                  color="success"
                                />
                              )}
                              
                              {match.notes && (
                                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                  📝 {match.notes}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton 
                              size="small" 
                              onClick={() => handleEditSchedule(match)}
                              title="경기 일정 편집"
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                            {match.bracket && (
                              <Typography variant="caption" color="text.secondary">
                                {match.bracket.name}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Box>
            ));
          })()}
        </Box>
      )}
    </Box>
  );
};

export default MatchList;