import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Stack,
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
  MenuItem,
  FormHelperText,
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Visibility,
  VisibilityOff,
  SportsHandball as SportsIcon,
  PersonAdd as PersonAddIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { usePlayerRegisterMutation } from '../../../store/api/playerApiSlice';

// 베트남 지역 데이터
const vietnamProvinces = [
  { value: 'ho-chi-minh', label: '호치민시 (TP. Hồ Chí Minh)' },
  { value: 'hanoi', label: '하노이 (Hà Nội)' },
  { value: 'da-nang', label: '다낭 (Đà Nẵng)' },
  { value: 'hai-phong', label: '하이퐁 (Hải Phòng)' },
  { value: 'can-tho', label: '껀터 (Cần Thơ)' },
  { value: 'bien-hoa', label: '비엔호아 (Biên Hòa)' },
  { value: 'hue', label: '후에 (Huế)' },
  { value: 'nha-trang', label: '나짱 (Nha Trang)' },
  { value: 'vung-tau', label: '붕따우 (Vũng Tàu)' },
  { value: 'other', label: '기타' },
];

const hoChiMinhDistricts = [
  { value: 'district-1', label: '1군 (Quận 1)' },
  { value: 'district-2', label: '2군 (Quận 2)' },
  { value: 'district-3', label: '3군 (Quận 3)' },
  { value: 'district-4', label: '4군 (Quận 4)' },
  { value: 'district-5', label: '5군 (Quận 5)' },
  { value: 'district-6', label: '6군 (Quận 6)' },
  { value: 'district-7', label: '7군 (Quận 7)' },
  { value: 'district-8', label: '8군 (Quận 8)' },
  { value: 'district-9', label: '9군 (Quận 9)' },
  { value: 'district-10', label: '10군 (Quận 10)' },
  { value: 'district-11', label: '11군 (Quận 11)' },
  { value: 'district-12', label: '12군 (Quận 12)' },
  { value: 'binh-thanh', label: '빈탄군 (Quận Bình Thạnh)' },
  { value: 'go-vap', label: '고밥군 (Quận Gò Vấp)' },
  { value: 'phu-nhuan', label: '푸누안군 (Quận Phú Nhuận)' },
  { value: 'tan-binh', label: '탄빈군 (Quận Tân Bình)' },
  { value: 'tan-phu', label: '탄푸군 (Quận Tân Phú)' },
  { value: 'thu-duc', label: '투득시 (TP. Thủ Đức)' },
  { value: 'binh-chanh', label: '빈찬현 (Huyện Bình Chánh)' },
  { value: 'can-gio', label: '깐저현 (Huyện Cần Giờ)' },
  { value: 'cu-chi', label: '꾸찌현 (Huyện Củ Chi)' },
  { value: 'hoc-mon', label: '혹몬현 (Huyện Hóc Môn)' },
  { value: 'nha-be', label: '냐베현 (Huyện Nhà Bè)' },
];

