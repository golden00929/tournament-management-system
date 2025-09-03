import React from 'react';
import {
  Box,
  TextField,
  Typography,
  MenuItem,
} from '@mui/material';
import { TournamentFormData } from '../TournamentWizard';
import CustomDatePicker from '../../DatePicker/CustomDatePicker';

interface BasicInfoStepProps {
  formData: TournamentFormData;
  setFormData: React.Dispatch<React.SetStateAction<TournamentFormData>>;
  error: string | null;
}

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  formData,
  setFormData,
  error,
}) => {
  const handleChange = (field: keyof TournamentFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" gutterBottom>
        1단계: 대회 기본 정보
      </Typography>
      
      <Typography variant="body2" color="textSecondary">
        대회의 기본 정보와 일정을 입력해주세요.
      </Typography>

      <TextField
        label="대회명"
        value={formData.name}
        onChange={handleChange('name')}
        required
        fullWidth
        placeholder="예: 2024 미라서 배드민턴 대회"
        helperText="참가자들이 쉽게 식별할 수 있는 명확한 대회명을 입력해주세요"
      />

      <TextField
        label="대회 설명"
        value={formData.description}
        onChange={handleChange('description')}
        multiline
        rows={4}
        fullWidth
        placeholder="대회에 대한 상세 설명을 입력해주세요..."
        helperText="대회의 목적, 특별한 규칙, 주의사항 등을 포함할 수 있습니다"
      />

      <TextField
        select
        label="대회 카테고리"
        value={formData.category}
        onChange={handleChange('category')}
        required
        helperText="주요 종목을 선택해주세요"
      >
        <MenuItem value="badminton">배드민턴</MenuItem>
        <MenuItem value="pickleball">피클볼</MenuItem>
        <MenuItem value="tennis">테니스</MenuItem>
      </TextField>

      <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
        대회 일정
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <CustomDatePicker
          label="대회 시작일"
          value={formData.startDate}
          onChange={(value) => setFormData(prev => ({ ...prev, startDate: value }))}
          required
          helperText="대회가 시작되는 날짜"
        />

        <CustomDatePicker
          label="대회 종료일"
          value={formData.endDate}
          onChange={(value) => setFormData(prev => ({ ...prev, endDate: value }))}
          required
          helperText="대회가 끝나는 날짜"
        />
      </Box>

      <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
        참가 신청 기간
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <CustomDatePicker
          label="신청 시작일"
          value={formData.registrationStart}
          onChange={(value) => setFormData(prev => ({ ...prev, registrationStart: value }))}
          required
          helperText="참가 신청을 받기 시작하는 날짜"
        />

        <CustomDatePicker
          label="신청 마감일"
          value={formData.registrationEnd}
          onChange={(value) => setFormData(prev => ({ ...prev, registrationEnd: value }))}
          required
          helperText="참가 신청 마감 날짜"
        />
      </Box>

      <Box sx={{ 
        mt: 2, 
        p: 2, 
        bgcolor: 'info.light', 
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'info.main'
      }}>
        <Typography variant="caption" color="info.contrastText">
          💡 <strong>팁:</strong> 신청 마감일은 대회 시작일보다 최소 1일 전으로 설정하는 것이 좋습니다.
          참가자들에게 충분한 준비 시간을 제공할 수 있습니다.
        </Typography>
      </Box>
    </Box>
  );
};

export default BasicInfoStep;