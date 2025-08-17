import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  MoreVert,
  Person,
  Email,
  Phone,
  CalendarToday,
  LocationOn,
  ContactEmergency,
  TrendingUp,
  Settings,
} from '@mui/icons-material';
import { useGetPlayerQuery, useDeletePlayerMutation, useAdjustPlayerRatingMutation } from '../../store/api/apiSlice';
import { formatDate, calculateAge } from '../../utils/dateUtils';

const PlayerDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [ratingDialogOpen, setRatingDialogOpen] = React.useState(false);
  const [newRating, setNewRating] = React.useState<string>('');
  const [reason, setReason] = React.useState('manual_adjustment');

  const { data: playerData, isLoading, error } = useGetPlayerQuery(id!);
  const [deletePlayer, { isLoading: isDeleting }] = useDeletePlayerMutation();
  const [adjustPlayerRating, { isLoading: isAdjusting }] = useAdjustPlayerRatingMutation();

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    navigate(`/players/${id}/edit`);
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (window.confirm('정말로 이 선수를 삭제하시겠습니까?')) {
      try {
        await deletePlayer(id!).unwrap();
        navigate('/players');
      } catch (err) {
        console.error('Failed to delete player:', err);
      }
    }
    handleMenuClose();
  };

  const handleAdjustRating = () => {
    if (playerData?.data) {
      setNewRating(String(playerData.data.eloRating || 1200));
    }
    setRatingDialogOpen(true);
    handleMenuClose();
  };

  const handleRatingSubmit = async () => {
    const ratingNumber = parseInt(newRating);
    if (!ratingNumber || ratingNumber < 100 || ratingNumber > 4000) {
      alert('ELO 레이팅은 100~4000 사이의 값이어야 합니다.');
      return;
    }

    try {
      await adjustPlayerRating({
        id: id!,
        newRating: ratingNumber,
        reason,
      }).unwrap();
      setRatingDialogOpen(false);
      setNewRating('');
      setReason('manual_adjustment');
    } catch (err: any) {
      alert(err.data?.message || 'ELO 레이팅 조정 중 오류가 발생했습니다.');
    }
  };

  const handleRatingCancel = () => {
    setRatingDialogOpen(false);
    setNewRating('');
    setReason('manual_adjustment');
  };

  const getSkillLevelColor = (skillLevel: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (skillLevel) {
      case 'd_class': return 'success';
      case 'c_class': return 'primary';
      case 'b_class': return 'warning';
      case 'a_class': return 'error';
      case 'beginner': return 'success'; // 기존 데이터 호환성
      case 'intermediate': return 'primary';
      case 'advanced': return 'warning';
      case 'expert': return 'error';
      default: return 'default';
    }
  };

  const getSkillLevelText = (skillLevel: string) => {
    switch (skillLevel) {
      case 'd_class': return 'Group D (Beginner)';
      case 'c_class': return 'Group C (Intermediate)';
      case 'b_class': return 'Group B (Advanced)';
      case 'a_class': return 'Group A (Expert)';
      case 'beginner': return 'Group D (Beginner)'; // 기존 데이터 호환성
      case 'intermediate': return 'Group C (Intermediate)';
      case 'advanced': return 'Group B (Advanced)';
      case 'expert': return 'Group A (Expert)';
      default: return skillLevel;
    }
  };


  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !playerData?.data) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/players')}
          sx={{ mb: 2 }}
        >
          뒤로
        </Button>
        <Alert severity="error">
          선수 정보를 불러올 수 없습니다.
        </Alert>
      </Box>
    );
  }

  const player = playerData.data;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/players')}
            sx={{ mr: 2 }}
          >
            뒤로
          </Button>
          <Typography variant="h4">
            선수 상세 정보
          </Typography>
        </Box>
        
        <IconButton onClick={handleMenuClick} disabled={isDeleting}>
          <MoreVert />
        </IconButton>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleEdit}>
            <Edit sx={{ mr: 1 }} /> 수정
          </MenuItem>
          <MenuItem onClick={handleAdjustRating}>
            <Settings sx={{ mr: 1 }} /> ELO 레이팅 조정
          </MenuItem>
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <Delete sx={{ mr: 1 }} /> 삭제
          </MenuItem>
        </Menu>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
        {/* 기본 정보 */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar sx={{ width: 80, height: 80, mr: 3 }}>
                <Person sx={{ fontSize: 40 }} />
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ mb: 1 }}>
                  {player.name}
                </Typography>
                <Chip
                  label={getSkillLevelText(player.skillLevel || 'd_class')}
                  color={getSkillLevelColor(player.skillLevel || 'd_class')}
                  size="small"
                  sx={{ mr: 1 }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  ELO 레이팅: <strong>{player.eloRating || 1200}</strong>
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Email sx={{ fontSize: 20, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  이메일: {player.email}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Phone sx={{ fontSize: 20, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  전화번호: {player.phone || '-'}
                </Typography>
              </Box>

              {player.birthDate && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarToday sx={{ fontSize: 20, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    생년월일: {formatDate(player.birthDate)} 
                    ({calculateAge(player.birthDate)}세)
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn sx={{ fontSize: 20, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  주소: {player.province} {player.district}
                </Typography>
              </Box>

              {player.address && (
                <Typography variant="body2" color="text.secondary" sx={{ ml: 3 }}>
                  {player.address}
                </Typography>
              )}

              {player.emergencyContact && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <ContactEmergency /> 비상 연락처
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      이름: {player.emergencyContact}
                    </Typography>
                  </Box>

                  {player.emergencyPhone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Phone sx={{ fontSize: 20, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        전화번호: {player.emergencyPhone}
                      </Typography>
                    </Box>
                  )}
                </>
              )}
            </Box>

            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                onClick={handleEdit}
                startIcon={<Edit />}
                fullWidth
              >
                선수 정보 수정
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* 경기 통계 */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp /> 경기 통계
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="primary" sx={{ mb: 1 }}>
                  {player.eloRating || 1200}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  현재 ELO 레이팅
                </Typography>
              </Box>

              <Divider />

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, textAlign: 'center' }}>
                <Box>
                  <Typography variant="h5" color="success.main">
                    {player.wins || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    승
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="h5" color="error.main">
                    {(player.totalMatches || 0) - (player.wins || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    패
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5">
                  {player.totalMatches || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  총 경기 수
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" color="info.main">
                  {(player.totalMatches || 0) > 0 
                    ? `${Math.round(((player.wins || 0) / (player.totalMatches || 1)) * 100)}%`
                    : '-'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  승률
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  등록일
                </Typography>
                <Typography variant="body2">
                  {formatDate(player.createdAt)}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  최종 수정일
                </Typography>
                <Typography variant="body2">
                  {formatDate(player.updatedAt)}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* ELO 레이팅 조정 다이얼로그 */}
      <Dialog
        open={ratingDialogOpen}
        onClose={handleRatingCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>ELO 레이팅 조정</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              label="새로운 ELO 레이팅"
              type="number"
              value={newRating}
              onChange={(e) => setNewRating(e.target.value)}
              fullWidth
              required
              inputProps={{ min: 100, max: 4000 }}
              helperText="100~4000 사이의 값을 입력하세요"
              sx={{ mb: 2 }}
            />
            
            <TextField
              select
              label="조정 사유"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
            >
              <MenuItem value="manual_adjustment">수동 조정</MenuItem>
              <MenuItem value="system_correction">시스템 보정</MenuItem>
              <MenuItem value="initial_rating">초기 레이팅 설정</MenuItem>
              <MenuItem value="tournament_result">대회 결과 반영</MenuItem>
            </TextField>

            <Alert severity="warning" sx={{ mt: 2 }}>
              ELO 레이팅을 조정하면 선수의 실력 등급이 자동으로 변경됩니다. 
              이 작업은 되돌릴 수 없으니 신중하게 결정해 주세요.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRatingCancel}>취소</Button>
          <Button 
            onClick={handleRatingSubmit}
            variant="contained"
            disabled={isAdjusting}
          >
            {isAdjusting ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            조정하기
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlayerDetail;