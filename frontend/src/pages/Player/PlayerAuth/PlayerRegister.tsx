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
import miiracerLogo from '../../../assets/miiracer-logo.jpg';



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
    accent: {
      primary: '#E31E1E',
      secondary: '#B71C1C',
      success: '#4caf50',
      error: '#f44336',
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
        background: `linear-gradient(135deg, ${miiracerTheme.background.primary} 0%, ${miiracerTheme.background.secondary} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}>
        <Container maxWidth="sm">
          <Paper 
            elevation={0} 
            sx={{ 
              p: 4, 
              textAlign: 'center', 
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
            <SportsIcon sx={{ fontSize: 64, color: miiracerTheme.accent.success, mb: 2 }} />
            <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: '#2C2C2C' }}>
              {t('player.register.success', { defaultValue: '회원가입 완료!' })}
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
              {t('player.register.successMessage', { defaultValue: '회원가입이 성공적으로 완료되었습니다. 이제 로그인하여 대회에 참가하세요!' })}
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/player/login')}
              sx={{ 
                mt: 2,
                py: 1.5,
              }}
            >
              {t('player.register.loginButton', { defaultValue: '로그인하러 가기' })}
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${miiracerTheme.background.primary} 0%, ${miiracerTheme.background.secondary} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      py: 4,
    }}>
      <Container maxWidth="md">
        <Paper 
          elevation={0} 
          sx={{ 
            width: '100%',
            borderRadius: 3,
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(255,255,255,0.95)',
            p: 4,
          }}
        >
          {/* 헤더 */}
          <Box sx={{ textAlign: 'center', mb: 4, position: 'relative' }}>
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
              Miiracer 선수 회원가입
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
              {t('player.register.subtitle', { defaultValue: '대회 참가를 위한 선수 등록을 해주세요' })}
            </Typography>
            
            {/* 언어 선택기 */}
            <Box sx={{ position: 'absolute', top: 0, right: 0 }}>
              <LanguageSelector />
            </Box>
          </Box>

          {/* 에러 메시지 */}
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
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
                      label={t('player.register.district')}
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
                        : <MenuItem value="general">{t('player.register.districtGeneral', { defaultValue: '일반' })}</MenuItem>
                      }
                    </TextField>
                    {!formData.province && (
                      <FormHelperText>{t('player.register.selectProvince', { defaultValue: '먼저 지역을 선택하세요' })}</FormHelperText>
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
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    placeholder={t('player.register.confirmPasswordPlaceholder')}
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
                    mt: 2
                  }}
                >
                  {isLoading ? t('player.register.registering', { defaultValue: '등록 중...' }) : t('player.register.register', { defaultValue: '회원가입' })}
                </Button>
              </Stack>
            </form>


            {/* 로그인 링크 */}
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" gutterBottom color="text.secondary">
                {t('player.register.alreadyHaveAccount', { defaultValue: '이미 계정이 있으신가요?' })}
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
                {t('player.register.loginLink', { defaultValue: '로그인하기' })}
              </Link>
            </Box>
            
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Powered by Miiracer Team
              </Typography>
            </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default PlayerRegister;