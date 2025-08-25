import express from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  try {
    // Get total tournaments count
    const totalTournaments = await prisma.tournament.count();

    // Get total players count
    const totalPlayers = await prisma.player.count();

    // Get active matches count (tournaments with status 'active' or 'ongoing')
    const activeMatches = await prisma.tournament.count({
      where: {
        OR: [
          { status: 'active' },
          { status: 'ongoing' },
          { status: 'in_progress' }
        ]
      }
    });

    // Get average rating (where eloRating is greater than 0)
    const ratingStats = await prisma.player.aggregate({
      _avg: {
        eloRating: true
      },
      where: {
        eloRating: {
          gt: 0
        }
      }
    });

    const avgRating = ratingStats._avg.eloRating ? Math.round(ratingStats._avg.eloRating) : 1500;

    // Get monthly tournament data for the last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyTournaments = await prisma.tournament.groupBy({
      by: ['startDate'],
      where: {
        startDate: {
          gte: twelveMonthsAgo
        }
      },
      _count: {
        id: true
      }
    });

    // Process monthly data
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = `${date.getMonth() + 1}월`;
      
      const count = monthlyTournaments.filter(t => {
        const tournamentDate = new Date(t.startDate);
        const tournamentMonthKey = `${tournamentDate.getFullYear()}-${String(tournamentDate.getMonth() + 1).padStart(2, '0')}`;
        return tournamentMonthKey === monthKey;
      }).reduce((acc, curr) => acc + curr._count.id, 0);

      monthlyData.push({
        month: monthName,
        count: count
      });
    }

    // Get recent activities
    const recentTournaments = await prisma.tournament.findMany({
      take: 3,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true
      }
    });

    const recentPlayers = await prisma.player.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        createdAt: true
      }
    });

    // Get top rated players
    const topPlayers = await prisma.player.findMany({
      take: 3,
      where: {
        eloRating: {
          gt: 0
        }
      },
      orderBy: {
        eloRating: 'desc'
      },
      select: {
        id: true,
        name: true,
        eloRating: true
      }
    });

    const recentActivities = [];
    
    // Add recent player registrations
    recentPlayers.slice(0, 3).forEach(player => {
      recentActivities.push(`새로운 선수 "${player.name}" 등록`);
    });

    // Add recent tournaments
    recentTournaments.forEach(tournament => {
      if (tournament.status === 'active' || tournament.status === 'ongoing') {
        recentActivities.push(`"${tournament.name}" 진행 중`);
      } else if (tournament.status === 'completed') {
        recentActivities.push(`"${tournament.name}" 완료`);
      }
    });

    // Add top player info
    if (topPlayers.length > 0) {
      recentActivities.push(`최고 레이팅: ${topPlayers[0].name} (${topPlayers[0].eloRating}점)`);
    }

    res.json({
      success: true,
      data: {
        totalTournaments,
        totalPlayers,
        activeMatches,
        avgRating,
        monthlyTournaments: monthlyData,
        recentActivities: recentActivities.slice(0, 4) // Limit to 4 activities
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: '대시보드 통계를 가져오는데 실패했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Get detailed tournament statistics
router.get('/tournament-stats', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  try {
    const tournamentsByStatus = await prisma.tournament.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    const tournamentsByCategory = await prisma.tournament.groupBy({
      by: ['category'],
      _count: {
        id: true
      }
    });

    res.json({
      success: true,
      data: {
        byStatus: tournamentsByStatus,
        byCategory: tournamentsByCategory
      }
    });

  } catch (error) {
    console.error('Tournament stats error:', error);
    res.status(500).json({
      success: false,
      message: '토너먼트 통계를 가져오는데 실패했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

export default router;