import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { EmojiEvents } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '../../store/api/apiSlice';
import { loginSuccess } from '../../store/slices/authSlice';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberEmail, setRememberEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();

  useEffect(() => {
    // 저장된 이메일 불러오기
    const savedEmail = localStorage.getItem('adminRememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberEmail(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const result = await login({ email, password }).unwrap();
      console.log('Login result:', result);
      console.log('Token received:', result.data?.accessToken ? `${result.data.accessToken.substring(0, 20)}...` : 'none');
      console.log('Token length:', result.data?.accessToken ? result.data.accessToken.length : 0);
      
      // 이메일 기억하기 처리
      if (rememberEmail) {
        localStorage.setItem('adminRememberedEmail', email);
        console.log('💾 Admin Login: Email saved for next login');
      } else {
        localStorage.removeItem('adminRememberedEmail');
        console.log('🗑️ Admin Login: Saved email removed');
      }
      
      dispatch(loginSuccess({
        token: result.data.accessToken,
        user: result.data.user
      }));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.data?.message || '로그인에 실패했습니다.');
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <EmojiEvents sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography component="h1" variant="h4" gutterBottom>
            대회 관리 시스템
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
            관리자 로그인
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="이메일"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="비밀번호"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
                label="이메일 주소 기억하기"
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
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                '로그인'
              )}
            </Button>
          </Box>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Powered by KBJ
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;