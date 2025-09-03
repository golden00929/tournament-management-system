import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  FormControlLabel,
  Checkbox,
  TextField,
  MenuItem,
  Alert,
  Grid,
  Paper,
} from '@mui/material';
import { TournamentFormData } from '../TournamentWizard';
import { EmojiEvents, Groups, Settings } from '@mui/icons-material';

interface BracketConfigStepProps {
  formData: TournamentFormData;
  setFormData: React.Dispatch<React.SetStateAction<TournamentFormData>>;
  error: string | null;
}

const BracketConfigStep: React.FC<BracketConfigStepProps> = ({
  formData,
  setFormData,
  error,
}) => {
  const handleEventTypeChange = (eventType: string) => {
    setFormData(prev => {
      const eventTypes = prev.eventTypes.includes(eventType)
        ? prev.eventTypes.filter(type => type !== eventType)
        : [...prev.eventTypes, eventType];
      return { ...prev, eventTypes };
    });
  };

  const handleAllowMixedSkillLevelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, allowMixedSkillLevel: event.target.checked }));
  };

  const handleChange = (field: keyof TournamentFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    if (field === 'skillDiffLimit') {
      setFormData(prev => ({ ...prev, [field]: parseInt(value, 10) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const eventTypeOptions = [
    { 
      value: 'singles', 
      label: '단식',
      description: '1:1 개인전',
      icon: '🏸'
    },
    { 
      value: 'doubles', 
      label: '복식',
      description: '2:2 팀전',
      icon: '👥'
    },
    { 
      value: 'mixed_doubles', 
      label: '혼복',
      description: '남녀 혼합 복식',
      icon: '👫'
    }
  ];

  const skillLevelOptions = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'singles': return 'primary';
      case 'doubles': return 'secondary';
      case 'mixed_doubles': return 'success';
      default: return 'default';
    }
  };

  const getEstimatedMatches = () => {
    const participantCount = formData.maxParticipants;
    const eventCount = formData.eventTypes.length;
    
    let matchesPerEvent = 0;
    switch (formData.tournamentType) {
      case 'single_elimination':
        matchesPerEvent = participantCount - 1;
        break;
      case 'double_elimination':
        matchesPerEvent = Math.floor(participantCount * 1.5);
        break;
      case 'round_robin':
        matchesPerEvent = Math.floor(participantCount * (participantCount - 1) / 2);
        break;
      case 'hybrid':
        matchesPerEvent = Math.floor(participantCount * 0.8);
        break;
      default:
        matchesPerEvent = participantCount - 1;
    }
    
    return matchesPerEvent * eventCount;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" gutterBottom>
        3단계: 대진표 구성
      </Typography>
      
      <Typography variant="body2" color="textSecondary">
        대회에서 진행될 종목과 실력 수준 설정을 완료해주세요.
      </Typography>

      {/* Event Types Section */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiEvents color="primary" />
            종목 선택
          </Typography>
          
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            대회에서 진행할 종목을 선택해주세요. (복수 선택 가능)
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
            {eventTypeOptions.map((eventType) => (
              <Box key={eventType.value}>
                <Paper
                  elevation={formData.eventTypes.includes(eventType.value) ? 3 : 1}
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    border: '2px solid',
                    borderColor: formData.eventTypes.includes(eventType.value) 
                      ? `${getEventTypeColor(eventType.value)}.main` 
                      : 'transparent',
                    transition: 'all 0.2s',
                    '&:hover': {
                      elevation: 2,
                      borderColor: `${getEventTypeColor(eventType.value)}.light`
                    }
                  }}
                  onClick={() => handleEventTypeChange(eventType.value)}
                >
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    {eventType.icon}
                  </Typography>
                  <Typography variant="h6" gutterBottom>
                    {eventType.label}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {eventType.description}
                  </Typography>
                </Paper>
              </Box>
            ))}
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="textSecondary">
              선택된 종목: 
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              {formData.eventTypes.length === 0 ? (
                <Chip label="선택된 종목 없음" color="error" size="small" />
              ) : (
                formData.eventTypes.map((eventType) => {
                  const option = eventTypeOptions.find(opt => opt.value === eventType);
                  return (
                    <Chip
                      key={eventType}
                      label={`${option?.icon} ${option?.label}`}
                      color={getEventTypeColor(eventType) as any}
                      size="small"
                      onDelete={() => handleEventTypeChange(eventType)}
                    />
                  );
                })
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Skill Level Configuration */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Groups color="secondary" />
            실력 수준 설정
          </Typography>

          <FormControlLabel
            control={
              <Checkbox
                checked={formData.allowMixedSkillLevel}
                onChange={handleAllowMixedSkillLevelChange}
              />
            }
            label="실력 수준 혼합 허용"
            sx={{ mb: 2 }}
          />

          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            {formData.allowMixedSkillLevel 
              ? '다른 실력 수준의 참가자들이 함께 경기할 수 있습니다.'
              : '동일한 실력 수준의 참가자들만 경기합니다.'
            }
          </Typography>

          {formData.allowMixedSkillLevel && (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mt: 2 }}>
              <TextField
                select
                label="최소 실력 수준"
                value={formData.minSkillLevel}
                onChange={handleChange('minSkillLevel')}
                helperText="참가 가능한 최소 레벨"
              >
                {skillLevelOptions.map((level) => (
                  <MenuItem key={level} value={level}>
                    {level}
                  </MenuItem>
                ))}
              </TextField>
              
              <TextField
                select
                label="최대 실력 수준"
                value={formData.maxSkillLevel}
                onChange={handleChange('maxSkillLevel')}
                helperText="참가 가능한 최대 레벨"
              >
                {skillLevelOptions.map((level) => (
                  <MenuItem key={level} value={level}>
                    {level}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                type="number"
                label="실력 차이 제한"
                value={formData.skillDiffLimit}
                onChange={handleChange('skillDiffLimit')}
                inputProps={{ min: 0, max: 3 }}
                helperText="매칭시 허용 레벨차"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Tournament Preview */}
      <Card variant="outlined" sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Settings />
            대회 설정 요약
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Box>
              <Typography variant="body2">
                <strong>종목:</strong> {formData.eventTypes.length}개 종목
              </Typography>
              <Typography variant="body2">
                <strong>예상 경기 수:</strong> 약 {getEstimatedMatches()}경기
              </Typography>
              <Typography variant="body2">
                <strong>실력 혼합:</strong> {formData.allowMixedSkillLevel ? '허용' : '불허'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2">
                <strong>참가자 수:</strong> 최대 {formData.maxParticipants}명
              </Typography>
              <Typography variant="body2">
                <strong>대회 형식:</strong> {
                  {
                    'single_elimination': '단일 토너먼트',
                    'double_elimination': '더블 토너먼트',
                    'round_robin': '리그전',
                    'hybrid': '하이브리드',
                    'swiss': '스위스 시스템'
                  }[formData.tournamentType] || '단일 토너먼트'
                }
              </Typography>
              <Typography variant="body2">
                <strong>예상 소요시간:</strong> {Math.ceil(getEstimatedMatches() / 4)}시간
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {formData.eventTypes.length === 0 && (
        <Alert severity="warning">
          최소 하나의 종목을 선택해주세요.
        </Alert>
      )}

      <Box sx={{ 
        mt: 2, 
        p: 2, 
        bgcolor: 'info.light', 
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'info.main'
      }}>
        <Typography variant="caption" color="info.contrastText">
          🎯 <strong>대진표 생성 완료:</strong> 모든 설정이 완료되면 자동으로 대진표가 생성됩니다. 
          참가자 등록 마감 후 실제 대진표가 확정됩니다.
        </Typography>
      </Box>
    </Box>
  );
};

export default BracketConfigStep;