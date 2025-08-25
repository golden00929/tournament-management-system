import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  TablePagination,
  Checkbox,
} from '@mui/material';
import { 
  Add as AddIcon, 
  Person, 
  Search, 
  MoreVert,
  Edit,
  Delete,
  Visibility,
  Settings,
  FileDownload,
} from '@mui/icons-material';
import { useGetPlayersQuery, useDeletePlayerMutation, useAdjustPlayerRatingMutation } from '../../store/api/apiSlice';

const getSkillLevelColor = (skillLevel: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  switch (skillLevel) {
    case 'd_class':
    case 'beginner': return 'success';
    case 'c_class':
    case 'intermediate': return 'primary';
    case 'b_class':
    case 'advanced': return 'warning';
    case 'a_class':
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
    case 'beginner': return 'Group D (Beginner)';
    case 'intermediate': return 'Group C (Intermediate)';
    case 'advanced': return 'Group B (Advanced)';
    case 'expert': return 'Group A (Expert)';
    default: return skillLevel;
  }
};

const PlayerList: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [skillLevelFilter, setSkillLevelFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedPlayerData, setSelectedPlayerData] = useState<any>(null);
  const [newRating, setNewRating] = useState<string>('');
  const [reason, setReason] = useState('manual_adjustment');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

  const { data, isLoading, error } = useGetPlayersQuery({ limit: 500 });
  const [deletePlayer, { isLoading: isDeleting }] = useDeletePlayerMutation();
  const [adjustPlayerRating, { isLoading: isAdjusting }] = useAdjustPlayerRatingMutation();
  
  // CSV export function
  const handleExportCSV = async () => {
    try {
      const params = {
        ...(search && { search }),
        ...(skillLevelFilter && { skillLevel: skillLevelFilter })
      };
      
      const baseUrl = process.env.REACT_APP_API_URL || 
                       (process.env.NODE_ENV === 'production' 
                         ? 'https://tournament-management-system-production.up.railway.app/api'
                         : 'http://localhost:5000/api');
      
      const token = localStorage.getItem('token');
      const queryString = new URLSearchParams(params).toString();
      const url = `${baseUrl}/players/export/csv${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to export');
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      const timestamp = new Date().toISOString().slice(0, 10);
      link.download = `players_${timestamp}.csv`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('CSV 내보내기에 실패했습니다.');
    }
  };

  // Multi-select handlers
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const allPlayerIds = players.map((player: any) => player.id);
      setSelectedPlayers(allPlayerIds);
    } else {
      setSelectedPlayers([]);
    }
  };

  const handleSelectPlayer = (playerId: string) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, playerId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedPlayerId(playerId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPlayerId(null);
  };

  const handleView = () => {
    if (selectedPlayerId) {
      navigate(`/players/${selectedPlayerId}`);
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    if (selectedPlayerId) {
      navigate(`/players/${selectedPlayerId}/edit`);
    }
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (selectedPlayerId && window.confirm('정말로 이 선수를 삭제하시겠습니까?')) {
      try {
        await deletePlayer(selectedPlayerId).unwrap();
      } catch (err) {
        console.error('Failed to delete player:', err);
      }
    }
    handleMenuClose();
  };

  const handleAdjustRating = (player: any) => {
    setSelectedPlayerData(player);
    setNewRating(String(player.eloRating || 1200));
    setRatingDialogOpen(true);
  };

  const handleRatingSubmit = async () => {
    const ratingNumber = parseInt(newRating);
    if (!ratingNumber || ratingNumber < 100 || ratingNumber > 4000) {
      alert('ELO 레이팅은 100~4000 사이의 값이어야 합니다.');
      return;
    }

    try {
      await adjustPlayerRating({
        id: selectedPlayerData.id,
        newRating: ratingNumber,
        reason,
      }).unwrap();
      setRatingDialogOpen(false);
      setNewRating('');
      setReason('manual_adjustment');
      setSelectedPlayerData(null);
    } catch (err: any) {
      alert(err.data?.message || 'ELO 레이팅 조정 중 오류가 발생했습니다.');
    }
  };

  const handleRatingCancel = () => {
    setRatingDialogOpen(false);
    setNewRating('');
    setReason('manual_adjustment');
    setSelectedPlayerData(null);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        선수 목록을 불러올 수 없습니다.
      </Alert>
    );
  }

  const allPlayers = data?.data?.players || [];
  
  // 필터링 로직
  const filteredPlayers = allPlayers.filter((player: any) => {
    const matchesSearch = !search || 
      player.name.toLowerCase().includes(search.toLowerCase()) ||
      player.email.toLowerCase().includes(search.toLowerCase());
    
    const matchesSkillLevel = !skillLevelFilter || player.skillLevel === skillLevelFilter;
    
    return matchesSearch && matchesSkillLevel;
  });
  
  // Pagination 로직
  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const players = filteredPlayers.slice(startIndex, endIndex);
  
  const isAllSelected = players.length > 0 && selectedPlayers.length === players.length;
  const isIndeterminate = selectedPlayers.length > 0 && selectedPlayers.length < players.length;
  
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">선수 관리</Typography>
          {selectedPlayers.length > 0 && (
            <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
              {selectedPlayers.length}명 선택됨
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {selectedPlayers.length > 0 && (
            <Button 
              variant="outlined" 
              color="error"
              onClick={() => {
                if (window.confirm(`선택한 ${selectedPlayers.length}명의 선수를 삭제하시겠습니까?`)) {
                  // TODO: Implement bulk delete
                  console.log('Bulk delete:', selectedPlayers);
                  setSelectedPlayers([]);
                }
              }}
            >
              선택 삭제
            </Button>
          )}
          <Button 
            variant="outlined" 
            startIcon={<FileDownload />}
            onClick={handleExportCSV}
          >
            CSV 내보내기
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => navigate('/players/create')}
          >
            선수 등록
          </Button>
        </Box>
      </Box>

      {/* 검색 및 필터 */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="선수명 또는 이메일로 검색..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0); // 검색 시 첫 페이지로 이동
            }}
            size="small"
            sx={{ minWidth: 300, flexGrow: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>실력 수준</InputLabel>
            <Select
              value={skillLevelFilter}
              onChange={(e) => {
                setSkillLevelFilter(e.target.value);
                setPage(0); // 필터 변경 시 첫 페이지로 이동
              }}
              label="실력 수준"
            >
              <MenuItem value="">전체</MenuItem>
              <MenuItem value="a_class">Group A (Expert)</MenuItem>
              <MenuItem value="b_class">Group B (Advanced)</MenuItem>
              <MenuItem value="c_class">Group C (Intermediate)</MenuItem>
              <MenuItem value="d_class">Group D (Beginner)</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            총 {allPlayers.length}명 중 {filteredPlayers.length}명 표시 
            ({startIndex + 1}-{Math.min(endIndex, filteredPlayers.length)}번째)
          </Typography>
          
          {(search || skillLevelFilter) && (
            <Button
              size="small"
              onClick={() => {
                setSearch('');
                setSkillLevelFilter('');
                setPage(0);
              }}
            >
              필터 초기화
            </Button>
          )}
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={isIndeterminate}
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  disabled={players.length === 0}
                />
              </TableCell>
              <TableCell>선수</TableCell>
              <TableCell>연락처</TableCell>
              <TableCell align="center">ELO 레이팅</TableCell>
              <TableCell align="center">실력 수준</TableCell>
              <TableCell align="center">경기 수</TableCell>
              <TableCell align="center">승률</TableCell>
              <TableCell align="center">지역</TableCell>
              <TableCell align="center">작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {players.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    {search || skillLevelFilter ? '조건에 맞는 선수가 없습니다.' : '등록된 선수가 없습니다.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              players.map((player: any) => (
                <TableRow key={player.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedPlayers.includes(player.id)}
                      onChange={() => handleSelectPlayer(player.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar>
                        <Person />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1">{player.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {player.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{player.phone || '-'}</TableCell>
                  <TableCell align="center">
                    <Typography variant="h6" color="primary">
                      {player.eloRating || 1200}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <Chip
                        label={getSkillLevelText(player.skillLevel || 'd_class')}
                        color={getSkillLevelColor(player.skillLevel || 'd_class')}
                        size="small"
                      />
                      <Tooltip title="ELO 레이팅 조정">
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdjustRating(player);
                          }}
                          sx={{ ml: 0.5 }}
                        >
                          <Settings fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell align="center">{player.totalMatches || 0}</TableCell>
                  <TableCell align="center">
                    {(player.totalMatches || 0) > 0 
                      ? `${Math.round(((player.wins || 0) / (player.totalMatches || 1)) * 100)}%`
                      : '-'}
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">
                      {player.province || '-'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {player.district || ''}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton 
                      onClick={(e) => handleMenuClick(e, player.id)}
                      disabled={isDeleting}
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredPlayers.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelRowsPerPage="페이지당 선수 수:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} / 총 ${count !== -1 ? count : `${to}명 이상`}명`
          }
        />
      </TableContainer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleView}>
          <Visibility sx={{ mr: 1 }} /> 상세보기
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <Edit sx={{ mr: 1 }} /> 수정
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} /> 삭제
        </MenuItem>
      </Menu>

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
            {selectedPlayerData && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6">{selectedPlayerData.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  현재 레이팅: {selectedPlayerData.eloRating || 1200}
                </Typography>
              </Box>
            )}
            
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

export default PlayerList;