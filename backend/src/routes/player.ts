import express from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { EloRatingService } from '../services/eloRatingService';

const router = express.Router();

// Get all players with pagination and filtering
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const {
      page = '1',
      limit = '20',
      search = '',
      skillLevel,
      province,
      minRating,
      maxRating,
      sortBy = 'eloRating',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {
      isActive: true,
    };

    // Search by name or email
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Filter by skill level
    if (skillLevel) {
      where.skillLevel = skillLevel;
    }

    // Filter by province
    if (province) {
      where.province = province;
    }

    // Filter by rating range
    if (minRating || maxRating) {
      where.eloRating = {};
      if (minRating) where.eloRating.gte = parseInt(minRating as string);
      if (maxRating) where.eloRating.lte = parseInt(maxRating as string);
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder === 'desc' ? 'desc' : 'asc';

    const [players, total] = await Promise.all([
      prisma.player.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          birthYear: true,
          birthDate: true,
          gender: true,
          province: true,
          district: true,
          address: true,
          emergencyContact: true,
          emergencyPhone: true,
          eloRating: true,
          skillLevel: true,
          confidenceIndex: true,
          totalMatches: true,
          wins: true,
          losses: true,
          lastMatchDate: true,
          registrationDate: true,
        },
        skip,
        take: limitNum,
        orderBy,
      }),
      prisma.player.count({ where })
    ]);

    // Debug: Log the skillLevel for each player
    players.forEach(player => {
      console.log(`Player ${player.name} skillLevel: ${player.skillLevel} (type: ${typeof player.skillLevel})`);
    });

    const totalPages = Math.ceil(total / limitNum);
    const hasNext = pageNum < totalPages;
    const hasPrev = pageNum > 1;

    res.json({
      success: true,
      data: {
        players,
        pagination: {
          current: pageNum,
          total: totalPages,
          count: total,
          hasNext,
          hasPrev,
          limit: limitNum,
        }
      }
    });
  } catch (error) {
    console.error('Get players error:', error);
    res.status(500).json({
      success: false,
      message: '선수 목록 조회 중 오류가 발생했습니다.',
      error: 'GET_PLAYERS_ERROR'
    });
  }
});

// Get single player by ID
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const player = await prisma.player.findUnique({
      where: { id },
      include: {
        ratingHistory: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
        participations: {
          include: {
            tournament: {
              select: {
                id: true,
                name: true,
                startDate: true,
                status: true,
              }
            }
          },
          orderBy: { registrationDate: 'desc' },
          take: 10,
        },
        player1Matches: {
          include: {
            player2: { select: { id: true, name: true } },
            tournament: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        player2Matches: {
          include: {
            player1: { select: { id: true, name: true } },
            tournament: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }
      }
    });

    if (!player) {
      return res.status(404).json({
        success: false,
        message: '선수를 찾을 수 없습니다.',
        error: 'PLAYER_NOT_FOUND'
      });
    }

    // Combine match history
    const allMatches = [
      ...player.player1Matches.map((match: any) => ({
        ...match,
        isPlayer1: true,
        opponent: match.player2,
        result: match.winnerId === player.id ? 'win' : 'loss'
      })),
      ...player.player2Matches.map((match: any) => ({
        ...match,
        isPlayer1: false,
        opponent: match.player1,
        result: match.winnerId === player.id ? 'win' : 'loss'
      }))
    ].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const playerData = {
      ...player,
      recentMatches: allMatches.slice(0, 10),
    };

    // Remove the separate match arrays
    delete (playerData as any).player1Matches;
    delete (playerData as any).player2Matches;

    res.json({
      success: true,
      data: playerData
    });
  } catch (error) {
    console.error('Get player error:', error);
    res.status(500).json({
      success: false,
      message: '선수 정보 조회 중 오류가 발생했습니다.',
      error: 'GET_PLAYER_ERROR'
    });
  }
});

