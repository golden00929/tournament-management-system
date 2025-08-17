import express from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';

const router = express.Router();

// Get all teams for a tournament
router.get('/tournament/:tournamentId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { tournamentId } = req.params;

    const teams = await prisma.team.findMany({
      where: {
        participations: {
          some: {
            tournamentId: tournamentId
          }
        }
      },
      include: {
        player1: {
          select: {
            id: true,
            name: true,
            eloRating: true,
            skillLevel: true
          }
        },
        player2: {
          select: {
            id: true,
            name: true,
            eloRating: true,
            skillLevel: true
          }
        },
        participations: {
          where: {
            tournamentId: tournamentId
          },
          select: {
            id: true,
            approvalStatus: true,
            paymentStatus: true,
            registrationDate: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: { teams }
    });
  } catch (error) {
    console.error('Get tournament teams error:', error);
    res.status(500).json({
      success: false,
      message: '팀 목록 조회 중 오류가 발생했습니다.',
      error: 'GET_TEAMS_ERROR'
    });
  }
});

// Create a new team for doubles
router.post('/create', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { player1Id, player2Id, customName } = req.body;

    if (!player1Id || !player2Id) {
      return res.status(400).json({
        success: false,
        message: '두 명의 선수가 필요합니다.',
        error: 'MISSING_PLAYERS'
      });
    }

    if (player1Id === player2Id) {
      return res.status(400).json({
        success: false,
        message: '같은 선수로는 팀을 구성할 수 없습니다.',
        error: 'SAME_PLAYER'
      });
    }

    // Check if players exist
    const players = await prisma.player.findMany({
      where: {
        id: { in: [player1Id, player2Id] }
      }
    });

    if (players.length !== 2) {
      return res.status(404).json({
        success: false,
        message: '선수 정보를 찾을 수 없습니다.',
        error: 'PLAYERS_NOT_FOUND'
      });
    }

    // Check if team already exists (prevent duplicates regardless of order)
    const existingTeam = await prisma.team.findFirst({
      where: {
        OR: [
          { player1Id, player2Id },
          { player1Id: player2Id, player2Id: player1Id }
        ]
      }
    });

    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: '이미 존재하는 팀 조합입니다.',
        error: 'TEAM_ALREADY_EXISTS'
      });
    }

    // Calculate team rating (average of both players)
    const player1 = players.find(p => p.id === player1Id);
    const player2 = players.find(p => p.id === player2Id);
    const teamRating = Math.round((player1!.eloRating + player2!.eloRating) / 2);

    // Generate team name
    const teamName = customName || `${player1!.name}/${player2!.name}`;

    // Create team
    const team = await prisma.team.create({
      data: {
        name: teamName,
        player1Id,
        player2Id,
        teamRating
      },
      include: {
        player1: {
          select: {
            id: true,
            name: true,
            eloRating: true,
            skillLevel: true
          }
        },
        player2: {
          select: {
            id: true,
            name: true,
            eloRating: true,
            skillLevel: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: '팀이 성공적으로 생성되었습니다.',
      data: { team }
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({
      success: false,
      message: '팀 생성 중 오류가 발생했습니다.',
      error: 'CREATE_TEAM_ERROR'
    });
  }
});

// Add team to tournament (team participation)
router.post('/:teamId/join/:tournamentId', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { teamId, tournamentId } = req.params;

    // Check if team and tournament exist
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        player1: true,
        player2: true
      }
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: '팀을 찾을 수 없습니다.',
        error: 'TEAM_NOT_FOUND'
      });
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    });

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: '대회를 찾을 수 없습니다.',
        error: 'TOURNAMENT_NOT_FOUND'
      });
    }

    // Check if team already participating
    const existingParticipation = await prisma.participant.findFirst({
      where: {
        tournamentId,
        teamId,
        isActive: true
      }
    });

    if (existingParticipation) {
      return res.status(400).json({
        success: false,
        message: '이미 참가 중인 팀입니다.',
        error: 'TEAM_ALREADY_PARTICIPATING'
      });
    }

    // Create participation record for the team
    // We'll use player1 as the primary participant and reference the team
    const participation = await prisma.participant.create({
      data: {
        tournamentId,
        playerId: team.player1Id,
        partnerPlayerId: team.player2Id,
        teamId,
        eventType: 'doubles',
        registrationElo: team.teamRating,
        approvalStatus: 'approved', // Auto-approve admin-created teams
        paymentStatus: 'completed'
      },
      include: {
        player: true,
        partnerPlayer: true,
        team: {
          include: {
            player1: true,
            player2: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: '팀이 대회에 성공적으로 참가했습니다.',
      data: { participation }
    });
  } catch (error) {
    console.error('Team join tournament error:', error);
    res.status(500).json({
      success: false,
      message: '팀 참가 중 오류가 발생했습니다.',
      error: 'TEAM_JOIN_ERROR'
    });
  }
});