const PlayerRegister: React.FC = () => {
  const navigate = useNavigate();
  const [playerRegister, { isLoading, error }] = usePlayerRegisterMutation();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    birthYear: new Date().getFullYear() - 25, // 기본값: 25세
    gender: '',
    province: '',
    district: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const validateForm = () => {
    const errors: {[key: string]: string} = {};

    // 이름 검증
    if (!formData.name) {
      errors.name = '이름을 입력해주세요.';
    } else if (formData.name.length < 2) {
      errors.name = '이름은 최소 2자 이상이어야 합니다.';
    }

    // 이메일 검증
    if (!formData.email) {
      errors.email = '이메일을 입력해주세요.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = '올바른 이메일 형식을 입력해주세요.';
    }

    // 전화번호 검증 (베트남 형식: 10자리)
    if (!formData.phone) {
      errors.phone = '전화번호를 입력해주세요.';
    } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = '전화번호는 10자리 숫자여야 합니다. (예: 0123456789)';
    }

    // 생년 검증
    const currentYear = new Date().getFullYear();
    if (!formData.birthYear) {
      errors.birthYear = '출생년도를 입력해주세요.';
    } else if (formData.birthYear < 1950 || formData.birthYear > currentYear - 10) {
      errors.birthYear = `출생년도는 1950년 ~ ${currentYear - 10}년 사이여야 합니다.`;
    }

    // 성별 검증
    if (!formData.gender) {
      errors.gender = '성별을 선택해주세요.';
    }

    // 지역 검증
    if (!formData.province) {
      errors.province = '지역을 선택해주세요.';
    }

    if (!formData.district) {
      errors.district = '구/군을 선택해주세요.';
    }

    // 비밀번호 검증
    if (!formData.password) {
      errors.password = '비밀번호를 입력해주세요.';
    } else if (formData.password.length < 6) {
      errors.password = '비밀번호는 최소 6자 이상이어야 합니다.';
    }

    // 비밀번호 확인 검증
    if (!formData.confirmPassword) {
      errors.confirmPassword = '비밀번호 확인을 입력해주세요.';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = '비밀번호가 일치하지 않습니다.';
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

    if (!validateForm()) {
      return;
    }

    try {
      const { confirmPassword, ...registerData } = formData;
      const result = await playerRegister(registerData).unwrap();
      
      if (result.success) {
        setRegistrationSuccess(true);
      }
    } catch (err: any) {
      console.error('회원가입 오류:', err);
    }
  };

  const getErrorMessage = () => {
    if (error) {
      if ('data' in error) {
        const errorData = error.data as any;
        return errorData?.message || '회원가입 중 오류가 발생했습니다.';
      }
      return '네트워크 오류가 발생했습니다.';
    }
    return '';
  };

  // 성공 메시지 표시
  if (registrationSuccess) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Paper elevation={8} sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
            <SportsIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              회원가입 완료!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              계정이 성공적으로 생성되었습니다.
              이제 로그인하여 대회에 참가하실 수 있습니다.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/player/login')}
              sx={{ mt: 2 }}
            >
              로그인하기
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
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
            }}
          >
            <SportsIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              선수 회원가입
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              대회 참가를 위한 계정을 만드세요
            </Typography>
          </Box>

          <Box sx={{ p: 4 }}>
            {/* 에러 메시지 */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {getErrorMessage()}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                {/* 기본 정보 */}
                <Typography variant="h6" gutterBottom>
                  기본 정보
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <TextField
                    fullWidth
                    label="이름"
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    error={!!validationErrors.name}
                    helperText={validationErrors.name}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                    placeholder="홍길동"
                  />

                  <TextField
                    fullWidth
                    label="이메일"
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

                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <TextField
                    fullWidth
                    label="전화번호"
                    value={formData.phone}
                    onChange={handleInputChange('phone')}
                    error={!!validationErrors.phone}
                    helperText={validationErrors.phone || '10자리 숫자 (예: 0123456789)'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                    placeholder="0123456789"
                  />

                  <TextField
                    fullWidth
                    label="출생년도"
                    type="number"
                    value={formData.birthYear}
                    onChange={handleInputChange('birthYear')}
                    error={!!validationErrors.birthYear}
                    helperText={validationErrors.birthYear}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                    inputProps={{
                      min: 1950,
                      max: new Date().getFullYear() - 10,
                    }}
                  />
                </Box>

                <TextField
                  fullWidth
                  select
                  label="성별"
                  value={formData.gender}
                  onChange={handleInputChange('gender')}
                  error={!!validationErrors.gender}
                  helperText={validationErrors.gender}
                  sx={{ maxWidth: { sm: '50%' } }}
                >
                  <MenuItem value="male">남성</MenuItem>
                  <MenuItem value="female">여성</MenuItem>
                </TextField>

                {/* 지역 정보 */}
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  지역 정보
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <TextField
                    fullWidth
                    select
                    label="지역"
                    value={formData.province}
                    onChange={handleInputChange('province')}
                    error={!!validationErrors.province}
                    helperText={validationErrors.province}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  >
                    {vietnamProvinces.map((province) => (
                      <MenuItem key={province.value} value={province.value}>
                        {province.label}
                      </MenuItem>
                    ))}
                  </TextField>

                  <Box sx={{ position: 'relative', flex: 1 }}>
                    <TextField
                      fullWidth
                      select
                      label="구/군"
                      value={formData.district}
                      onChange={handleInputChange('district')}
                      error={!!validationErrors.district}
                      helperText={validationErrors.district}
                      disabled={!formData.province}
                    >
                      {formData.province === 'ho-chi-minh' 
                        ? hoChiMinhDistricts.map((district) => (
                            <MenuItem key={district.value} value={district.value}>
                              {district.label}
                            </MenuItem>
                          ))
                        : <MenuItem value="general">시/군/구</MenuItem>
                      }
                    </TextField>
                    {!formData.province && (
                      <FormHelperText>먼저 지역을 선택해주세요</FormHelperText>
                    )}
                  </Box>
                </Box>

                {/* 비밀번호 */}
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  비밀번호 설정
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <TextField
                    fullWidth
                    label="비밀번호"
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
                            aria-label="비밀번호 표시 토글"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    placeholder="최소 6자 이상"
                  />

                  <TextField
                    fullWidth
                    label="비밀번호 확인"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange('confirmPassword')}
                    error={!!validationErrors.confirmPassword}
                    helperText={validationErrors.confirmPassword}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                            aria-label="비밀번호 확인 표시 토글"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    placeholder="비밀번호를 다시 입력"
                  />
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  startIcon={<PersonAddIcon />}
                  sx={{
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    mt: 2,
                  }}
                >
                  {isLoading ? '회원가입 중...' : '회원가입'}
                </Button>
              </Stack>
            </form>

            <Divider sx={{ my: 3 }} />

            {/* 로그인 링크 */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                이미 계정이 있으신가요?
              </Typography>
              <Link
                component={RouterLink}
                to="/player/login"
                variant="body1"
                sx={{
                  fontWeight: 'bold',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                로그인하기
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default PlayerRegister;