// Create new player
router.post('/', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const {
      name,
      email,
      phone,
      birthYear,
      birthDate,
      gender,
      province,
      district,
      address,
      emergencyContact,
      emergencyPhone,
      initialRating,
      notes
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !birthYear || !gender || !province || !district) {
      return res.status(400).json({
        success: false,
        message: '필수 정보를 모두 입력해주세요.',
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    const rating = initialRating || parseInt(process.env.DEFAULT_ELO_RATING || '1200');

    const player = await prisma.player.create({
      data: {
        name,
        email,
        phone,
        birthYear: parseInt(birthYear),
        birthDate: birthDate ? new Date(birthDate) : null,
        gender,
        province,
        district,
        address,
        emergencyContact,
        emergencyPhone,
        eloRating: rating,
        skillLevel: EloRatingService.getSkillLevel(rating),
        notes,
      }
    });

    // Create initial rating history
    await prisma.playerRatingHistory.create({
      data: {
        playerId: player.id,
        oldRating: rating,
        newRating: rating,
        ratingChange: 0,
        reason: 'initial_rating',
      }
    });

    res.status(201).json({
      success: true,
      message: '선수가 등록되었습니다.',
      data: player
    });
  } catch (error) {
    console.error('Create player error:', error);
    res.status(500).json({
      success: false,
      message: '선수 등록 중 오류가 발생했습니다.',
      error: 'CREATE_PLAYER_ERROR'
    });
  }
});

// Update player
router.put('/:id', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    console.log('=== UPDATE PLAYER API DEBUG ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const {
      name,
      email,
      phone,
      birthYear,
      birthDate,
      gender,
      skillLevel,
      province,
      district,
      address,
      emergencyContact,
      emergencyPhone,
      notes,
      isActive
    } = req.body;

    const updateData: any = {};
    
    // Always include these fields if provided
    if (name !== undefined && name !== null && name !== '') updateData.name = name;
    if (email !== undefined && email !== null && email !== '') updateData.email = email;
    if (phone !== undefined && phone !== null && phone !== '') updateData.phone = phone;
    if (birthYear !== undefined && birthYear !== null) updateData.birthYear = parseInt(birthYear);
    if (birthDate !== undefined) {
      const parsedDate = birthDate ? new Date(birthDate) : null;
      updateData.birthDate = parsedDate;
      console.log('Setting birthDate in updateData:', birthDate, '-> parsed:', parsedDate);
    }
    if (gender !== undefined && gender !== null && gender !== '') updateData.gender = gender;
    
    // Force include skillLevel if provided (manual override, don't use EloRatingService)
    if (skillLevel !== undefined && skillLevel !== null) {
      updateData.skillLevel = skillLevel;
      console.log('Manual skillLevel update - Setting skillLevel in updateData:', skillLevel);
    }
    
    if (province !== undefined && province !== null && province !== '') updateData.province = province;
    if (district !== undefined && district !== null && district !== '') updateData.district = district;
    if (address !== undefined) updateData.address = address;
    if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact;
    if (emergencyPhone !== undefined) updateData.emergencyPhone = emergencyPhone;
    if (notes !== undefined) updateData.notes = notes;
    if (isActive !== undefined) updateData.isActive = isActive;

    console.log('UpdateData to be saved:', JSON.stringify(updateData, null, 2));
    console.log('UpdateData keys:', Object.keys(updateData));

    const player = await prisma.player.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      message: '선수 정보가 수정되었습니다.',
      data: player
    });
  } catch (error) {
    console.error('Update player error:', error);
    res.status(500).json({
      success: false,
      message: '선수 정보 수정 중 오류가 발생했습니다.',
      error: 'UPDATE_PLAYER_ERROR'
    });
  }
});

// Manually adjust player rating
router.patch('/:id/rating', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { newRating, reason = 'manual_adjustment' } = req.body;

    if (!newRating || newRating < 100 || newRating > 4000) {
      return res.status(400).json({
        success: false,
        message: '유효한 레이팅 값을 입력해주세요 (100-4000).',
        error: 'INVALID_RATING'
      });
    }

    const player = await prisma.player.findUnique({
      where: { id },
      select: { eloRating: true }
    });

    if (!player) {
      return res.status(404).json({
        success: false,
        message: '선수를 찾을 수 없습니다.',
        error: 'PLAYER_NOT_FOUND'
      });
    }

    const ratingChange = newRating - player.eloRating;

    // Update player rating
    const updatedPlayer = await prisma.player.update({
      where: { id },
      data: {
        eloRating: newRating,
        skillLevel: EloRatingService.getSkillLevel(newRating),
      }
    });

    // Record rating history
    await prisma.playerRatingHistory.create({
      data: {
        playerId: id,
        oldRating: player.eloRating,
        newRating,
        ratingChange,
        reason,
      }
    });

    res.json({
      success: true,
      message: '선수 레이팅이 조정되었습니다.',
      data: {
        player: updatedPlayer,
        ratingChange,
      }
    });
  } catch (error) {
    console.error('Adjust rating error:', error);
    res.status(500).json({
      success: false,
      message: '레이팅 조정 중 오류가 발생했습니다.',
      error: 'ADJUST_RATING_ERROR'
    });
  }
});

// Get players suitable for matchmaking
router.get('/:id/potential-opponents', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { maxDifference = '200', limit = '20' } = req.query;

    const player = await prisma.player.findUnique({
      where: { id },
      select: { eloRating: true }
    });

    if (!player) {
      return res.status(404).json({
        success: false,
        message: '선수를 찾을 수 없습니다.',
        error: 'PLAYER_NOT_FOUND'
      });
    }

    const potentialOpponents = await EloRatingService.getPlayersInRatingRange(
      player.eloRating,
      parseInt(maxDifference as string),
      [id],
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: potentialOpponents
    });
  } catch (error) {
    console.error('Get potential opponents error:', error);
    res.status(500).json({
      success: false,
      message: '상대 후보 조회 중 오류가 발생했습니다.',
      error: 'GET_OPPONENTS_ERROR'
    });
  }
});

// Delete player (soft delete)
router.delete('/:id', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    await prisma.player.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: '선수가 삭제되었습니다.',
    });
  } catch (error) {
    console.error('Delete player error:', error);
    res.status(500).json({
      success: false,
      message: '선수 삭제 중 오류가 발생했습니다.',
      error: 'DELETE_PLAYER_ERROR'
    });
  }
});

export default router;