import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Tabs,
  Tab,
} from '@mui/material';
import {
  ArrowBack,
  PlayArrow,
  Refresh,
  Settings,
  Build,
  Visibility,
} from '@mui/icons-material';
import {
  useGetTournamentQuery,
  useGetTournamentBracketQuery,
  useGenerateBracketMutation,
  useUpdateMatchMutation,
  useGetTournamentParticipantsQuery,
} from '../../store/api/apiSlice';
import BracketVisualization from '../../components/Tournament/BracketVisualization';
import SingleEliminationBracket from '../../components/Tournament/SingleEliminationBracket';
import RoundRobinBracket from '../../components/Tournament/RoundRobinBracket';
import BracketConfiguration from '../../components/Tournament/BracketConfiguration';
import InteractiveTournamentBracket from '../../components/Tournament/InteractiveTournamentBracket';
import GroupStageMatches from '../../components/Tournament/GroupStageMatches';
import TournamentRounds from '../../components/Tournament/TournamentRounds';

interface MatchResult {
  matchId: string;
  winnerId: string;
  player1Score: number;
  player2Score: number;
}

const TournamentBracket: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [matchResultDialog, setMatchResultDialog] = useState(false);
  const [configurationDialog, setConfigurationDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [matchResult, setMatchResult] = useState<MatchResult>({
    matchId: '',
    winnerId: '',
    player1Score: 0,
    player2Score: 0,
  });

  const { data: tournamentData, isLoading: isLoadingTournament } = useGetTournamentQuery(id!);
  const { 
    data: bracketData, 
    isLoading: isLoadingBracket, 
    refetch: refetchBracket 
  } = useGetTournamentBracketQuery(id!, {
    // 페이지 로드 시마다 최신 데이터 가져오기
    refetchOnMountOrArgChange: true
  });
  const { data: participantsData } = useGetTournamentParticipantsQuery({ 
    tournamentId: id!, 
    limit: 200 
  });
  
  const [generateBracket, { isLoading: isGenerating }] = useGenerateBracketMutation();
  const [updateMatch, { isLoading: isUpdatingMatch }] = useUpdateMatchMutation();

  const handleGenerateBracket = async () => {
    try {
      console.log('대진표 생성 시작...');
      const result = await generateBracket(id!).unwrap();
      console.log('대진표 생성 성공:', result);
      
      // 성공 메시지 표시
      alert('대진표가 성공적으로 생성되었습니다!');
      
      // 잠시 대기 후 데이터 새로고침
      setTimeout(() => {
        console.log('브라켓 데이터 새로고침...');
        refetchBracket();
      }, 1000); // 더 긴 대기 시간으로 변경
    } catch (err: any) {
      console.error('Failed to generate bracket:', err);
      console.error('Error status:', err?.status);
      console.error('Error data:', err?.data);
      
      // 성공적으로 생성되었지만 응답 처리에서 오류가 발생한 경우 감지
      if (err?.status === 201 || (err?.data && err?.data?.success)) {
        console.log('대진표 생성은 성공했지만 응답 처리에서 오류 발생');
        alert('대진표가 생성되었습니다. 페이지를 새로고침합니다.');
        setTimeout(() => {
          refetchBracket();
        }, 1000);
      } else {
        alert('대진표 생성에 실패했습니다: ' + (err.data?.message || err.message));
      }
    }
  };

  const handleConfigureBracket = () => {
    console.log('대진표 구성 버튼 클릭됨');
    console.log('참가자 데이터:', participantsData);
    setConfigurationDialog(true);
  };

  const handleBracketConfiguration = async (configs: any[]) => {
    try {
      console.log('구성된 대진표 생성 시작...', configs);
      
      // 단일 대진표 생성 (첫 번째 설정 사용)
      if (configs && configs.length > 0) {
        const config = configs[0];
        const result = await generateBracket({
          tournamentId: id!,
          eventType: config.eventType,
          name: config.name,
          participantIds: config.participants.map((p: any) => p.id),
          tournamentType: config.tournamentType,
          groupSize: config.groupSize,
          advancersPerGroup: config.advancersPerGroup
        }).unwrap();
        console.log('구성된 대진표 생성 성공:', result);
      } else {
        const result = await generateBracket(id!).unwrap();
        console.log('기본 대진표 생성 성공:', result);
      }
      
      setConfigurationDialog(false);
      
      // 잠시 대기 후 데이터 새로고침
      setTimeout(() => {
        console.log('브라켓 데이터 새로고침...');
        refetchBracket();
      }, 500);
    } catch (err: any) {
      console.error('Failed to generate configured brackets:', err);
      alert('대진표 생성에 실패했습니다: ' + (err.data?.message || err.message));
    }
  };

  const handleMatchClick = (match: any) => {
    console.log('매치 클릭됨:', match);
    console.log('매치 상태:', match.status);
    console.log('선수1:', match.player1);
    console.log('선수2:', match.player2);
    
    // 완료되지 않은 매치이고 두 선수가 있는 경우에만 결과 입력 허용
    if (match.status !== 'completed' && match.player1 && match.player2) {
      console.log('매치 결과 다이얼로그 열기');
      setSelectedMatch(match);
      setMatchResult({
        matchId: match.id,
        winnerId: '',
        player1Score: 0,
        player2Score: 0,
      });
      setMatchResultDialog(true);
    } else {
      console.log('매치 결과 입력 불가 - 상태:', match.status, '선수1:', match.player1?.name, '선수2:', match.player2?.name);
    }
  };

  const handleCloseMatchDialog = () => {
    setMatchResultDialog(false);
    setSelectedMatch(null);
    setMatchResult({
      matchId: '',
      winnerId: '',
      player1Score: 0,
      player2Score: 0,
    });
  };

  const handleSubmitMatchResult = async () => {
    console.log('매치 결과 제출 시도:', matchResult);
    
    if (!matchResult.winnerId || (matchResult.player1Score === 0 && matchResult.player2Score === 0)) {
      console.log('승자 또는 스코어가 비어있음');
      return;
    }

    try {
      console.log('API 호출 중...', {
        matchId: matchResult.matchId,
        winnerId: matchResult.winnerId,
        player1Score: matchResult.player1Score,
        player2Score: matchResult.player2Score,
      });
      
      const result = await updateMatch({
        matchId: matchResult.matchId,
        winnerId: matchResult.winnerId,
        player1Score: matchResult.player1Score,
        player2Score: matchResult.player2Score,
      }).unwrap();
      
      console.log('매치 결과 업데이트 성공:', result);
      refetchBracket();
      handleCloseMatchDialog();
    } catch (err: any) {
      console.error('Failed to update match result:', err);
      alert('매치 결과 저장에 실패했습니다: ' + (err.data?.message || err.message));
    }
  };

  const getWinnerOptions = () => {
    if (!selectedMatch) return [];
    
    const options = [];
    if (selectedMatch.player1) {
      options.push({
        value: selectedMatch.player1.id,
        label: selectedMatch.player1.name,
      });
    }
    if (selectedMatch.player2) {
      options.push({
        value: selectedMatch.player2.id,
        label: selectedMatch.player2.name,
      });
    }
    
    return options;
  };

  if (isLoadingTournament) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!tournamentData?.data) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/tournaments')}
          sx={{ mb: 2 }}
        >
          뒤로
        </Button>
        <Alert severity="error">
          대회 정보를 불러올 수 없습니다.
        </Alert>
      </Box>
    );
  }

  const tournament = tournamentData.data;
  
  // 가장 적절한 bracket을 선택 (최근에 생성된 것 우선, 매치가 있는 것)
  const bracket = bracketData?.data?.length > 0 
    ? [...bracketData.data]
        .filter((b: any) => b.matches && b.matches.length > 0) // 매치가 있는 브라켓만
        .sort((a: any, b: any) => {
          // 1순위: 최근에 생성된 것
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })[0] || [...bracketData.data].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : null;
  
  // 디버깅을 위한 로그
  console.log('=== 브라켓 데이터 디버깅 ===');
  console.log('tournament 정보:', tournament);
  console.log('tournament.tournamentType:', tournament.tournamentType);
  console.log('전체 bracketData:', bracketData);
  console.log('전체 brackets 개수:', bracketData?.data?.length || 0);
  console.log('모든 브라켓들:', bracketData?.data?.map((b: any) => ({
    id: b.id,
    name: b.name,
    type: b.type,
    createdAt: b.createdAt,
    matchCount: b.matches?.length || 0
  })));
  console.log('선택된 bracket:', bracket);
  console.log('선택된 bracket type:', bracket?.type);
  console.log('선택된 bracket 생성시간:', bracket?.createdAt);
  console.log('bracket.matches:', bracket?.matches);
  console.log('matches 개수:', bracket?.matches?.length || 0);
  if (bracket?.matches?.length > 0) {
    console.log('첫 번째 match 구조:', bracket.matches[0]);
    // 참가자 수 계산 확인
    const uniqueParticipants = Array.from(new Set(
      bracket.matches.flatMap((m: any) => [
        m.player1?.name || m.player1Name,
        m.player2?.name || m.player2Name
      ]).filter((name: string) => name && name !== 'TBD')
    ));
    console.log('🎯 계산된 참가자 수:', uniqueParticipants.length);
    console.log('🎯 참가자 목록:', uniqueParticipants.slice(0, 10)); // 처음 10명만 보기
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(`/tournaments/${id}`)}
            sx={{ mr: 2 }}
          >
            뒤로
          </Button>
          <Typography variant="h4">
            {tournament.name} - 대진표
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            startIcon={<Refresh />}
            onClick={() => refetchBracket()}
            disabled={isLoadingBracket}
          >
            새로고침
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Settings />}
            onClick={handleConfigureBracket}
            sx={{ mr: 1 }}
          >
            대진표 구성
          </Button>
          
          <Button
            variant="contained"
            startIcon={<PlayArrow />}
            onClick={handleGenerateBracket}
            disabled={isGenerating}
          >
            {isGenerating ? '생성 중...' : (!bracket || bracket.matches?.length === 0 ? '빠른 생성' : '재생성')}
          </Button>
        </Box>
      </Box>

      {/* 대회 정보 요약 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Chip label={`${tournament.tournamentType === 'single_elimination' ? '단일 토너먼트' : tournament.tournamentType === 'double_elimination' ? '더블 토너먼트' : '리그전'}`} />
            <Chip label={`최대 참가자: ${tournament.maxParticipants}명`} variant="outlined" />
            <Chip 
              label={tournament.status === 'draft' ? '작성 중' : tournament.status === 'open' ? '모집 중' : tournament.status === 'ongoing' ? '진행 중' : '완료'}
              color={tournament.status === 'ongoing' ? 'warning' : tournament.status === 'completed' ? 'success' : 'default'}
            />
          </Box>
        </CardContent>
      </Card>

      {/* 대진표 탭 */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab 
            icon={<Visibility />} 
            label="경기 상세표" 
            iconPosition="start"
          />
          <Tab 
            icon={<Build />} 
            label="대회 대진표" 
            iconPosition="start"
          />
        </Tabs>
      </Card>

      {/* 탭 컨텐츠 */}
      {activeTab === 0 && (
        <>
          {/* 기본 대진표 시각화 */}
          {isLoadingBracket ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : !bracket || !bracket.matches || bracket.matches.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                아직 생성된 대진표가 없습니다.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                위의 "빠른 생성" 또는 "대진표 구성" 버튼을 클릭하여 대진표를 생성하세요.
              </Typography>
            </Box>
          ) : tournament.tournamentType === 'single_elimination' ? (
            <SingleEliminationBracket
              matches={bracket?.matches || []}
              onMatchClick={handleMatchClick}
            />
          ) : tournament.tournamentType === 'round_robin' ? (
            <GroupStageMatches
              matches={bracket?.matches || []}
              onMatchClick={handleMatchClick}
            />
          ) : tournament.tournamentType === 'hybrid' ? (
            // 하이브리드는 조별리그와 토너먼트 단계를 분리하여 표시
            <Box>
              {/* 전체 대회 통계 표시 */}
              <Box sx={{ mb: 4, textAlign: 'center', p: 3, bgcolor: 'primary.light', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.contrastText' }}>
                  대회 현황
                </Typography>
                <Typography variant="body1" sx={{ color: 'primary.contrastText' }}>
                  총 {bracket?.matches ? 
                    Array.from(new Set(
                      bracket.matches
                        .filter((m: any) => m.roundName.includes('Group')) // 그룹전 매치만 고려
                        .flatMap((m: any) => [
                          m.player1?.name || m.player1Name,
                          m.player2?.name || m.player2Name
                        ]).filter((name: string) => name && name !== 'TBD')
                    )).length : 0}명 참가 • {bracket?.matches?.length || 0}경기 • {bracket?.matches?.filter((m: any) => m.status === 'completed').length || 0}경기 완료
                </Typography>
              </Box>
              
              {/* 조별 리그 단계 */}
              <Box sx={{ mb: 4 }}>
                <GroupStageMatches
                  matches={bracket?.matches?.filter((m: any) => m.roundName.includes('Group')) || []}
                  onMatchClick={handleMatchClick}
                />
              </Box>
              
              {/* 토너먼트 단계 */}
              <Box>
                <TournamentRounds
                  matches={bracket?.matches?.filter((m: any) => !m.roundName.includes('Group')) || []}
                  onMatchClick={handleMatchClick}
                />
              </Box>
            </Box>
          ) : (
            <BracketVisualization
              matches={bracket?.matches || []}
              tournamentType={tournament.tournamentType}
              onMatchClick={handleMatchClick}
            />
          )}
        </>
      )}

      {activeTab === 1 && (
        <InteractiveTournamentBracket
          participants={participantsData?.data?.participants?.map((p: any) => ({
            id: p.player?.id || p.id,
            name: p.player?.name || p.name,
          })) || []}
          tournamentName={tournament.name}
          onBracketUpdate={(bracketData) => {
            console.log('Interactive bracket updated:', bracketData);
          }}
        />
      )}


      {/* 대진표 구성 다이얼로그 */}
      {configurationDialog && (
        <BracketConfiguration
          tournamentId={id!}
          participants={participantsData?.data?.participants || []}
          tournamentType={tournament.tournamentType as 'single_elimination' | 'round_robin' | 'hybrid'}
          onGenerate={handleBracketConfiguration}
          onClose={() => setConfigurationDialog(false)}
        />
      )}

      {/* 매치 결과 입력 다이얼로그 */}
      <Dialog 
        open={matchResultDialog} 
        onClose={handleCloseMatchDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          매치 결과 입력
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            {selectedMatch && (
              <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  매치 #{selectedMatch.matchNumber}
                </Typography>
                <Typography variant="body2">
                  {selectedMatch.player1?.name || 'TBD'} vs {selectedMatch.player2?.name || 'TBD'}
                </Typography>
              </Box>
            )}
            
            <TextField
              select
              label="승자"
              value={matchResult.winnerId}
              onChange={(e) => setMatchResult(prev => ({ ...prev, winnerId: e.target.value }))}
              required
              fullWidth
            >
              {getWinnerOptions().map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                type="number"
                label={selectedMatch?.player1?.name || '선수1'} 
                value={matchResult.player1Score}
                onChange={(e) => setMatchResult(prev => ({ ...prev, player1Score: parseInt(e.target.value) || 0 }))}
                required
                inputProps={{ min: 0, max: 99 }}
                sx={{ flex: 1 }}
              />
              <Typography variant="h6">vs</Typography>
              <TextField
                type="number"
                label={selectedMatch?.player2?.name || '선수2'}
                value={matchResult.player2Score}
                onChange={(e) => setMatchResult(prev => ({ ...prev, player2Score: parseInt(e.target.value) || 0 }))}
                required
                inputProps={{ min: 0, max: 99 }}
                sx={{ flex: 1 }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMatchDialog}>
            취소
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitMatchResult}
            disabled={!matchResult.winnerId || (matchResult.player1Score === 0 && matchResult.player2Score === 0) || isUpdatingMatch}
          >
            {isUpdatingMatch ? '저장 중...' : '결과 저장'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TournamentBracket;