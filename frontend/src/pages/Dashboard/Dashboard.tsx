import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  EmojiEvents,
  People,
  SportsTennis,
  TrendingUp,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useGetDashboardStatsQuery } from '../../store/api/apiSlice';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography color="textSecondary" gutterBottom variant="h6">
            {title}
          </Typography>
          <Typography variant="h3" component="div">
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: color,
            color: 'white',
            borderRadius: '50%',
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const { 
    data: dashboardStats, 
    isLoading, 
    error, 
    refetch 
  } = useGetDashboardStatsQuery();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mb: 4 }}>
        <Alert 
          severity="error" 
          action={
            <Box sx={{ mt: 1 }}>
              <Typography 
                variant="button" 
                sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => refetch()}
              >
                다시 시도
              </Typography>
            </Box>
          }
        >
          대시보드 데이터를 불러올 수 없습니다. 
          {error && typeof error === 'object' && 'data' in error 
            ? ` (${(error as any).data?.message || '알 수 없는 오류'})` 
            : ''}
        </Alert>
      </Box>
    );
  }

  const stats = dashboardStats?.data || {};
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        대시보드
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        대회 관리 현황을 한눈에 확인하세요 (실시간 데이터)
      </Typography>

      {/* Stats Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, 
        gap: 3, 
        mb: 3 
      }}>
        <StatCard
          title="총 대회 수"
          value={stats.totalTournaments || 0}
          icon={<EmojiEvents />}
          color="#1976d2"
        />
        <StatCard
          title="등록 선수 수"
          value={stats.totalPlayers || 0}
          icon={<People />}
          color="#2e7d32"
        />
        <StatCard
          title="진행 중인 경기"
          value={stats.activeMatches || 0}
          icon={<SportsTennis />}
          color="#ed6c02"
        />
        <StatCard
          title="평균 레이팅"
          value={stats.avgRating || 1500}
          icon={<TrendingUp />}
          color="#9c27b0"
        />
      </Box>

      {/* Charts */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, 
        gap: 3 
      }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            월별 대회 개최 현황 (최근 12개월)
          </Typography>
          {stats.monthlyTournaments && stats.monthlyTournaments.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.monthlyTournaments}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="text.secondary">
                월별 대회 데이터가 없습니다
              </Typography>
            </Box>
          )}
        </Paper>

        <Paper sx={{ p: 3, height: 'fit-content' }}>
          <Typography variant="h6" gutterBottom>
            최근 활동
          </Typography>
          <Box sx={{ mt: 2 }}>
            {stats.recentActivities && stats.recentActivities.length > 0 ? (
              stats.recentActivities.map((activity: string, index: number) => (
                <Typography key={index} variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  • {activity}
                </Typography>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                최근 활동 내역이 없습니다
              </Typography>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Dashboard;