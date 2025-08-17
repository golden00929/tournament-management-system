import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  Checkbox,
  Chip,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { useCreateTournamentMutation, useUpdateTournamentMutation, useGetTournamentQuery } from '../../store/api/apiSlice';
import { toDateInputValue, formatNumber } from '../../utils/dateUtils';
import CustomDatePicker from '../../components/DatePicker/CustomDatePicker';

interface TournamentFormData {
  name: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  registrationStart: string;
  registrationEnd: string;
  location: string;
  venue: string;
  maxParticipants: number;
  participantFee: number;
  tournamentType: 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss' | 'hybrid';
  skillLevel: 'all' | 'd_class' | 'c_class' | 'b_class' | 'a_class' | 'beginner' | 'intermediate' | 'advanced';
  // 대진표 설정
  eventTypes: string[]; // ['singles', 'doubles']
  allowMixedSkillLevel: boolean;
  minSkillLevel: string;
  maxSkillLevel: string;
  skillDiffLimit: number;
}

const initialFormData: TournamentFormData = {
  name: '',
  description: '',
  category: 'badminton',
  startDate: '',
  endDate: '',
  registrationStart: '',
  registrationEnd: '',
  location: '',
  venue: '',
  maxParticipants: 32,
  participantFee: 100000,
  tournamentType: 'single_elimination',
  skillLevel: 'd_class',
  // 대진표 설정 기본값
  eventTypes: ['singles'],
  allowMixedSkillLevel: true,
  minSkillLevel: 'Beginner',
  maxSkillLevel: 'Expert',
  skillDiffLimit: 2,
};

const TournamentForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<TournamentFormData>(initialFormData);
  const [participantFeeDisplay, setParticipantFeeDisplay] = useState<string>('100.000');
  const [error, setError] = useState<string | null>(null);

  const { data: tournamentData, isLoading: isLoadingTournament } = useGetTournamentQuery(
    id!,
    { skip: !isEdit }
  );

  const [createTournament, { isLoading: isCreating }] = useCreateTournamentMutation();
  const [updateTournament, { isLoading: isUpdating }] = useUpdateTournamentMutation();

  React.useEffect(() => {
    if (isEdit && tournamentData?.data) {
      const tournament = tournamentData.data;
      setFormData({
        name: tournament.name || '',
        description: tournament.description || '',
        category: tournament.category || 'badminton',
        startDate: toDateInputValue(tournament.startDate),
        endDate: toDateInputValue(tournament.endDate),
        registrationStart: toDateInputValue(tournament.registrationStart),
        registrationEnd: toDateInputValue(tournament.registrationEnd),
        location: tournament.location || '',
        venue: tournament.venue || '',
        maxParticipants: tournament.maxParticipants || 32,
        participantFee: tournament.participantFee || 100000,
        tournamentType: tournament.tournamentType || 'single_elimination',
        skillLevel: tournament.skillLevel || 'd_class',
        // 대진표 설정 기본값
        eventTypes: ['singles'],
        allowMixedSkillLevel: true,
        minSkillLevel: 'Beginner',
        maxSkillLevel: 'Expert',
        skillDiffLimit: 2,
      });
      setParticipantFeeDisplay(formatNumber(tournament.participantFee || 100000));
    }
  }, [isEdit, tournamentData]);

  const handleChange = (field: keyof TournamentFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    
    if (field === 'participantFee') {
      const numericValue = value.replace(/\D/g, '');
      const parsedValue = parseInt(numericValue, 10) || 0;
      setFormData(prev => ({ ...prev, [field]: parsedValue }));
      setParticipantFeeDisplay(formatNumber(parsedValue));
    } else if (field === 'skillDiffLimit') {
      setFormData(prev => ({ ...prev, [field]: parseInt(value, 10) || 0 }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: field === 'maxParticipants' 
          ? parseInt(value, 10) || 0 
          : value
      }));
    }
  };

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    console.log('Form data before validation:', formData);

    // 필수 필드 검증
    if (!formData.name || !formData.name.trim()) {
      setError('대회명을 입력해주세요.');
      return;
    }
    if (!formData.startDate || formData.startDate.trim() === '') {
      setError('시작 날짜를 입력해주세요.');
      return;
    }
    if (!formData.endDate || formData.endDate.trim() === '') {
      setError('종료 날짜를 입력해주세요.');
      return;
    }
    if (!formData.registrationStart || formData.registrationStart.trim() === '') {
      setError('등록 시작 날짜를 입력해주세요.');
      return;
    }
    if (!formData.registrationEnd || formData.registrationEnd.trim() === '') {
      setError('등록 종료 날짜를 입력해주세요.');
      return;
    }
    if (!formData.location || !formData.location.trim()) {
      setError('개최 장소를 입력해주세요.');
      return;
    }
    if (!formData.venue || !formData.venue.trim()) {
      setError('상세 장소를 입력해주세요.');
      return;
    }
    if (!formData.maxParticipants || formData.maxParticipants < 4) {
      setError('최대 참가자 수는 4명 이상이어야 합니다.');
      return;
    }
    if (!formData.participantFee || formData.participantFee < 0) {
      setError('참가비를 입력해주세요.');
      return;
    }

    console.log('Form data after validation:', formData);

    try {
      // 날짜 검증 및 변환
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      const regStartDate = new Date(formData.registrationStart);
      const regEndDate = new Date(formData.registrationEnd);
      
      if (isNaN(startDate.getTime())) {
        setError('시작 날짜가 올바르지 않습니다.');
        return;
      }
      if (isNaN(endDate.getTime())) {
        setError('종료 날짜가 올바르지 않습니다.');
        return;
      }
      if (isNaN(regStartDate.getTime())) {
        setError('등록 시작 날짜가 올바르지 않습니다.');
        return;
      }
      if (isNaN(regEndDate.getTime())) {
        setError('등록 종료 날짜가 올바르지 않습니다.');
        return;
      }
      if (startDate > endDate) {
        setError('종료 날짜는 시작 날짜보다 이전일 수 없습니다.');
        return;
      }
      if (regStartDate >= regEndDate) {
        setError('등록 종료 날짜는 등록 시작 날짜보다 늦어야 합니다.');
        return;
      }
      if (regEndDate > startDate) {
        setError('등록 종료 날짜는 대회 시작 날짜보다 이전이어야 합니다.');
        return;
      }

      // For same-day tournaments, set different times to avoid validation issues
      const finalStartDate = new Date(startDate);
      const finalEndDate = new Date(endDate);
      
      // If it's the same day, set start to 8 AM and end to 8 PM
      if (finalStartDate.toDateString() === finalEndDate.toDateString()) {
        finalStartDate.setHours(8, 0, 0, 0);  // 8:00 AM
        finalEndDate.setHours(20, 0, 0, 0);   // 8:00 PM
      }

      const submitData = {
        ...formData,
        startDate: finalStartDate.toISOString(),
        endDate: finalEndDate.toISOString(),
        registrationStart: regStartDate.toISOString(),
        registrationEnd: regEndDate.toISOString(),
      };

      console.log('Submit data:', submitData);

      if (isEdit) {
        await updateTournament({ id: id!, ...submitData }).unwrap();
      } else {
        await createTournament(submitData).unwrap();
      }

      navigate('/tournaments');
    } catch (err: any) {
      console.error('Submit error:', err);
      setError(err.data?.message || '대회 저장 중 오류가 발생했습니다.');
    }
  };

  const tournamentTypes = [
    { value: 'single_elimination', label: '단일 토너먼트' },
    { value: 'double_elimination', label: '더블 토너먼트' },
    { value: 'round_robin', label: '리그전' },
    { value: 'hybrid', label: '하이브리드 (예선 리그전 + 본선 토너먼트)' },
  ];

  const skillLevels = [
    { value: 'all', label: '전체' },
    { value: 'd_class', label: 'Group D (Beginner)' },
    { value: 'c_class', label: 'Group C (Intermediate)' },
    { value: 'b_class', label: 'Group B (Advanced)' },
    { value: 'a_class', label: 'Group A (Expert)' },
  ];

  if (isEdit && isLoadingTournament) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/tournaments')}
          sx={{ mr: 2 }}
        >
          뒤로
        </Button>
        <Typography variant="h4">
          {isEdit ? '대회 수정' : '새 대회 생성'}
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              label="대회명"
              value={formData.name}
              onChange={handleChange('name')}
              required
              fullWidth
            />

            <TextField
              label="대회 설명"
              value={formData.description}
              onChange={handleChange('description')}
              multiline
              rows={3}
              fullWidth
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <TextField
                select
                label="대회 카테고리"
                value={formData.category}
                onChange={handleChange('category')}
                required
              >
                <MenuItem value="badminton">배드민턴</MenuItem>
                <MenuItem value="pickleball">피클볼</MenuItem>
                <MenuItem value="tennis">테니스</MenuItem>
              </TextField>

              <TextField
                label="상세 장소/코트"
                value={formData.venue}
                onChange={handleChange('venue')}
                required
                placeholder="예: A코트, 1번 체육관 등"
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <CustomDatePicker
                label="시작 날짜"
                value={formData.startDate}
                onChange={(value) => setFormData(prev => ({ ...prev, startDate: value }))}
                required
                helperText="시작 날짜 (dd/MM/yyyy)"
              />

              <CustomDatePicker
                label="종료 날짜"
                value={formData.endDate}
                onChange={(value) => setFormData(prev => ({ ...prev, endDate: value }))}
                required
                helperText="종료 날짜 (dd/MM/yyyy)"
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <CustomDatePicker
                label="등록 시작 날짜"
                value={formData.registrationStart}
                onChange={(value) => setFormData(prev => ({ ...prev, registrationStart: value }))}
                required
                helperText="등록 시작 날짜 (dd/MM/yyyy)"
              />

              <CustomDatePicker
                label="등록 종료 날짜"
                value={formData.registrationEnd}
                onChange={(value) => setFormData(prev => ({ ...prev, registrationEnd: value }))}
                required
                helperText="등록 종료 날짜 (dd/MM/yyyy)"
              />
            </Box>

            <TextField
              label="개최 장소"
              value={formData.location}
              onChange={handleChange('location')}
              required
              fullWidth
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="최대 참가자 수"
                type="number"
                value={formData.maxParticipants}
                onChange={handleChange('maxParticipants')}
                required
                inputProps={{ min: 4, max: 128 }}
              />

              <TextField
                label="참가비 (VND)"
                value={participantFeeDisplay}
                onChange={handleChange('participantFee')}
                required
                placeholder="100.000"
                helperText="Số tiền phí tham gia"
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <TextField
                select
                label="대회 형식"
                value={formData.tournamentType}
                onChange={handleChange('tournamentType')}
                required
              >
                {tournamentTypes.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="실력 수준"
                value={formData.skillLevel}
                onChange={handleChange('skillLevel')}
                required
              >
                {skillLevels.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {/* 대진표 설정 섹션 */}
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>
              대진표 설정
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* 종목 선택 */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  종목 선택 (복수 선택 가능)
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {[
                    { value: 'singles', label: '단식' },
                    { value: 'doubles', label: '복식' },
                    { value: 'mixed_doubles', label: '혼복' }
                  ].map((eventType) => (
                    <Chip
                      key={eventType.value}
                      label={eventType.label}
                      onClick={() => handleEventTypeChange(eventType.value)}
                      color={formData.eventTypes.includes(eventType.value) ? 'primary' : 'default'}
                      variant={formData.eventTypes.includes(eventType.value) ? 'filled' : 'outlined'}
                      clickable
                    />
                  ))}
                </Box>
              </Box>

              {/* 실력 수준 설정 */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.allowMixedSkillLevel}
                    onChange={handleAllowMixedSkillLevelChange}
                  />
                }
                label="실력 수준 혼합 허용"
              />

              {formData.allowMixedSkillLevel && (
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                  <TextField
                    select
                    label="최소 실력 수준"
                    value={formData.minSkillLevel}
                    onChange={handleChange('minSkillLevel')}
                  >
                    {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((level) => (
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
                  >
                    {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((level) => (
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
                    helperText="0=제한없음, 1-3=레벨차이"
                  />
                </Box>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/tournaments')}
              >
                취소
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<Save />}
                disabled={isCreating || isUpdating}
              >
                {isCreating || isUpdating ? (
                  <>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    저장 중...
                  </>
                ) : (
                  '저장'
                )}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TournamentForm;