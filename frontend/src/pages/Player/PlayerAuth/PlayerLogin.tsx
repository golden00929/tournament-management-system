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
import { useTranslation } from 'react-i18next';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  SportsHandball as SportsIcon,
  Login as LoginIcon,
} from '@mui/icons-material';
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
      user: user?.role,
      redirecting 
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
      console.error('Error details:', {
        message: err?.message,
        data: err?.data,
        status: err?.status
      });
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
        <Paper 
          elevation={8} 
          sx={{ 
            width: '100%',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          {/* 헤더 */}
          <Box
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              p: 4,
              textAlign: 'center',
              position: 'relative',
            }}
          >
            {/* 언어 선택기 */}
            <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
              <LanguageSelector />
            </Box>
            
            <SportsIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {t('auth.loginTitle')}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              {t('auth.loginSubtitle', { defaultValue: 'Login to participate in tournaments' })}
            </Typography>
          </Box>

          <CardContent sx={{ p: 4 }}>
            {/* 에러 메시지 */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {getErrorMessage()}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label={t('auth.email')}
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  error={!!validationErrors.email}
                  helperText={validationErrors.email}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  placeholder="example@email.com"
                />
              </Box>

              <Box sx={{ mb: 4 }}>
                <TextField
                  fullWidth
                  label={t('auth.password')}
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  error={!!validationErrors.password}
                  helperText={validationErrors.password}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          aria-label={t('auth.togglePassword', { defaultValue: 'Toggle password visibility' })}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  placeholder={t('auth.passwordPlaceholder', { defaultValue: 'Enter your password' })}
                />
              </Box>

              {/* 이메일 기억하기 체크박스 */}
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={rememberEmail}
                      onChange={(e) => setRememberEmail(e.target.checked)}
                      name="rememberEmail"
                      color="primary"
                    />
                  }
                  label={t('auth.rememberEmail', { defaultValue: 'Remember email address' })}
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
                size="large"
                disabled={isLoading}
                startIcon={<LoginIcon />}
                sx={{
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  mb: 3,
                }}
              >
                {isLoading ? t('auth.loggingIn', { defaultValue: 'Logging in...' }) : t('auth.login')}
              </Button>
            </form>

            <Divider sx={{ my: 3 }} />

            {/* 회원가입 링크 */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('auth.noAccount', { defaultValue: "Don't have an account yet?" })}
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
                {t('auth.register')}
              </Link>
            </Box>

            {/* 관리자 로그인 링크 */}
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('auth.isAdmin', { defaultValue: 'Are you an administrator?' })}
              </Typography>
              <Link
                component={RouterLink}
                to="/login"
                variant="body2"
                color="text.secondary"
                sx={{
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                {t('auth.adminLogin', { defaultValue: 'Admin Login' })}
              </Link>
            </Box>
          </CardContent>
        </Paper>
      </Box>
    </Container>
  );
};

export default PlayerLogin;