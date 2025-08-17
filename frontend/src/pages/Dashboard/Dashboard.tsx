import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
} from '@mui/material';
import {
  EmojiEvents,
  People,
  SportsTennis,
  TrendingUp,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock data for demonstration
const mockData = {
  totalTournaments: 5,
  totalPlayers: 120,
  activeMatches: 8,
  avgRating: 1650,
  monthlyTournaments: [
    { month: '8월', count: 2 },
    { month: '9월', count: 3 },
    { month: '10월', count: 4 },
    { month: '11월', count: 1 },
  ]
};

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
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        대시보드
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        대회 관리 현황을 한눈에 확인하세요
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
          value={mockData.totalTournaments}
          icon={<EmojiEvents />}
          color="#1976d2"
        />
        <StatCard
          title="등록 선수 수"
          value={mockData.totalPlayers}
          icon={<People />}
          color="#2e7d32"
        />
        <StatCard
          title="진행 중인 경기"
          value={mockData.activeMatches}
          icon={<SportsTennis />}
          color="#ed6c02"
        />
        <StatCard
          title="평균 레이팅"
          value={mockData.avgRating}
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
            월별 대회 개최 현황
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockData.monthlyTournaments}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#1976d2" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>

        <Paper sx={{ p: 3, height: 'fit-content' }}>
          <Typography variant="h6" gutterBottom>
            최근 활동
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              • 새로운 선수 3명 등록
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              • "즉시 테스트 대회" 진행 중
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              • 김철수 선수 레이팅 1814점으로 상승
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              • 대진표 1개 생성 완료
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Dashboard;