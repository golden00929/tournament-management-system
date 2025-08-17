import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from '@mui/material';
import {
  Add,
  Delete,
  SportsTennis,
  Groups,
  EmojiEvents,
  Settings,
  TableChart,
  AccountTree,
  Hub,
} from '@mui/icons-material';

interface Player {
  id: string;
  name: string;
  eloRating?: number;
  skillLevel?: string;
  eventType?: string;
}

interface Participant {
  id: string;
  player?: Player;
  name?: string;
  eloRating?: number;
  skillLevel?: string;
  approvalStatus: string;
  eventType?: string;
}

interface BracketConfig {
  id: string;
  name: string;
  eventType: 'singles' | 'doubles';
  tournamentType: 'single_elimination' | 'round_robin' | 'hybrid';
  skillLevelMin: string;
  skillLevelMax: string;
  maxParticipants: number;
  participants: Player[];
  groupSize?: number; // For hybrid tournaments
  advancersPerGroup?: number; // For hybrid tournaments
}

interface BracketConfigurationProps {
  tournamentId: string;
  participants: Participant[];
  tournamentType?: 'single_elimination' | 'round_robin' | 'hybrid';
  onGenerate: (configs: BracketConfig[]) => void;
  onClose: () => void;
}

const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

// 데이터베이스 skillLevel을 표준 skillLevel로 변환
const mapSkillLevel = (dbSkillLevel: string): string => {
  switch (dbSkillLevel?.toLowerCase()) {
    case 'd_class': return 'Beginner';
    case 'c_class': return 'Intermediate'; 
    case 'b_class': return 'Advanced';
    case 'a_class': return 'Expert';
    case 'beginner': return 'Beginner';
    case 'intermediate': return 'Intermediate';
    case 'advanced': return 'Advanced';
    case 'expert': return 'Expert';
    default: return 'Beginner';
  }
};

