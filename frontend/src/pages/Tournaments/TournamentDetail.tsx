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
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  MoreVert,
  CalendarToday,
  LocationOn,
  People,
  MonetizationOn,
  Category,
  EmojiEvents,
  SportsTennis,
} from '@mui/icons-material';
import { useGetTournamentQuery, useDeleteTournamentMutation } from '../../store/api/apiSlice';
import { formatDate, formatDateTime, formatCurrency } from '../../utils/dateUtils';

const TournamentDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const { data: tournamentData, isLoading, error } = useGetTournamentQuery(id!);
  const [deleteTournament, { isLoading: isDeleting }] = useDeleteTournamentMutation();

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    navigate(`/tournaments/${id}/edit`);
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (window.confirm('정말로 이 대회를 삭제하시겠습니까?')) {
      try {
        await deleteTournament(id!).unwrap();
        navigate('/tournaments');
      } catch (err) {
        console.error('Failed to delete tournament:', err);
      }
    }
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'open': return 'success';
      case 'ongoing': return 'warning';
      case 'completed': return 'info';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return '작성 중';
      case 'open': return '모집 중';
      case 'ongoing': return '진행 중';
      case 'completed': return '완료';
      default: return status;
    }
  };

  const getTournamentTypeText = (type: string) => {
    switch (type) {
      case 'single_elimination': return '단일 토너먼트';
      case 'double_elimination': return '더블 토너먼트';
      case 'round_robin': return '리그전';
      case 'swiss': return '스위스 시스템';
      default: return type;
    }
  };

  const getSkillLevelText = (level: string) => {
    switch (level) {
      case 'all': return '전체';
      case 'd_class': return 'Group D (Beginner)';
      case 'c_class': return 'Group C (Intermediate)';
      case 'b_class': return 'Group B (Advanced)';
      case 'a_class': return 'Group A (Expert)';
      case 'beginner': return 'Group D (Beginner)'; // 기존 데이터 호환성
      case 'intermediate': return 'Group C (Intermediate)';
      case 'advanced': return 'Group B (Advanced)';
      default: return level;
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !tournamentData?.data) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/tournaments')}
          sx={{ mb: 2 }}
        >
          뒤로
        </Button>
        <Alert severity="error">
          대회 정보를 불러올 수 없습니다.
        </Alert>
      </Box>
    );
  }

  const tournament = tournamentData.data;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/tournaments')}
            sx={{ mr: 2 }}
          >
            뒤로
          </Button>
          <Typography variant="h4">
            {tournament.name}
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
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <Delete sx={{ mr: 1 }} /> 삭제
          </MenuItem>
        </Menu>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
        {/* 기본 정보 */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmojiEvents /> 대회 정보
              </Typography>
              <Chip
                label={getStatusText(tournament.status)}
                color={getStatusColor(tournament.status)}
                size="small"
              />
            </Box>

            <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
              {tournament.description || '설명이 없습니다.'}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarToday sx={{ fontSize: 20, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  시작: {formatDate(tournament.startDate)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarToday sx={{ fontSize: 20, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  종료: {formatDate(tournament.endDate)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn sx={{ fontSize: 20, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  장소: {tournament.location}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <People sx={{ fontSize: 20, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  최대 참가자: {tournament.maxParticipants}명
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MonetizationOn sx={{ fontSize: 20, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  참가비: {formatCurrency(tournament.participantFee)}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* 대회 설정 */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Category /> 대회 설정
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  대회 형식
                </Typography>
                <Chip label={getTournamentTypeText(tournament.tournamentType)} size="small" />
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  실력 수준
                </Typography>
                <Chip label={getSkillLevelText(tournament.skillLevel)} size="small" />
              </Box>

              <Divider />

              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  생성일
                </Typography>
                <Typography variant="body2">
                  {formatDateTime(tournament.createdAt)}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  수정일
                </Typography>
                <Typography variant="body2">
                  {formatDateTime(tournament.updatedAt)}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleEdit}
                startIcon={<Edit />}
                fullWidth
              >
                대회 수정
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate(`/tournaments/${id}/bracket`)}
                startIcon={<SportsTennis />}
                fullWidth
              >
                대진표 보기
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default TournamentDetail;