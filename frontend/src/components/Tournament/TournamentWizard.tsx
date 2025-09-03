import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import { ArrowBack, ArrowForward, Check, Save } from '@mui/icons-material';
import { useCreateTournamentMutation } from '../../store/api/apiSlice';
import { useNotifications } from '../../hooks/useNotifications';

// Step Components
import BasicInfoStep from './WizardSteps/BasicInfoStep';
import SettingsStep from './WizardSteps/SettingsStep';
import BracketConfigStep from './WizardSteps/BracketConfigStep';

export interface TournamentFormData {
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
  eventTypes: string[];
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
  eventTypes: ['singles'],
  allowMixedSkillLevel: true,
  minSkillLevel: 'Beginner',
  maxSkillLevel: 'Expert',
  skillDiffLimit: 2,
};

const steps = [
  {
    label: '기본 정보',
    description: '대회명, 설명, 일정',
  },
  {
    label: '설정 & 규칙',
    description: '장소, 참가비, 형식',
  },
  {
    label: '대진표 구성',
    description: '종목, 실력 수준',
  },
];

const TournamentWizard: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<TournamentFormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  const [createTournament, { isLoading: isCreating }] = useCreateTournamentMutation();
  const { showSuccessNotification, showErrorNotification } = useNotifications();

  const handleNext = () => {
    if (validateCurrentStep()) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
      setError(null);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setError(null);
  };

  const validateCurrentStep = (): boolean => {
    setError(null);
    
    switch (activeStep) {
      case 0: // Basic Info
        if (!formData.name?.trim()) {
          setError('대회명을 입력해주세요.');
          return false;
        }
        if (!formData.startDate) {
          setError('시작 날짜를 입력해주세요.');
          return false;
        }
        if (!formData.endDate) {
          setError('종료 날짜를 입력해주세요.');
          return false;
        }
        if (!formData.registrationStart) {
          setError('등록 시작 날짜를 입력해주세요.');
          return false;
        }
        if (!formData.registrationEnd) {
          setError('등록 종료 날짜를 입력해주세요.');
          return false;
        }
        
        // Date validation
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);
        const regStartDate = new Date(formData.registrationStart);
        const regEndDate = new Date(formData.registrationEnd);
        
        if (startDate > endDate) {
          setError('종료 날짜는 시작 날짜보다 늦어야 합니다.');
          return false;
        }
        if (regStartDate >= regEndDate) {
          setError('등록 종료 날짜는 등록 시작 날짜보다 늦어야 합니다.');
          return false;
        }
        if (regEndDate > startDate) {
          setError('등록 종료 날짜는 대회 시작 날짜보다 이전이어야 합니다.');
          return false;
        }
        return true;
        
      case 1: // Settings
        if (!formData.location?.trim()) {
          setError('개최 장소를 입력해주세요.');
          return false;
        }
        if (!formData.venue?.trim()) {
          setError('상세 장소를 입력해주세요.');
          return false;
        }
        if (formData.maxParticipants < 4) {
          setError('최대 참가자 수는 4명 이상이어야 합니다.');
          return false;
        }
        if (formData.participantFee < 0) {
          setError('참가비는 0 이상이어야 합니다.');
          return false;
        }
        return true;
        
      case 2: // Bracket Config
        if (formData.eventTypes.length === 0) {
          setError('최소 하나의 종목을 선택해주세요.');
          return false;
        }
        return true;
        
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      return;
    }

    try {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      const regStartDate = new Date(formData.registrationStart);
      const regEndDate = new Date(formData.registrationEnd);
      
      // For same-day tournaments, set different times
      const finalStartDate = new Date(startDate);
      const finalEndDate = new Date(endDate);
      
      if (finalStartDate.toDateString() === finalEndDate.toDateString()) {
        finalStartDate.setHours(8, 0, 0, 0);
        finalEndDate.setHours(20, 0, 0, 0);
      }

      const submitData = {
        ...formData,
        startDate: finalStartDate.toISOString(),
        endDate: finalEndDate.toISOString(),
        registrationStart: regStartDate.toISOString(),
        registrationEnd: regEndDate.toISOString(),
      };

      const result = await createTournament(submitData).unwrap();
      
      showSuccessNotification(
        `대회 "${formData.name}"이(가) 성공적으로 생성되었습니다.`,
        '대회 생성 완료',
        { category: 'tournament' }
      );
      
      navigate('/tournaments');
    } catch (err: any) {
      console.error('Submit error:', err);
      const errorMessage = err.data?.message || '대회 생성 중 오류가 발생했습니다.';
      setError(errorMessage);
      
      showErrorNotification(
        errorMessage,
        '대회 생성 실패',
        { category: 'tournament' }
      );
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <BasicInfoStep
            formData={formData}
            setFormData={setFormData}
            error={error}
          />
        );
      case 1:
        return (
          <SettingsStep
            formData={formData}
            setFormData={setFormData}
            error={error}
          />
        );
      case 2:
        return (
          <BracketConfigStep
            formData={formData}
            setFormData={setFormData}
            error={error}
          />
        );
      default:
        return null;
    }
  };

  const isLastStep = activeStep === steps.length - 1;

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
          새 대회 생성 마법사
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel>
                  <Typography variant="subtitle2">{step.label}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {step.description}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          <Divider sx={{ mb: 3 }} />

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ minHeight: '400px', mb: 3 }}>
            {renderStepContent(activeStep)}
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
              startIcon={<ArrowBack />}
            >
              이전
            </Button>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/tournaments')}
              >
                취소
              </Button>
              
              {isLastStep ? (
                <Button
                  variant="contained"
                  onClick={() => setConfirmDialogOpen(true)}
                  startIcon={<Save />}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <CircularProgress size={16} sx={{ mr: 1 }} />
                      생성 중...
                    </>
                  ) : (
                    '대회 생성'
                  )}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ArrowForward />}
                >
                  다음
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} maxWidth="md">
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Check color="success" />
            대회 생성 확인
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            다음 정보로 새 대회를 생성하시겠습니까?
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>기본 정보</Typography>
            <Typography variant="body2">대회명: {formData.name}</Typography>
            <Typography variant="body2">카테고리: {formData.category}</Typography>
            <Typography variant="body2">일정: {formData.startDate} ~ {formData.endDate}</Typography>
            <Typography variant="body2">등록 기간: {formData.registrationStart} ~ {formData.registrationEnd}</Typography>
            
            <Typography variant="subtitle2" sx={{ mt: 2 }} gutterBottom>설정</Typography>
            <Typography variant="body2">장소: {formData.location} ({formData.venue})</Typography>
            <Typography variant="body2">최대 참가자: {formData.maxParticipants}명</Typography>
            <Typography variant="body2">참가비: {formData.participantFee.toLocaleString()}원</Typography>
            
            <Typography variant="subtitle2" sx={{ mt: 2 }} gutterBottom>대진표</Typography>
            <Typography variant="body2">종목: {formData.eventTypes.join(', ')}</Typography>
            <Typography variant="body2">실력 수준 혼합: {formData.allowMixedSkillLevel ? '허용' : '불허'}</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>
            취소
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={isCreating}
            startIcon={isCreating ? <CircularProgress size={16} /> : <Save />}
          >
            {isCreating ? '생성 중...' : '확인'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TournamentWizard;