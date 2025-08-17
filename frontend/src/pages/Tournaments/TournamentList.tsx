import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  CalendarToday,
  LocationOn,
  People,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useGetTournamentsQuery, useDeleteTournamentMutation, useUpdateTournamentStatusMutation } from '../../store/api/apiSlice';
import { formatDate, formatCurrency } from '../../utils/dateUtils';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft': return 'default';
    case 'open': return 'success';
    case 'closed': return 'error';
    case 'ongoing': return 'warning';
    case 'completed': return 'info';
    default: return 'default';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'draft': return '작성 중';
    case 'open': return '모집 중';
    case 'closed': return '모집 마감';
    case 'ongoing': return '진행 중';
    case 'completed': return '완료';
    default: return status;
  }
};

const TournamentList: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetTournamentsQuery({});
  const [deleteTournament, { isLoading: isDeleting }] = useDeleteTournamentMutation();
  const [updateTournamentStatus] = useUpdateTournamentStatusMutation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedTournament, setSelectedTournament] = React.useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, tournamentId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedTournament(tournamentId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTournament(null);
  };

  const handleDeleteClick = () => {
    setDeleteDialog(true);
    setAnchorEl(null); // 메뉴만 닫고 selectedTournament는 유지
  };

  const handleDeleteCancel = () => {
    setDeleteDialog(false);
    setDeleteError(null);
    setSelectedTournament(null); // 취소할 때만 selectedTournament 초기화
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTournament) return;

    try {
      await deleteTournament(selectedTournament).unwrap();
      setDeleteDialog(false);
      setDeleteError(null);
      setSelectedTournament(null);
    } catch (err: any) {
      console.error('Delete tournament error:', err);
      setDeleteError(err.data?.message || '대회 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!selectedTournament) return;

    try {
      await updateTournamentStatus({ id: selectedTournament, status }).unwrap();
      setAnchorEl(null);
      setSelectedTournament(null);
    } catch (err: any) {
      console.error('Update tournament status error:', err);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading tournaments</div>;

  const tournaments = data?.data?.tournaments || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">대회 관리</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/tournaments/create')}
        >
          대회 생성
        </Button>
      </Box>

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, 
        gap: 3 
      }}>
        {tournaments.map((tournament: any) => (
          <Card key={tournament.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                  {tournament.name}
                </Typography>
                <IconButton
                  size="small"
                  onClick={(e) => handleMenuClick(e, tournament.id)}
                >
                  <MoreVertIcon />
                </IconButton>
              </Box>

              <Chip
                label={getStatusText(tournament.status)}
                color={getStatusColor(tournament.status)}
                size="small"
                sx={{ mb: 2 }}
              />

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {tournament.description}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CalendarToday sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {formatDate(tournament.startDate)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {tournament.location}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <People sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  최대 {tournament.maxParticipants}명
                </Typography>
              </Box>

              <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                참가비: {formatCurrency(tournament.participantFee)}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          navigate(`/tournaments/${selectedTournament}`);
          handleMenuClose();
        }}>
          상세보기
        </MenuItem>
        <MenuItem onClick={() => {
          navigate(`/tournaments/${selectedTournament}/edit`);
          handleMenuClose();
        }}>
          수정
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('draft')}>
          📝 작성 중으로 변경
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('open')}>
          🟢 모집 중으로 변경
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('closed')}>
          🔴 모집 마감으로 변경
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('ongoing')}>
          🟡 진행 중으로 변경
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('completed')}>
          🔵 완료로 변경
        </MenuItem>
        <MenuItem 
          onClick={handleDeleteClick}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1, fontSize: 16 }} />
          삭제
        </MenuItem>
      </Menu>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog
        open={deleteDialog}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>대회 삭제 확인</DialogTitle>
        <DialogContent>
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {deleteError}
            </Alert>
          )}
          <Typography>
            정말로 이 대회를 삭제하시겠습니까?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            삭제된 대회는 복구할 수 없으며, 관련된 모든 데이터가 함께 삭제됩니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>
            취소
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting ? '삭제 중...' : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TournamentList;