const BracketConfiguration: React.FC<BracketConfigurationProps> = ({
  tournamentId,
  participants,
  tournamentType = 'single_elimination',
  onGenerate,
  onClose,
}) => {
  const [brackets, setBrackets] = useState<BracketConfig[]>([]);
  const [newBracket, setNewBracket] = useState<Partial<BracketConfig>>({
    name: '',
    eventType: 'singles',
    tournamentType: tournamentType,
    skillLevelMin: 'Beginner',
    skillLevelMax: 'Expert',
    maxParticipants: 32,
    groupSize: 4,
    advancersPerGroup: 1,
  });
  const [selectedParticipants, setSelectedParticipants] = useState<Player[]>([]);

  // 종목별 참가자 필터링
  const getEligibleParticipants = (): Player[] => {
    console.log('BracketConfiguration - participants 데이터:', participants);
    if (!participants || participants.length === 0) {
      console.log('참가자 데이터가 없습니다.');
      return [];
    }
    
    return participants.filter(p => {
      // 참가자에서 선수 정보 추출 - 승인된 참가자만 포함
      if (p.approvalStatus !== 'approved') {
        console.log(`참가자 ${p.player?.name || p.name} - 미승인 상태: ${p.approvalStatus}`);
        return false;
      }
      
      const dbSkillLevel = p.player?.skillLevel || p.skillLevel || 'd_class';
      const skillLevel = mapSkillLevel(dbSkillLevel);
      console.log(`참가자 ${p.player?.name || p.name} - DB실력: ${dbSkillLevel}, 매핑된 실력: ${skillLevel}`);
      
      const skillIndex = skillLevels.indexOf(skillLevel);
      const minIndex = skillLevels.indexOf(newBracket.skillLevelMin || 'Beginner');
      const maxIndex = skillLevels.indexOf(newBracket.skillLevelMax || 'Expert');
      return skillIndex >= minIndex && skillIndex <= maxIndex;
    }).map(p => {
      const dbSkillLevel = p.player?.skillLevel || p.skillLevel || 'd_class';
      return {
        id: p.player?.id || p.id,
        name: p.player?.name || p.name || 'Unknown',
        eloRating: p.player?.eloRating || p.eloRating || 1200,
        skillLevel: mapSkillLevel(dbSkillLevel),
      };
    });
  };

  const addBracket = () => {
    if (!newBracket.name || selectedParticipants.length === 0) {
      return;
    }

    const bracket: BracketConfig = {
      id: Date.now().toString(),
      name: newBracket.name,
      eventType: newBracket.eventType || 'singles',
      tournamentType: newBracket.tournamentType || tournamentType,
      skillLevelMin: newBracket.skillLevelMin || 'Beginner',
      skillLevelMax: newBracket.skillLevelMax || 'Expert',
      maxParticipants: newBracket.maxParticipants || 32,
      participants: [...selectedParticipants],
      groupSize: newBracket.groupSize || 4,
      advancersPerGroup: newBracket.advancersPerGroup || 1,
    };

    setBrackets([...brackets, bracket]);
    setNewBracket({
      name: '',
      eventType: 'singles',
      tournamentType: 'single_elimination',
      skillLevelMin: 'Beginner',
      skillLevelMax: 'Expert',
      maxParticipants: 32,
      groupSize: 4,
      advancersPerGroup: 1,
    });
    setSelectedParticipants([]);
  };

  const removeBracket = (id: string) => {
    setBrackets(brackets.filter(b => b.id !== id));
  };

  const toggleParticipant = (participant: Player) => {
    const isSelected = selectedParticipants.find(p => p.id === participant.id);
    if (isSelected) {
      setSelectedParticipants(selectedParticipants.filter(p => p.id !== participant.id));
    } else {
      setSelectedParticipants([...selectedParticipants, participant]);
    }
  };

  const selectAllEligible = () => {
    const eligible = getEligibleParticipants();
    setSelectedParticipants(eligible);
  };

  const clearSelection = () => {
    setSelectedParticipants([]);
  };

  const handleGenerate = () => {
    if (brackets.length === 0) {
      return;
    }
    onGenerate(brackets);
  };

  const eligibleParticipants = getEligibleParticipants();

  return (
    <Dialog open maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Settings sx={{ mr: 1 }} />
          대진표 구성
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* 새 대진표 추가 */}
          <Box sx={{ flex: 1 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  새 대진표 추가
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="대진표 이름"
                    value={newBracket.name || ''}
                    onChange={(e) => setNewBracket({ ...newBracket, name: e.target.value })}
                    placeholder="예: 남자 단식 중급부"
                    fullWidth
                  />
                  
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel>종목</InputLabel>
                      <Select
                        value={newBracket.eventType || 'singles'}
                        onChange={(e) => setNewBracket({ ...newBracket, eventType: e.target.value as 'singles' | 'doubles' })}
                      >
                        <MenuItem value="singles">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <SportsTennis sx={{ mr: 1 }} />
                            단식
                          </Box>
                        </MenuItem>
                        <MenuItem value="doubles">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Groups sx={{ mr: 1 }} />
                            복식
                          </Box>
                        </MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth>
                      <InputLabel>토너먼트 형식</InputLabel>
                      <Select
                        value={newBracket.tournamentType || 'single_elimination'}
                        onChange={(e) => setNewBracket({ ...newBracket, tournamentType: e.target.value as 'single_elimination' | 'round_robin' | 'hybrid' })}
                      >
                        <MenuItem value="single_elimination">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AccountTree sx={{ mr: 1 }} />
                            토너먼트
                          </Box>
                        </MenuItem>
                        <MenuItem value="round_robin">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <TableChart sx={{ mr: 1 }} />
                            조별 리그
                          </Box>
                        </MenuItem>
                        <MenuItem value="hybrid">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Hub sx={{ mr: 1 }} />
                            하이브리드 (예선 리그 + 본선 토너먼트)
                          </Box>
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel>최소 실력</InputLabel>
                      <Select
                        value={newBracket.skillLevelMin || 'Beginner'}
                        onChange={(e) => setNewBracket({ ...newBracket, skillLevelMin: e.target.value })}
                      >
                        {skillLevels.map(level => (
                          <MenuItem key={level} value={level}>{level}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth>
                      <InputLabel>최대 실력</InputLabel>
                      <Select
                        value={newBracket.skillLevelMax || 'Expert'}
                        onChange={(e) => setNewBracket({ ...newBracket, skillLevelMax: e.target.value })}
                      >
                        {skillLevels.map(level => (
                          <MenuItem key={level} value={level}>{level}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  
                  <TextField
                    label="최대 참가자 수"
                    type="number"
                    value={newBracket.maxParticipants || 32}
                    onChange={(e) => setNewBracket({ ...newBracket, maxParticipants: parseInt(e.target.value) })}
                    inputProps={{ min: 4, max: 128 }}
                    fullWidth
                  />

                  {/* 하이브리드 토너먼트 추가 설정 */}
                  {newBracket.tournamentType === 'hybrid' && (
                    <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom color="primary">
                        하이브리드 토너먼트 설정
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                          label="그룹당 인원수"
                          type="number"
                          value={newBracket.groupSize || 4}
                          onChange={(e) => setNewBracket({ ...newBracket, groupSize: parseInt(e.target.value) })}
                          inputProps={{ min: 3, max: 8 }}
                          size="small"
                          fullWidth
                        />
                        <TextField
                          label="그룹당 진출자수"
                          type="number"
                          value={newBracket.advancersPerGroup || 1}
                          onChange={(e) => setNewBracket({ ...newBracket, advancersPerGroup: parseInt(e.target.value) })}
                          inputProps={{ min: 1, max: newBracket.groupSize || 4 }}
                          size="small"
                          fullWidth
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        * 예선은 그룹 내 리그전, 본선은 토너먼트로 진행됩니다.
                      </Typography>
                    </Box>
                  )}
                  
                  <Divider />
                  
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2">
                        참가자 선택 ({selectedParticipants.length}명 선택됨)
                      </Typography>
                      <Box>
                        <Button size="small" onClick={selectAllEligible} sx={{ mr: 1 }}>
                          조건 맞는 전체 선택 ({eligibleParticipants.length}명)
                        </Button>
                        <Button size="small" onClick={clearSelection} color="secondary">
                          선택 해제
                        </Button>
                      </Box>
                    </Box>
                    
                    <Box sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      {eligibleParticipants.length === 0 ? (
                        <Box sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            조건에 맞는 승인된 참가자가 없습니다.
                          </Typography>
                        </Box>
                      ) : (
                        eligibleParticipants.map(participant => (
                          <Box
                            key={participant.id}
                            sx={{
                              p: 1,
                              cursor: 'pointer',
                              backgroundColor: selectedParticipants.find(p => p.id === participant.id) ? 'primary.light' : 'transparent',
                              '&:hover': { backgroundColor: 'action.hover' },
                            }}
                            onClick={() => toggleParticipant(participant)}
                          >
                            <Typography variant="body2">
                              {participant.name} (ELO: {participant.eloRating}, {participant.skillLevel})
                            </Typography>
                          </Box>
                        ))
                      )}
                    </Box>
                  </Box>
                  
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={addBracket}
                    disabled={!newBracket.name || selectedParticipants.length === 0}
                    fullWidth
                  >
                    대진표 추가
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
          
          {/* 생성된 대진표 목록 */}
          <Box sx={{ flex: 1 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  생성될 대진표 ({brackets.length}개)
                </Typography>
                
                {brackets.length === 0 ? (
                  <Alert severity="info">
                    아직 생성된 대진표가 없습니다.
                  </Alert>
                ) : (
                  <List>
                    {brackets.map((bracket) => (
                      <ListItem key={bracket.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {bracket.eventType === 'singles' ? <SportsTennis fontSize="small" /> : <Groups fontSize="small" />}
                              {bracket.tournamentType === 'single_elimination' ? <AccountTree fontSize="small" /> : 
                               bracket.tournamentType === 'round_robin' ? <TableChart fontSize="small" /> : 
                               <Hub fontSize="small" />}
                              {bracket.name}
                            </Box>
                          }
                          secondary={
                            <Box component="div">
                              <Box component="div" sx={{ fontSize: '0.75rem' }}>
                                {bracket.tournamentType === 'single_elimination' ? '토너먼트' : 
                                 bracket.tournamentType === 'round_robin' ? '조별 리그' : '하이브리드 (예선 리그 + 본선 토너먼트)'} | 
                                {bracket.skillLevelMin} ~ {bracket.skillLevelMax}
                              </Box>
                              <Box component="div" sx={{ fontSize: '0.75rem' }}>
                                참가자: {bracket.participants.length}명 / 최대: {bracket.maxParticipants}명
                                {bracket.tournamentType === 'hybrid' && (
                                  <span> | 그룹: {bracket.groupSize}명, 진출: {bracket.advancersPerGroup}명</span>
                                )}
                              </Box>
                              <Box component="div" sx={{ mt: 0.5 }}>
                                {bracket.participants.slice(0, 3).map(p => (
                                  <Chip key={p.id} label={p.name} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                                ))}
                                {bracket.participants.length > 3 && (
                                  <Chip label={`+${bracket.participants.length - 3}명 더`} size="small" variant="outlined" />
                                )}
                              </Box>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton edge="end" onClick={() => removeBracket(bracket.id)} color="error">
                            <Delete />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          취소
        </Button>
        <Button
          variant="contained"
          startIcon={<EmojiEvents />}
          onClick={handleGenerate}
          disabled={brackets.length === 0}
        >
          대진표 생성 ({brackets.length}개)
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BracketConfiguration;