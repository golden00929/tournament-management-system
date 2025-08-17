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
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { useCreatePlayerMutation, useUpdatePlayerMutation, useGetPlayerQuery } from '../../store/api/apiSlice';
import CustomDatePicker from '../../components/DatePicker/CustomDatePicker';

interface PlayerFormData {
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other';
  skillLevel: 'd_class' | 'c_class' | 'b_class' | 'a_class';
  province: string;
  district: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
}

const initialFormData: PlayerFormData = {
  name: '',
  email: '',
  phone: '',
  birthDate: '',
  gender: 'male',
  skillLevel: 'd_class',
  province: '',
  district: '',
  address: '',
  emergencyContact: '',
  emergencyPhone: '',
};

const PlayerForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<PlayerFormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);

  // Debug: Log formData changes
  React.useEffect(() => {
    console.log('Current formData state:', formData);
  }, [formData]);

  const { data: playerData, isLoading: isLoadingPlayer } = useGetPlayerQuery(
    id!,
    { skip: !isEdit }
  );

  const [createPlayer, { isLoading: isCreating }] = useCreatePlayerMutation();
  const [updatePlayer, { isLoading: isUpdating }] = useUpdatePlayerMutation();

  React.useEffect(() => {
    if (isEdit && playerData?.data) {
      const player = playerData.data;
      console.log('=== PLAYER DATA DEBUG ===');
      console.log('Raw player data:', player);
      console.log('Player.skillLevel value:', player.skillLevel);
      console.log('Player.birthYear value:', player.birthYear);
      console.log('Player.address value:', player.address);
      console.log('Player.emergencyContact value:', player.emergencyContact);
      console.log('Player.emergencyPhone value:', player.emergencyPhone);
      
      // Simple skill level mapping
      let skillLevel: 'd_class' | 'c_class' | 'b_class' | 'a_class' = 'd_class';
      if (player.skillLevel) {
        switch (player.skillLevel) {
          case 'beginner':
          case 'd_class':
            skillLevel = 'd_class';
            break;
          case 'intermediate':
          case 'c_class':
            skillLevel = 'c_class';
            break;
          case 'advanced':
          case 'b_class':
            skillLevel = 'b_class';
            break;
          case 'expert':
          case 'a_class':
            skillLevel = 'a_class';
            break;
          default:
            skillLevel = 'd_class';
        }
      }

      // Birth date handling - prefer birthDate over birthYear
      let birthDate = '';
      if (player.birthDate) {
        // Use actual birth date if available
        const date = new Date(player.birthDate);
        birthDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      } else if (player.birthYear && typeof player.birthYear === 'number') {
        // Fallback to birthYear + January 1st
        birthDate = `${player.birthYear}-01-01`;
      }

      // Create form data with explicit values
      const formDataToSet = {
        name: String(player.name || ''),
        email: String(player.email || ''),
        phone: String(player.phone || ''),
        birthDate: birthDate,
        gender: (player.gender === 'male' || player.gender === 'female' || player.gender === 'other') 
          ? player.gender as 'male' | 'female' | 'other' 
          : 'male',
        skillLevel: skillLevel,
        province: String(player.province || ''),
        district: String(player.district || ''),
        address: String(player.address || ''),
        emergencyContact: String(player.emergencyContact || ''),
        emergencyPhone: String(player.emergencyPhone || ''),
      };
      
      console.log('Form data to set:', formDataToSet);
      console.log('Setting formData now...');
      setFormData(formDataToSet);
      console.log('FormData has been set');
    }
  }, [isEdit, playerData]);

  const handleChange = (field: keyof PlayerFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      const submitData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        birthYear: formData.birthDate ? new Date(formData.birthDate).getFullYear() : undefined,
        birthDate: formData.birthDate || null,
        gender: formData.gender,
        skillLevel: formData.skillLevel,
        province: formData.province,
        district: formData.district,
        address: formData.address,
        emergencyContact: formData.emergencyContact,
        emergencyPhone: formData.emergencyPhone,
      };

      console.log('=== SUBMIT DATA DEBUG ===');
      console.log('FormData before submit:', formData);
      console.log('SubmitData to API:', submitData);

      if (isEdit) {
        console.log('Calling updatePlayer with:', { id: id!, ...submitData });
        await updatePlayer({ id: id!, ...submitData }).unwrap();
      } else {
        console.log('Calling createPlayer with:', submitData);
        await createPlayer(submitData).unwrap();
      }

      navigate('/players');
    } catch (err: any) {
      setError(err.data?.message || '선수 정보 저장 중 오류가 발생했습니다.');
    }
  };

  const skillLevels = [
    { value: 'd_class', label: 'Group D (Beginner)' },
    { value: 'c_class', label: 'Group C (Intermediate)' },
    { value: 'b_class', label: 'Group B (Advanced)' },
    { value: 'a_class', label: 'Group A (Expert)' },
  ];

  const provinces = [
    'Hà Nội', 'Hồ Chí Minh', 'Hải Phòng', 'Đà Nẵng', 'Cần Thơ',
    'An Giang', 'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu',
    'Bắc Ninh', 'Bến Tre', 'Bình Định', 'Bình Dương', 'Bình Phước',
    'Bình Thuận', 'Cà Mau', 'Cao Bằng', 'Đắk Lắk', 'Đắk Nông',
    'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang',
    'Hà Nam', 'Hà Tĩnh', 'Hải Dương', 'Hậu Giang', 'Hòa Bình',
    'Hưng Yên', 'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu',
    'Lâm Đồng', 'Lạng Sơn', 'Lào Cai', 'Long An', 'Nam Định',
    'Nghệ An', 'Ninh Bình', 'Ninh Thuận', 'Phú Thọ', 'Phú Yên',
    'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị',
    'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên',
    'Thanh Hóa', 'Thừa Thiên Huế', 'Tiền Giang', 'Trà Vinh', 'Tuyên Quang',
    'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái'
  ];

  if (isEdit && isLoadingPlayer) {
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
          onClick={() => navigate('/players')}
          sx={{ mr: 2 }}
        >
          뒤로
        </Button>
        <Typography variant="h4">
          {isEdit ? '선수 정보 수정' : '새 선수 등록'}
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

            {/* 기본 정보 */}
            <Typography variant="h6" sx={{ mt: 1, mb: 2 }}>
              기본 정보
            </Typography>
            
            <TextField
              label="이름"
              value={formData.name}
              onChange={handleChange('name')}
              required
              fullWidth
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="이메일"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                required
                fullWidth
              />

              <TextField
                label="전화번호"
                value={formData.phone}
                onChange={handleChange('phone')}
                required
                fullWidth
                placeholder="010-1234-5678"
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="생년월일"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                required
                fullWidth
                helperText="생년월일을 선택하세요"
                InputLabelProps={{
                  shrink: true,
                }}
              />

              <TextField
                select
                label="성별"
                value={formData.gender}
                onChange={handleChange('gender')}
                required
              >
                <MenuItem value="male">남성</MenuItem>
                <MenuItem value="female">여성</MenuItem>
                <MenuItem value="other">기타</MenuItem>
              </TextField>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <TextField
                select
                label="실력 수준"
                value={formData.skillLevel || 'd_class'}
                onChange={handleChange('skillLevel')}
                required
                helperText={`현재 값: ${formData.skillLevel}`}
              >
                {skillLevels.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {/* 주소 정보 */}
            <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
              주소 정보
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <TextField
                select
                label="시/도"
                value={formData.province}
                onChange={handleChange('province')}
                required
              >
                {provinces.map((province) => (
                  <MenuItem key={province} value={province}>
                    {province}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="시/군/구"
                value={formData.district}
                onChange={handleChange('district')}
                required
                fullWidth
              />
            </Box>

            <TextField
              label="상세주소"
              value={formData.address}
              onChange={handleChange('address')}
              fullWidth
              multiline
              rows={2}
            />

            {/* 비상 연락처 */}
            <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
              비상 연락처
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="비상연락처 이름"
                value={formData.emergencyContact}
                onChange={handleChange('emergencyContact')}
                fullWidth
                placeholder="가족, 친구 등"
              />

              <TextField
                label="비상연락처 전화번호"
                value={formData.emergencyPhone}
                onChange={handleChange('emergencyPhone')}
                fullWidth
                placeholder="010-1234-5678"
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/players')}
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

export default PlayerForm;