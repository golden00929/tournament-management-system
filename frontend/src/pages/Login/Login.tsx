import React, { useState } from 'react';
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
} from '@mui/material';
import { EmojiEvents } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '../../store/api/apiSlice';
import { loginSuccess } from '../../store/slices/authSlice';

const Login: React.FC = () => {
  const [email, setEmail] = useState('admin@tournament.com');
  const [password, setPassword] = useState('admin123!');
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const result = await login({ email, password }).unwrap();
      console.log('Login result:', result);
      console.log('Token received:', result.data?.accessToken ? `${result.data.accessToken.substring(0, 20)}...` : 'none');
      console.log('Token length:', result.data?.accessToken ? result.data.accessToken.length : 0);
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
              테스트 계정: admin@tournament.com / admin123!
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;