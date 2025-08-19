import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  alpha,
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
import LanguageSelector from '../../../components/LanguageSelector/LanguageSelector';



const PlayerRegister: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [playerRegister, { isLoading, error }] = usePlayerRegisterMutation();

  // 베트남 지역 데이터 (다국어)
  const vietnamProvinces = [
    { value: 'ho-chi-minh', label: t('player.register.provinces.hoChiMinh') },
    { value: 'hanoi', label: t('player.register.provinces.hanoi') },
    { value: 'da-nang', label: t('player.register.provinces.daNang') },
    { value: 'hai-phong', label: t('player.register.provinces.haiPhong') },
    { value: 'can-tho', label: t('player.register.provinces.canTho') },
    { value: 'bien-hoa', label: t('player.register.provinces.bienHoa') },
    { value: 'hue', label: t('player.register.provinces.hue') },
    { value: 'nha-trang', label: t('player.register.provinces.nhaTrang') },
    { value: 'vung-tau', label: t('player.register.provinces.vungTau') },
    { value: 'other', label: t('player.register.provinces.other') },
  ];

  const hoChiMinhDistricts = [
    { value: 'district-1', label: t('player.register.provinces.hoChiMinh') + ' - Quận 1' },
    { value: 'district-2', label: t('player.register.provinces.hoChiMinh') + ' - Quận 2' },
    { value: 'district-3', label: t('player.register.provinces.hoChiMinh') + ' - Quận 3' },
    { value: 'district-4', label: t('player.register.provinces.hoChiMinh') + ' - Quận 4' },
    { value: 'district-5', label: t('player.register.provinces.hoChiMinh') + ' - Quận 5' },
    { value: 'district-6', label: t('player.register.provinces.hoChiMinh') + ' - Quận 6' },
    { value: 'district-7', label: t('player.register.provinces.hoChiMinh') + ' - Quận 7' },
    { value: 'district-8', label: t('player.register.provinces.hoChiMinh') + ' - Quận 8' },
    { value: 'district-9', label: t('player.register.provinces.hoChiMinh') + ' - Quận 9' },
    { value: 'district-10', label: t('player.register.provinces.hoChiMinh') + ' - Quận 10' },
    { value: 'district-11', label: t('player.register.provinces.hoChiMinh') + ' - Quận 11' },
    { value: 'district-12', label: t('player.register.provinces.hoChiMinh') + ' - Quận 12' },
    { value: 'binh-thanh', label: t('player.register.provinces.hoChiMinh') + ' - Quận Bình Thạnh' },
    { value: 'go-vap', label: t('player.register.provinces.hoChiMinh') + ' - Quận Gò Vấp' },
    { value: 'phu-nhuan', label: t('player.register.provinces.hoChiMinh') + ' - Quận Phú Nhuận' },
    { value: 'tan-binh', label: t('player.register.provinces.hoChiMinh') + ' - Quận Tân Bình' },
    { value: 'tan-phu', label: t('player.register.provinces.hoChiMinh') + ' - Quận Tân Phú' },
    { value: 'thu-duc', label: t('player.register.provinces.hoChiMinh') + ' - TP. Thủ Đức' },
    { value: 'binh-chanh', label: t('player.register.provinces.hoChiMinh') + ' - Huyện Bình Chánh' },
    { value: 'can-gio', label: t('player.register.provinces.hoChiMinh') + ' - Huyện Cần Giờ' },
    { value: 'cu-chi', label: t('player.register.provinces.hoChiMinh') + ' - Huyện Củ Chi' },
    { value: 'hoc-mon', label: t('player.register.provinces.hoChiMinh') + ' - Huyện Hóc Môn' },
    { value: 'nha-be', label: t('player.register.provinces.hoChiMinh') + ' - Huyện Nhà Bè' },
  ];

  // 다크 테마 색상 정의
  const darkTheme = {
    background: {
      primary: '#121212',
      secondary: '#1e1e1e',
      tertiary: '#2d2d2d',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
      accent: '#e0e0e0',
    },
    accent: {
      primary: '#bb86fc',
      secondary: '#03dac6',
      gold: '#ffd700',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
    },
    card: {
      elevated: '#252525',
      hover: '#2a2a2a',
    }
  };

  // 공통 텍스트필드 스타일
  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
      bgcolor: alpha(darkTheme.background.tertiary, 0.5),
      color: darkTheme.text.primary,
      '& fieldset': {
        borderColor: alpha(darkTheme.text.secondary, 0.3),
      },
      '&:hover fieldset': {
        borderColor: darkTheme.accent.primary,
      },
      '&.Mui-focused fieldset': {
        borderColor: darkTheme.accent.primary,
      },
    },
    '& .MuiInputLabel-root': {
      color: darkTheme.text.secondary,
      '&.Mui-focused': {
        color: darkTheme.accent.primary,
      },
    },
    '& .MuiFormHelperText-root': {
      color: darkTheme.text.secondary,
      '&.Mui-error': {
        color: darkTheme.accent.error,
      },
    },
    '& .MuiInputAdornment-root .MuiSvgIcon-root': {
      color: darkTheme.text.secondary,
    },
    '& .MuiMenuItem-root': {
      color: darkTheme.text.primary,
      bgcolor: darkTheme.background.secondary,
      '&:hover': {
        bgcolor: alpha(darkTheme.accent.primary, 0.1),
      },
      '&.Mui-selected': {
        bgcolor: alpha(darkTheme.accent.primary, 0.2),
      },
    },
  };

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
      errors.name = t('player.register.validation.nameRequired');
    } else if (formData.name.length < 2) {
      errors.name = t('player.register.validation.nameMinLength');
    }

    // 이메일 검증
    if (!formData.email) {
      errors.email = t('player.register.validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t('player.register.validation.emailInvalid');
    }

    // 전화번호 검증 (베트남 형식: 10자리)
    if (!formData.phone) {
      errors.phone = t('player.register.validation.phoneRequired');
    } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = t('player.register.validation.phoneInvalid');
    }

    // 생년 검증
    const currentYear = new Date().getFullYear();
    if (!formData.birthYear) {
      errors.birthYear = t('player.register.validation.birthYearRequired');
    } else if (formData.birthYear < 1950 || formData.birthYear > currentYear - 10) {
      errors.birthYear = t('player.register.validation.birthYearInvalid', { maxYear: currentYear - 10 });
    }

    // 성별 검증
    if (!formData.gender) {
      errors.gender = t('player.register.validation.genderRequired');
    }

    // 지역 검증
    if (!formData.province) {
      errors.province = t('player.register.validation.provinceRequired');
    }

    if (!formData.district) {
      errors.district = t('player.register.validation.districtRequired');
    }

    // 비밀번호 검증
    if (!formData.password) {
      errors.password = t('player.register.validation.passwordRequired');
    } else if (formData.password.length < 6) {
      errors.password = t('player.register.validation.passwordMinLength');
    }

    // 비밀번호 확인 검증
    if (!formData.confirmPassword) {
      errors.confirmPassword = t('player.register.validation.confirmPasswordRequired');
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = t('player.register.validation.passwordMismatch');
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
        return errorData?.message || t('common.error', { defaultValue: 'An error occurred during registration.' });
      }
      return t('common.error', { defaultValue: 'Network error occurred.' });
    }
    return '';
  };

  // 성공 메시지 표시
  if (registrationSuccess) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${darkTheme.background.primary} 0%, ${darkTheme.background.secondary} 100%)`,
        color: darkTheme.text.primary,
      }}>
        <Container maxWidth="sm">
          <Box
            sx={{
              minHeight: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Paper 
              elevation={8} 
              sx={{ 
                p: 4, 
                textAlign: 'center', 
                borderRadius: 3,
                background: darkTheme.card.elevated,
                border: `1px solid ${alpha(darkTheme.text.secondary, 0.1)}`,
              }}
            >
              <SportsIcon sx={{ fontSize: 64, color: darkTheme.accent.success, mb: 2 }} />
              <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: darkTheme.text.primary }}>
                {t('player.register.success')}
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, color: darkTheme.text.secondary }}>
                {t('player.register.successMessage')}
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/player/login')}
                sx={{ 
                  mt: 2,
                  bgcolor: darkTheme.accent.primary,
                  '&:hover': {
                    bgcolor: alpha(darkTheme.accent.primary, 0.8)
                  }
                }}
              >
                {t('player.register.loginButton')}
              </Button>
            </Paper>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${darkTheme.background.primary} 0%, ${darkTheme.background.secondary} 100%)`,
      color: darkTheme.text.primary,
    }}>
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
              background: darkTheme.card.elevated,
              border: `1px solid ${alpha(darkTheme.text.secondary, 0.1)}`,
            }}
          >
            {/* 헤더 */}
            <Box
              sx={{
                background: `linear-gradient(135deg, ${darkTheme.accent.primary} 0%, ${darkTheme.accent.secondary} 100%)`,
                color: darkTheme.text.primary,
                p: 4,
                textAlign: 'center',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: `linear-gradient(90deg, ${darkTheme.accent.gold}, ${darkTheme.accent.secondary})`
                }
              }}
            >
              <SportsIcon sx={{ fontSize: 48, mb: 1, color: darkTheme.text.primary }} />
              <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: darkTheme.text.primary }}>
                {t('player.register.title')}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, color: alpha(darkTheme.text.primary, 0.8) }}>
                {t('player.register.subtitle')}
              </Typography>
              
              {/* 언어 선택기 */}
              <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                <LanguageSelector darkMode={true} />
              </Box>
            </Box>

          <Box sx={{ p: 4, background: darkTheme.card.elevated }}>
            {/* 에러 메시지 */}
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3,
                  bgcolor: alpha(darkTheme.accent.error, 0.1),
                  color: darkTheme.accent.error,
                  border: `1px solid ${alpha(darkTheme.accent.error, 0.3)}`,
                  '& .MuiAlert-icon': {
                    color: darkTheme.accent.error
                  }
                }}
              >
                {getErrorMessage()}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                {/* 기본 정보 */}
                <Typography variant="h6" gutterBottom sx={{ color: darkTheme.text.primary }}>
                  {t('player.register.basicInfo')}
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <TextField
                    fullWidth
                    label={t('player.register.name')}
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
                    placeholder={t('player.register.namePlaceholder')}
                    sx={textFieldStyle}
                  />

                  <TextField
                    fullWidth
                    label={t('player.register.email')}
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
                    placeholder={t('player.register.emailPlaceholder')}
                    sx={textFieldStyle}
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <TextField
                    fullWidth
                    label={t('player.register.phone')}
                    value={formData.phone}
                    onChange={handleInputChange('phone')}
                    error={!!validationErrors.phone}
                    helperText={validationErrors.phone || t('player.register.phoneHelperText')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                    placeholder={t('player.register.phonePlaceholder')}
                    sx={textFieldStyle}
                  />

                  <TextField
                    fullWidth
                    label={t('player.register.birthYear')}
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
                    sx={textFieldStyle}
                  />
                </Box>

                <TextField
                  fullWidth
                  select
                  label={t('player.register.gender')}
                  value={formData.gender}
                  onChange={handleInputChange('gender')}
                  error={!!validationErrors.gender}
                  helperText={validationErrors.gender}
                  sx={{ ...textFieldStyle, maxWidth: { sm: '50%' } }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: darkTheme.background.secondary,
                        border: `1px solid ${alpha(darkTheme.text.secondary, 0.2)}`,
                      },
                    },
                  }}
                >
                  <MenuItem value="male" sx={{ color: darkTheme.text.primary }}>{t('player.register.male')}</MenuItem>
                  <MenuItem value="female" sx={{ color: darkTheme.text.primary }}>{t('player.register.female')}</MenuItem>
                </TextField>

                {/* 지역 정보 */}
                <Typography variant="h6" gutterBottom sx={{ mt: 2, color: darkTheme.text.primary }}>
                  {t('player.register.locationInfo')}
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <TextField
                    fullWidth
                    select
                    label={t('player.register.province')}
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
                    sx={textFieldStyle}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          bgcolor: darkTheme.background.secondary,
                          border: `1px solid ${alpha(darkTheme.text.secondary, 0.2)}`,
                        },
                      },
                    }}
                  >
                    {vietnamProvinces.map((province) => (
                      <MenuItem key={province.value} value={province.value} sx={{ color: darkTheme.text.primary }}>
                        {province.label}
                      </MenuItem>
                    ))}
                  </TextField>

                  <Box sx={{ position: 'relative', flex: 1 }}>
                    <TextField
                      fullWidth
                      select
                      label={t('player.register.district')}
                      value={formData.district}
                      onChange={handleInputChange('district')}
                      error={!!validationErrors.district}
                      helperText={validationErrors.district}
                      disabled={!formData.province}
                      sx={textFieldStyle}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            bgcolor: darkTheme.background.secondary,
                            border: `1px solid ${alpha(darkTheme.text.secondary, 0.2)}`,
                          },
                        },
                      }}
                    >
                      {formData.province === 'ho-chi-minh' 
                        ? hoChiMinhDistricts.map((district) => (
                            <MenuItem key={district.value} value={district.value} sx={{ color: darkTheme.text.primary }}>
                              {district.label}
                            </MenuItem>
                          ))
                        : <MenuItem value="general" sx={{ color: darkTheme.text.primary }}>{t('player.register.districtGeneral')}</MenuItem>
                      }
                    </TextField>
                    {!formData.province && (
                      <FormHelperText sx={{ color: darkTheme.text.secondary }}>{t('player.register.selectProvince')}</FormHelperText>
                    )}
                  </Box>
                </Box>

                {/* 비밀번호 */}
                <Typography variant="h6" gutterBottom sx={{ mt: 2, color: darkTheme.text.primary }}>
                  {t('player.register.passwordSetup')}
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <TextField
                    fullWidth
                    label={t('player.register.password')}
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
                            aria-label="Toggle password visibility"
                            sx={{ color: darkTheme.text.secondary }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    placeholder={t('player.register.passwordPlaceholder')}
                    sx={textFieldStyle}
                  />

                  <TextField
                    fullWidth
                    label={t('player.register.confirmPassword')}
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
                            aria-label="Toggle confirm password visibility"
                            sx={{ color: darkTheme.text.secondary }}
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    placeholder={t('player.register.confirmPasswordPlaceholder')}
                    sx={textFieldStyle}
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
                    bgcolor: darkTheme.accent.primary,
                    '&:hover': {
                      bgcolor: alpha(darkTheme.accent.primary, 0.8)
                    },
                    '&:disabled': {
                      bgcolor: alpha(darkTheme.text.secondary, 0.3),
                      color: alpha(darkTheme.text.secondary, 0.7)
                    }
                  }}
                >
                  {isLoading ? t('player.register.registering') : t('player.register.register')}
                </Button>
              </Stack>
            </form>

            <Divider sx={{ my: 3, borderColor: alpha(darkTheme.text.secondary, 0.2) }} />

            {/* 로그인 링크 */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" gutterBottom sx={{ color: darkTheme.text.secondary }}>
                {t('player.register.alreadyHaveAccount')}
              </Typography>
              <Link
                component={RouterLink}
                to="/player/login"
                variant="body1"
                sx={{
                  fontWeight: 'bold',
                  textDecoration: 'none',
                  color: darkTheme.accent.primary,
                  '&:hover': {
                    textDecoration: 'underline',
                    color: alpha(darkTheme.accent.primary, 0.8),
                  },
                }}
              >
                {t('player.register.loginLink')}
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
    </Box>
  );
};

export default PlayerRegister;