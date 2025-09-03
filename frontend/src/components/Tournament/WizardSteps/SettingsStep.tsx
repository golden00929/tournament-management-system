import React, { useState } from 'react';
import {
  Box,
  TextField,
  Typography,
  MenuItem,
  Card,
  CardContent,
  Grid,
  Chip,
} from '@mui/material';
import { TournamentFormData } from '../TournamentWizard';
import { formatNumber } from '../../../utils/dateUtils';

interface SettingsStepProps {
  formData: TournamentFormData;
  setFormData: React.Dispatch<React.SetStateAction<TournamentFormData>>;
  error: string | null;
}

const SettingsStep: React.FC<SettingsStepProps> = ({
  formData,
  setFormData,
  error,
}) => {
  const [participantFeeDisplay, setParticipantFeeDisplay] = useState<string>(
    formatNumber(formData.participantFee)
  );

  const handleChange = (field: keyof TournamentFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    
    if (field === 'participantFee') {
      const numericValue = value.replace(/\D/g, '');
      const parsedValue = parseInt(numericValue, 10) || 0;
      setFormData(prev => ({ ...prev, [field]: parsedValue }));
      setParticipantFeeDisplay(formatNumber(parsedValue));
    } else if (field === 'maxParticipants') {
      setFormData(prev => ({ 
        ...prev, 
        [field]: parseInt(value, 10) || 0 
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const tournamentTypes = [
    { 
      value: 'single_elimination', 
      label: '단일 토너먼트',
      description: '한 번 지면 탈락하는 형식'
    },
    { 
      value: 'double_elimination', 
      label: '더블 토너먼트',
      description: '두 번 져야 탈락하는 형식'
    },
    { 
      value: 'round_robin', 
      label: '리그전',
      description: '모든 팀이 서로 대결'
    },
    { 
      value: 'hybrid', 
      label: '하이브리드',
      description: '예선 리그전 + 본선 토너먼트'
    },
  ];

  const skillLevels = [
    { value: 'all', label: '전체', description: '모든 실력 수준' },
    { value: 'd_class', label: 'Group D', description: 'Beginner (초급자)' },
    { value: 'c_class', label: 'Group C', description: 'Intermediate (중급자)' },
    { value: 'b_class', label: 'Group B', description: 'Advanced (고급자)' },
    { value: 'a_class', label: 'Group A', description: 'Expert (전문가)' },
  ];

  const getRecommendedParticipants = (tournamentType: string) => {
    switch (tournamentType) {
      case 'single_elimination':
        return [8, 16, 32, 64];
      case 'double_elimination':
        return [8, 16, 32];
      case 'round_robin':
        return [4, 6, 8, 10];
      case 'hybrid':
        return [12, 16, 24, 32];
      default:
        return [8, 16, 32];
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" gutterBottom>
        2단계: 대회 설정 & 규칙
      </Typography>
      
      <Typography variant="body2" color="textSecondary">
        대회가 진행될 장소, 참가비, 대회 형식 등을 설정해주세요.
      </Typography>

      {/* Location Section */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            📍 대회 장소
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2 }}>
            <TextField
              label="개최 장소"
              value={formData.location}
              onChange={handleChange('location')}
              required
              placeholder="예: 서울시 강남구 체육센터"
              helperText="대회가 열릴 주요 장소명"
            />

            <TextField
              label="상세 장소/코트"
              value={formData.venue}
              onChange={handleChange('venue')}
              required
              placeholder="예: A코트, 1번 체육관"
              helperText="구체적인 코트나 장소"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Participants & Fee Section */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            👥 참가자 & 참가비
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <TextField
              label="최대 참가자 수"
              type="number"
              value={formData.maxParticipants}
              onChange={handleChange('maxParticipants')}
              required
              inputProps={{ min: 4, max: 128 }}
              helperText="4명 이상 128명 이하"
            />

            <TextField
              label="참가비 (VND)"
              value={participantFeeDisplay}
              onChange={handleChange('participantFee')}
              required
              placeholder="100.000"
              helperText="0원으로 설정시 무료 대회"
            />
          </Box>

          {/* Recommended participant counts */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="textSecondary" gutterBottom>
              {formData.tournamentType}에 권장되는 참가자 수:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              {getRecommendedParticipants(formData.tournamentType).map((count) => (
                <Chip
                  key={count}
                  label={`${count}명`}
                  size="small"
                  onClick={() => setFormData(prev => ({ ...prev, maxParticipants: count }))}
                  color={formData.maxParticipants === count ? 'primary' : 'default'}
                  variant={formData.maxParticipants === count ? 'filled' : 'outlined'}
                  clickable
                />
              ))}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Tournament Format Section */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            🏆 대회 형식 & 실력 수준
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <Box>
              <TextField
                select
                label="대회 형식"
                value={formData.tournamentType}
                onChange={handleChange('tournamentType')}
                required
                fullWidth
              >
                {tournamentTypes.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Box>
                      <Typography variant="body2">{option.label}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {option.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box>
              <TextField
                select
                label="실력 수준"
                value={formData.skillLevel}
                onChange={handleChange('skillLevel')}
                required
                fullWidth
              >
                {skillLevels.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Box>
                      <Typography variant="body2">{option.label}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {option.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ 
        mt: 2, 
        p: 2, 
        bgcolor: 'success.light', 
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'success.main'
      }}>
        <Typography variant="caption" color="success.contrastText">
          ✅ <strong>설정 확인:</strong> {tournamentTypes.find(t => t.value === formData.tournamentType)?.label} 형식으로 
          최대 {formData.maxParticipants}명이 참가하는 대회입니다. 
          참가비는 {formData.participantFee === 0 ? '무료' : `${formData.participantFee.toLocaleString()}원`}입니다.
        </Typography>
      </Box>
    </Box>
  );
};

export default SettingsStep;