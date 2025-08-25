import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  Container,
  InputAdornment,
  IconButton,
  Paper,
  Divider,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
} from '@mui/icons-material';
import miiracerLogo from '../../../assets/miiracer-logo.jpg';
import LanguageSelector from '../../../components/LanguageSelector/LanguageSelector';
import { useDispatch } from 'react-redux';
import { usePlayerLoginMutation } from '../../../store/api/playerApiSlice';
import { setCredentials } from '../../../store/slices/authSlice';
import { getValidUser, getValidToken } from '../../../utils/localStorage';

const PlayerLogin: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [playerLogin, { isLoading, error }] = usePlayerLoginMutation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // 이미 로그인된 선수가 있다면 대시보드로 리다이렉트
    const token = getValidToken();
    const user = getValidUser();
    
    console.log('🔍 PlayerLogin: Checking existing auth', { 
      token: !!token, 
      tokenLength: token?.length || 0,
      user: user?.role,
      userId: user?.id,
      userName: user?.name,
      userEmail: user?.email,
      redirecting,
      localStorage_token: localStorage.getItem('token'),
      localStorage_user: localStorage.getItem('user')
    });
    
    if (token && user && user.role === 'player' && !redirecting) {
      console.log('♻️ PlayerLogin: Redirecting to dashboard (already logged in)');
      setRedirecting(true);
      setTimeout(() => {
        navigate('/player/dashboard', { replace: true });
      }, 100);
    }
  }, [navigate, redirecting]);

  useEffect(() => {
    // 저장된 이메일 불러오기
    const savedEmail = localStorage.getItem('playerRememberedEmail');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberEmail(true);
    }
  }, []);

  const validateForm = () => {
    const errors: {[key: string]: string} = {};

    // 이메일 검증
    if (!formData.email) {
      errors.email = t('auth.email') + ' ' + t('common.required', { defaultValue: 'is required' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t('auth.emailValidation', { defaultValue: 'Please enter a valid email format' });
    }

    // 비밀번호 검증
    if (!formData.password) {
      errors.password = t('auth.password') + ' ' + t('common.required', { defaultValue: 'is required' });
    } else if (formData.password.length < 6) {
      errors.password = t('auth.passwordMinLength', { defaultValue: 'Password must be at least 6 characters' });
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: string) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    
    // 입력 시 해당 필드의 에러 제거
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    console.log('🔐 PlayerLogin: Form submission started', formData);

    if (!validateForm()) {
      console.log('❌ PlayerLogin: Form validation failed');
      return;
    }

    try {
      console.log('🚀 PlayerLogin: Sending login request', formData);
      console.log('🌐 API Base URL:', process.env.REACT_APP_API_URL);
      console.log('🔗 Full API URL:', `${process.env.REACT_APP_API_URL || 'https://tournament-management-system-production.up.railway.app/api'}/player-auth/login`);
      
      const result = await playerLogin(formData).unwrap();
      console.log('✅ PlayerLogin: Login successful', result);
      
      if (result.success) {
        // 이메일 기억하기 처리
        if (rememberEmail) {
          localStorage.setItem('playerRememberedEmail', formData.email);
          console.log('💾 PlayerLogin: Email saved for next login');
        } else {
          localStorage.removeItem('playerRememberedEmail');
          console.log('🗑️ PlayerLogin: Saved email removed');
        }

        // 사용자 정보에 role 추가 (API에서 role이 없을 경우 대비)
        const playerData = (result.data as any).player || (result.data as any).user;
        const userData = {
          ...playerData,
          role: 'player'
        };

        console.log('💾 PlayerLogin: Saving user data', userData);

        // Redux store와 localStorage에 인증 정보 저장
        dispatch(setCredentials({
          token: result.data.accessToken,
          user: userData,
        }));

        localStorage.setItem('token', result.data.accessToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // 리프레시 토큰도 저장 (자동 갱신용)
        if (result.data.refreshToken) {
          localStorage.setItem('refreshToken', result.data.refreshToken);
          console.log('💾 PlayerLogin: Refresh token saved for auto-refresh');
        }

        // localStorage 변경 이벤트 강제 발생 (같은 탭에서는 자동으로 발생하지 않음)
        window.dispatchEvent(new Event('storage'));

        // 깜빡임 방지를 위한 상태 설정
        setRedirecting(true);
        
        // 선수 대시보드로 이동 - 충분한 시간 대기
        setTimeout(() => {
          navigate('/player/dashboard', { replace: true });
        }, 500);
      }
    } catch (err: any) {
      console.error('❌ PlayerLogin: Login failed', err);
      console.error('🔍 Detailed error analysis:', {
        message: err?.message,
        data: err?.data,
        status: err?.status,
        error: err?.error,
        originalStatus: err?.originalStatus,
        isUnhandledError: err?.isUnhandledError,
        name: err?.name,
        stack: err?.stack
      });
      
      // 네트워크 에러 여부 확인
      if (err?.status === 'FETCH_ERROR') {
        console.error('🌐 Network fetch error - 네트워크 연결 문제 또는 CORS 에러');
      } else if (err?.status === 'PARSING_ERROR') {
        console.error('📝 Response parsing error - 응답 파싱 실패');
      } else if (err?.status === 'TIMEOUT_ERROR') {
        console.error('⏰ Request timeout error - 요청 시간 초과');
      } else if (err?.originalStatus) {
        console.error(`🔴 HTTP ${err.originalStatus} error from server`);
      }
    }
  };

  const getErrorMessage = () => {
    if (error) {
      if ('data' in error) {
        const errorData = error.data as any;
        return errorData?.message || t('auth.loginError');
      }
      return t('common.networkError', { defaultValue: 'Network error occurred' });
    }
    return '';
  };

  // 리다이렉트 중일 때는 로딩 표시
  if (redirecting) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 3,
          }}
        >
          <Typography variant="h6">{t('common.redirecting', { defaultValue: 'Redirecting to dashboard...' })}</Typography>
        </Box>
      </Container>
    );
  }

  // Miiracer 테마 색상 정의
  const miiracerTheme = {
    background: {
      primary: '#E31E1E',
      secondary: '#B71C1C',
      light: '#FF5555',
    },
    text: {
      primary: '#ffffff',
      secondary: '#f5f5f5',
      accent: '#ffffff',
    },
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${miiracerTheme.background.primary} 0%, ${miiracerTheme.background.secondary} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Paper
            elevation={0}
            sx={{
              padding: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              borderRadius: 3,
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              backdropFilter: 'blur(10px)',
              backgroundColor: 'rgba(255,255,255,0.95)',
            }}
          >
            <Box
              component="img"
              src={miiracerLogo}
              alt="Miiracer Logo"
              sx={{
                height: 60,
                width: 'auto',
                objectFit: 'contain',
                mb: 3,
              }}
            />
            <Typography component="h1" variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#2C2C2C' }}>
              Miiracer 선수 로그인
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
              {t('auth.loginSubtitle', { defaultValue: '대회에 참가하려면 로그인하세요' })}
            </Typography>

            {/* 언어 선택기 */}
            <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
              <LanguageSelector />
            </Box>

            {/* 에러 메시지 */}
            {error && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {getErrorMessage()}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label={t('auth.email', { defaultValue: '이메일' })}
                name="email"
                autoComplete="email"
                autoFocus
                value={formData.email}
                onChange={handleInputChange('email')}
                error={!!validationErrors.email}
                helperText={validationErrors.email}
                disabled={isLoading}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label={t('auth.password', { defaultValue: '비밀번호' })}
                type="password"
                id="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleInputChange('password')}
                error={!!validationErrors.password}
                helperText={validationErrors.password}
                disabled={isLoading}
              />

              {/* 이메일 기억하기 체크박스 */}
              <Box sx={{ mt: 1, mb: 1 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={rememberEmail}
                      onChange={(e) => setRememberEmail(e.target.checked)}
                      name="rememberEmail"
                      color="primary"
                    />
                  }
                  label={t('auth.rememberEmail', { defaultValue: '이메일 주소 기억하기' })}
                  sx={{ 
                    color: 'text.secondary',
                    '& .MuiFormControlLabel-label': {
                      fontSize: '0.875rem'
                    }
                  }}
                />
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, py: 1.5 }}
                disabled={isLoading}
              >
                {isLoading ? t('auth.loggingIn', { defaultValue: '로그인 중...' }) : t('auth.login', { defaultValue: '로그인' })}
              </Button>
            </Box>

            {/* 회원가입 링크 */}
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('auth.noAccount', { defaultValue: "아직 계정이 없으신가요?" })}
              </Typography>
              <Link
                component={RouterLink}
                to="/player/register"
                variant="body1"
                sx={{
                  fontWeight: 'bold',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                {t('auth.register', { defaultValue: '회원가입' })}
              </Link>
            </Box>

            {/* 관리자 로그인 링크 */}
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('auth.isAdmin', { defaultValue: '관리자이신가요?' })}
              </Typography>
              <Link
                component={RouterLink}
                to="/login"
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                {t('auth.adminLogin', { defaultValue: '관리자 로그인' })}
              </Link>
            </Box>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Powered by Miiracer Team
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default PlayerLogin;