// Get available players for team creation
router.get('/available-players/:tournamentId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { tournamentId } = req.params;

    // Get players who are not already in a team for this tournament
    const availablePlayers = await prisma.player.findMany({
      where: {
        NOT: {
          participations: {
            some: {
              tournamentId,
              eventType: 'doubles',
              isActive: true
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        eloRating: true,
        skillLevel: true,
        email: true,
        phone: true
      },
      orderBy: { eloRating: 'desc' }
    });

    res.json({
      success: true,
      data: { players: availablePlayers }
    });
  } catch (error) {
    console.error('Get available players error:', error);
    res.status(500).json({
      success: false,
      message: '선수 목록 조회 중 오류가 발생했습니다.',
      error: 'GET_AVAILABLE_PLAYERS_ERROR'
    });
  }
});

// Generate suggested team pairings based on skill balance
router.get('/suggestions/:tournamentId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { tournamentId } = req.params;

    // Get available players
    const availablePlayers = await prisma.player.findMany({
      where: {
        NOT: {
          participations: {
            some: {
              tournamentId,
              eventType: 'doubles',
              isActive: true
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        eloRating: true,
        skillLevel: true
      },
      orderBy: { eloRating: 'desc' }
    });

    if (availablePlayers.length < 2) {
      return res.json({
        success: true,
        data: { suggestions: [] }
      });
    }

    // Generate balanced team suggestions
    const suggestions = [];
    const usedPlayers = new Set();

    // Strategy: Pair high-rated with low-rated players for balance
    const sortedPlayers = [...availablePlayers].sort((a, b) => b.eloRating - a.eloRating);
    
    for (let i = 0; i < Math.floor(sortedPlayers.length / 2); i++) {
      const strongPlayer = sortedPlayers[i];
      const weakPlayer = sortedPlayers[sortedPlayers.length - 1 - i];
      
      if (!usedPlayers.has(strongPlayer.id) && !usedPlayers.has(weakPlayer.id)) {
        const avgRating = Math.round((strongPlayer.eloRating + weakPlayer.eloRating) / 2);
        
        suggestions.push({
          player1: strongPlayer,
          player2: weakPlayer,
          avgRating,
          ratingDiff: Math.abs(strongPlayer.eloRating - weakPlayer.eloRating),
          suggestedName: `${strongPlayer.name}/${weakPlayer.name}`
        });
        
        usedPlayers.add(strongPlayer.id);
        usedPlayers.add(weakPlayer.id);
      }
    }

    res.json({
      success: true,
      data: { suggestions }
    });
  } catch (error) {
    console.error('Get team suggestions error:', error);
    res.status(500).json({
      success: false,
      message: '팀 조합 제안 중 오류가 발생했습니다.',
      error: 'GET_SUGGESTIONS_ERROR'
    });
  }
});

// Update team name
router.patch('/:teamId/name', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { teamId } = req.params;
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '팀 이름은 필수입니다.',
        error: 'MISSING_TEAM_NAME'
      });
    }

    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: { name: name.trim() },
      include: {
        player1: {
          select: {
            id: true,
            name: true,
            eloRating: true,
            skillLevel: true
          }
        },
        player2: {
          select: {
            id: true,
            name: true,
            eloRating: true,
            skillLevel: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: '팀 이름이 변경되었습니다.',
      data: { team: updatedTeam }
    });
  } catch (error) {
    console.error('Update team name error:', error);
    res.status(500).json({
      success: false,
      message: '팀 이름 변경 중 오류가 발생했습니다.',
      error: 'UPDATE_TEAM_NAME_ERROR'
    });
  }
});

// Delete team
router.delete('/:teamId', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { teamId } = req.params;

    // Check if team has active participations
    const activeParticipations = await prisma.participant.count({
      where: {
        teamId,
        isActive: true
      }
    });

    if (activeParticipations > 0) {
      return res.status(400).json({
        success: false,
        message: '참가 중인 대회가 있는 팀은 삭제할 수 없습니다.',
        error: 'TEAM_HAS_ACTIVE_PARTICIPATIONS'
      });
    }

    await prisma.team.delete({
      where: { id: teamId }
    });

    res.json({
      success: true,
      message: '팀이 삭제되었습니다.'
    });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({
      success: false,
      message: '팀 삭제 중 오류가 발생했습니다.',
      error: 'DELETE_TEAM_ERROR'
    });
  }
});

export default router;