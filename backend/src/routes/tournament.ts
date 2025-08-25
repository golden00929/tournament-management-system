import express from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { BracketGenerationService } from '../services/bracketGenerationService';

const router = express.Router();

// Get all tournaments with pagination and filtering
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const {
      page = '1',
      limit = '20',
      search = '',
      status,
      category,
      startDate,
      endDate,
      sortBy = 'startDate',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    // Search by name or description
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by category
    if (category) {
      where.category = category;
    }

    // Filter by date range
    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = new Date(startDate as string);
      if (endDate) where.startDate.lte = new Date(endDate as string);
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder === 'desc' ? 'desc' : 'asc';

    const [tournaments, total] = await Promise.all([
      prisma.tournament.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          startDate: true,
          endDate: true,
          registrationStart: true,
          registrationEnd: true,
          location: true,
          venue: true,
          maxParticipants: true,
          tournamentType: true,
          skillLevel: true,
          participantFee: true,
          organizerFee: true,
          pricingTier: true,
          status: true,
          createdAt: true,
        },
        skip,
        take: limitNum,
        orderBy,
      }),
      prisma.tournament.count({ where })
    ]);

    const totalPages = Math.ceil(total / limitNum);
    const hasNext = pageNum < totalPages;
    const hasPrev = pageNum > 1;

    res.json({
      success: true,
      data: {
        tournaments,
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
    console.error('Get tournaments error:', error);
    res.status(500).json({
      success: false,
      message: '대회 목록 조회 중 오류가 발생했습니다.',
      error: 'GET_TOURNAMENTS_ERROR'
    });
  }
});

// Get single tournament by ID with detailed information
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            player: {
              select: {
                id: true,
                name: true,
                eloRating: true,
                skillLevel: true
              }
            }
          },
          orderBy: { registrationDate: 'desc' }
        },
        brackets: {
          orderBy: { createdAt: 'desc' }
        },
        matches: {
          include: {
            player1: { select: { id: true, name: true } },
            player2: { select: { id: true, name: true } }
          },
          orderBy: { scheduledTime: 'asc' },
          take: 10
        },
        schedules: {
          orderBy: { startTime: 'asc' },
          take: 10
        },
        paymentRecords: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: '대회를 찾을 수 없습니다.',
        error: 'TOURNAMENT_NOT_FOUND'
      });
    }

    // Calculate tournament statistics
    const stats = {
      totalParticipants: tournament.participants.length,
      approvedParticipants: tournament.participants.filter(p => p.approvalStatus === 'approved').length,
      paidParticipants: tournament.participants.filter(p => p.paymentStatus === 'completed').length,
      totalMatches: tournament.matches.length,
      completedMatches: tournament.matches.filter(m => m.status === 'completed').length,
      totalRevenue: tournament.participants
        .filter(p => p.paymentStatus === 'completed')
        .length * tournament.participantFee
    };

    res.json({
      success: true,
      data: {
        ...tournament,
        statistics: stats
      }
    });
  } catch (error) {
    console.error('Get tournament error:', error);
    res.status(500).json({
      success: false,
      message: '대회 정보 조회 중 오류가 발생했습니다.',
      error: 'GET_TOURNAMENT_ERROR'
    });
  }
});

// Create new tournament
router.post('/', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    console.log('=== CREATE TOURNAMENT API DEBUG ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const {
      name,
      description,
      category,
      startDate,
      endDate,
      registrationStart,
      registrationEnd,
      location,
      locationLat,
      locationLng,
      venue,
      maxParticipants,
      minSkillLevel,
      maxSkillLevel,
      skillDiffLimit,
      tournamentType,
      skillLevel,
      participantFee,
      organizerFee,
      pricingTier,
      contactPhone,
      contactEmail,
      bankInfo,
      organizerInfo
    } = req.body;

    // Validate required fields
    if (!name || !category || !startDate || !endDate || !registrationStart || !registrationEnd || !location || !venue) {
      return res.status(400).json({
        success: false,
        message: '필수 정보를 모두 입력해주세요.',
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const regStart = new Date(registrationStart);
    const regEnd = new Date(registrationEnd);

    if (start > end) {
      console.log('Date validation failed:', { startDate, endDate, start, end });
      return res.status(400).json({
        success: false,
        message: '대회 종료일은 시작일보다 이전일 수 없습니다.',
        error: 'INVALID_DATE_RANGE'
      });
    }
    
    console.log('Date validation passed:', { startDate, endDate, start, end });

    if (regStart >= regEnd) {
      console.log('Registration date validation failed:', { regStart, regEnd });
      return res.status(400).json({
        success: false,
        message: '등록 종료일은 등록 시작일보다 늦어야 합니다.',
        error: 'INVALID_REGISTRATION_PERIOD'
      });
    }
    
    if (regEnd > start) {
      console.log('Registration vs start date validation failed:', { regEnd, start });
      return res.status(400).json({
        success: false,
        message: '등록 종료일은 대회 시작일보다 이전이어야 합니다.',
        error: 'INVALID_REGISTRATION_PERIOD'
      });
    }

    // Convert skill level strings to numbers if they are strings
    const convertSkillLevel = (level: any): number => {
      if (typeof level === 'number') return level;
      if (typeof level === 'string') {
        switch (level.toLowerCase()) {
          case 'beginner': return 1000;
          case 'intermediate': return 1500;
          case 'advanced': return 2000;
          case 'expert': return 2500;
          default: return parseInt(level) || 1000;
        }
      }
      return 1000;
    };

    const finalMinSkillLevel = convertSkillLevel(minSkillLevel);
    const finalMaxSkillLevel = convertSkillLevel(maxSkillLevel);

    // Determine pricing tier based on max participants
    let finalPricingTier = pricingTier || 'basic';
    let finalOrganizerFee = organizerFee || 50000;

    if (!pricingTier) {
      if (maxParticipants <= 50) {
        finalPricingTier = 'basic';
        finalOrganizerFee = 50000;
      } else if (maxParticipants <= 200) {
        finalPricingTier = 'standard';
        finalOrganizerFee = 150000;
      } else {
        finalPricingTier = 'premium';
        finalOrganizerFee = 300000;
      }
    }

    console.log('Final skill levels before creation:', {
      minSkillLevel,
      maxSkillLevel,
      finalMinSkillLevel,
      finalMaxSkillLevel
    });

    const tournament = await prisma.tournament.create({
      data: {
        name,
        description,
        category,
        startDate: start,
        endDate: end,
        registrationStart: regStart,
        registrationEnd: regEnd,
        location,
        locationLat: locationLat ? parseFloat(locationLat) : null,
        locationLng: locationLng ? parseFloat(locationLng) : null,
        venue,
        maxParticipants: maxParticipants || 100,
        minSkillLevel: finalMinSkillLevel,
        maxSkillLevel: finalMaxSkillLevel,
        skillDiffLimit: skillDiffLimit || 200,
        tournamentType: tournamentType || 'single_elimination',
        skillLevel: skillLevel || 'all',
        participantFee: participantFee || 0,
        organizerFee: finalOrganizerFee,
        pricingTier: finalPricingTier,
        contactPhone,
        contactEmail,
        bankInfo,
        organizerInfo,
        status: 'draft'
      }
    });

    console.log('✅ Tournament created successfully with converted skill levels');

    res.status(201).json({
      success: true,
      message: '대회가 생성되었습니다.',
      data: tournament
    });
  } catch (error) {
    console.error('Create tournament error:', error);
    res.status(500).json({
      success: false,
      message: '대회 생성 중 오류가 발생했습니다.',
      error: 'CREATE_TOURNAMENT_ERROR'
    });
  }
});

// Update tournament
router.put('/:id', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Only allow specific fields to be updated (whitelist approach)
    const allowedFields = [
      'name', 'description', 'category', 'startDate', 'endDate', 
      'registrationStart', 'registrationEnd', 'location', 'locationLat', 
      'locationLng', 'venue', 'maxParticipants', 'minSkillLevel', 
      'maxSkillLevel', 'skillDiffLimit', 'tournamentType', 'skillLevel',
      'participantFee', 'organizerFee', 'pricingTier', 'status',
      'posterImage', 'rulesDocument', 'contactPhone', 'contactEmail',
      'bankInfo', 'organizerInfo'
    ];
    
    console.log('=== TOURNAMENT UPDATE DEBUG ===');
    console.log('Original updateData keys:', Object.keys(updateData));
    console.log('Original updateData:', JSON.stringify(updateData, null, 2));
    
    // Create filtered update data with only allowed fields
    const filteredUpdateData: any = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredUpdateData[field] = updateData[field];
      }
    });
    
    console.log('Filtered updateData keys:', Object.keys(filteredUpdateData));
    console.log('Filtered updateData:', JSON.stringify(filteredUpdateData, null, 2));
    
    // CRITICAL: Use filtered data instead of original updateData
    const updateDataToUse = filteredUpdateData;

    // Validate dates if provided
    if (updateDataToUse.startDate && updateDataToUse.endDate) {
      const start = new Date(updateDataToUse.startDate);
      const end = new Date(updateDataToUse.endDate);
      
      if (start > end) {
        return res.status(400).json({
          success: false,
          message: '대회 종료일은 시작일보다 이전일 수 없습니다.',
          error: 'INVALID_DATE_RANGE'
        });
      }
    }

    // Convert date strings to Date objects
    if (updateDataToUse.startDate) updateDataToUse.startDate = new Date(updateDataToUse.startDate);
    if (updateDataToUse.endDate) updateDataToUse.endDate = new Date(updateDataToUse.endDate);
    if (updateDataToUse.registrationStart) updateDataToUse.registrationStart = new Date(updateDataToUse.registrationStart);
    if (updateDataToUse.registrationEnd) updateDataToUse.registrationEnd = new Date(updateDataToUse.registrationEnd);

    // Convert numeric fields
    if (updateDataToUse.locationLat) updateDataToUse.locationLat = parseFloat(updateDataToUse.locationLat);
    if (updateDataToUse.locationLng) updateDataToUse.locationLng = parseFloat(updateDataToUse.locationLng);
    if (updateDataToUse.maxParticipants) updateDataToUse.maxParticipants = parseInt(updateDataToUse.maxParticipants);
    if (updateDataToUse.participantFee) updateDataToUse.participantFee = parseInt(updateDataToUse.participantFee);
    if (updateDataToUse.organizerFee) updateDataToUse.organizerFee = parseInt(updateDataToUse.organizerFee);
    
    // Handle skill level fields carefully - convert string to ELO rating
    if (updateDataToUse.minSkillLevel !== undefined) {
      let parsed = parseInt(updateDataToUse.minSkillLevel);
      
      // If parseInt failed, try to convert skill level string to ELO rating
      if (isNaN(parsed)) {
        const skillLevelToElo = {
          'Beginner': 1000,
          'Intermediate': 1500, 
          'Advanced': 2000,
          'Expert': 2500,
          'beginner': 1000,
          'intermediate': 1500,
          'advanced': 2000, 
          'expert': 2500,
          'd_class': 1000,
          'c_class': 1500,
          'b_class': 2000,
          'a_class': 2500
        };
        parsed = skillLevelToElo[updateDataToUse.minSkillLevel as string] || 1000;
      }
      
      updateDataToUse.minSkillLevel = parsed;
      console.log('Converted minSkillLevel:', updateDataToUse.minSkillLevel, 'to ELO:', parsed);
    }
    
    if (updateDataToUse.maxSkillLevel !== undefined) {
      let parsed = parseInt(updateDataToUse.maxSkillLevel);
      
      // If parseInt failed, try to convert skill level string to ELO rating
      if (isNaN(parsed)) {
        const skillLevelToElo = {
          'Beginner': 1000,
          'Intermediate': 1500,
          'Advanced': 2000, 
          'Expert': 2500,
          'beginner': 1000,
          'intermediate': 1500,
          'advanced': 2000,
          'expert': 2500,
          'd_class': 1000,
          'c_class': 1500,
          'b_class': 2000,
          'a_class': 2500
        };
        parsed = skillLevelToElo[updateDataToUse.maxSkillLevel as string] || 2500;
      }
      
      updateDataToUse.maxSkillLevel = parsed;
      console.log('Converted maxSkillLevel:', updateDataToUse.maxSkillLevel, 'to ELO:', parsed);
    }
    if (updateDataToUse.skillDiffLimit !== undefined) {
      const parsed = parseInt(updateDataToUse.skillDiffLimit);
      if (isNaN(parsed)) {
        delete updateDataToUse.skillDiffLimit;
      } else {
        updateDataToUse.skillDiffLimit = parsed;
      }
    }

    console.log('=== FINAL PRISMA UPDATE DATA ===');
    console.log('Final updateDataToUse keys:', Object.keys(updateDataToUse));
    console.log('Final updateDataToUse:', JSON.stringify(updateDataToUse, null, 2));

    const tournament = await prisma.tournament.update({
      where: { id },
      data: updateDataToUse
    });

    res.json({
      success: true,
      message: '대회 정보가 수정되었습니다.',
      data: tournament
    });
  } catch (error) {
    console.error('Update tournament error:', error);
    res.status(500).json({
      success: false,
      message: '대회 정보 수정 중 오류가 발생했습니다.',
      error: 'UPDATE_TOURNAMENT_ERROR'
    });
  }
});

// Update tournament status
router.patch('/:id/status', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['draft', 'open', 'closed', 'ongoing', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '유효한 상태값을 입력해주세요.',
        error: 'INVALID_STATUS'
      });
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      select: { status: true, registrationStart: true, registrationEnd: true }
    });

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: '대회를 찾을 수 없습니다.',
        error: 'TOURNAMENT_NOT_FOUND'
      });
    }

    // Validate status transitions with flexible registration start date
    const now = new Date();
    let updateData: any = { status };
    
    if (status === 'open') {
      // 모집중으로 변경 시, registrationStart가 미래 날짜면 현재 시간으로 조정
      if (tournament.registrationStart && now < tournament.registrationStart) {
        console.log('📅 Registration start date is in future, adjusting to current time');
        updateData.registrationStart = now;
      }
      
      // registrationEnd가 과거이면 7일 후로 연장
      if (tournament.registrationEnd && now > tournament.registrationEnd) {
        console.log('📅 Registration end date is in past, extending by 7 days');
        const extendedDate = new Date(now);
        extendedDate.setDate(extendedDate.getDate() + 7);
        updateData.registrationEnd = extendedDate;
      }
    }

    const updatedTournament = await prisma.tournament.update({
      where: { id },
      data: updateData
    });

    // 상태 변경 결과 메시지 생성
    let message = '대회 상태가 변경되었습니다.';
    if (status === 'open' && updateData.registrationStart) {
      message += ' 등록 시작일이 현재 시간으로 조정되었습니다.';
    }
    if (status === 'open' && updateData.registrationEnd) {
      message += ' 등록 종료일이 7일 후로 연장되었습니다.';
    }

    res.json({
      success: true,
      message,
      data: { 
        id: updatedTournament.id,
        status: updatedTournament.status,
        registrationStart: updatedTournament.registrationStart,
        registrationEnd: updatedTournament.registrationEnd
      }
    });
  } catch (error) {
    console.error('Update tournament status error:', error);
    res.status(500).json({
      success: false,
      message: '대회 상태 변경 중 오류가 발생했습니다.',
      error: 'UPDATE_STATUS_ERROR'
    });
  }
});

// Delete tournament with force option
router.delete('/:id', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { force } = req.query; // ?force=true for hard delete

    // Check tournament existence first
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        participants: true,
        brackets: true,
        matches: true,
      }
    });

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: '대회를 찾을 수 없습니다.',
        error: 'TOURNAMENT_NOT_FOUND'
      });
    }

    const participantCount = tournament.participants.filter(p => p.isActive).length;
    const bracketCount = tournament.brackets.length;
    const matchCount = tournament.matches.length;

    // If force delete is requested, delete everything
    if (force === 'true') {
      console.log(`Force deleting tournament ${id} with ${participantCount} participants, ${bracketCount} brackets, ${matchCount} matches`);
      
      try {
        // Delete in correct order due to foreign key constraints
        await prisma.match.deleteMany({ where: { tournamentId: id } });
        await prisma.bracket.deleteMany({ where: { tournamentId: id } });
        await prisma.participant.deleteMany({ where: { tournamentId: id } });
        await prisma.tournament.delete({ where: { id } });

        return res.json({
          success: true,
          message: `대회가 완전히 삭제되었습니다. (참가자: ${participantCount}, 대진표: ${bracketCount}, 경기: ${matchCount})`,
        });
      } catch (deleteError) {
        console.error('Force delete error:', deleteError);
        return res.status(500).json({
          success: false,
          message: '강제 삭제 중 오류가 발생했습니다.',
          error: 'FORCE_DELETE_ERROR',
          details: deleteError
        });
      }
    }

    // Normal delete logic
    if (participantCount > 0 || bracketCount > 0 || matchCount > 0) {
      // Soft delete - change status instead of actual deletion
      await prisma.tournament.update({
        where: { id },
        data: { status: 'cancelled' }
      });

      return res.json({
        success: true,
        message: `참가자가 있는 대회는 취소 상태로 변경되었습니다. (참가자: ${participantCount}, 대진표: ${bracketCount}, 경기: ${matchCount})`,
        softDelete: true,
        forceDeleteUrl: `/api/tournaments/${id}?force=true`,
        details: {
          participants: participantCount,
          brackets: bracketCount,
          matches: matchCount
        }
      });
    }

    // Hard delete if no related data
    await prisma.tournament.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: '대회가 삭제되었습니다.',
    });
  } catch (error) {
    console.error('Delete tournament error:', error);
    res.status(500).json({
      success: false,
      message: '대회 삭제 중 오류가 발생했습니다.',
      error: 'DELETE_TOURNAMENT_ERROR',
      details: error.message
    });
  }
});

// Get tournament statistics
router.get('/:id/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            player: {
              select: {
                eloRating: true,
                skillLevel: true,
                province: true
              }
            }
          }
        },
        matches: {
          select: {
            status: true,
            winnerId: true
          }
        }
      }
    });

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: '대회를 찾을 수 없습니다.',
        error: 'TOURNAMENT_NOT_FOUND'
      });
    }

    const participants = tournament.participants;
    const matches = tournament.matches;

    // Calculate statistics
    const stats = {
      registration: {
        total: participants.length,
        approved: participants.filter(p => p.approvalStatus === 'approved').length,
        pending: participants.filter(p => p.approvalStatus === 'pending').length,
        rejected: participants.filter(p => p.approvalStatus === 'rejected').length,
      },
      payment: {
        completed: participants.filter(p => p.paymentStatus === 'completed').length,
        pending: participants.filter(p => p.paymentStatus === 'pending').length,
        failed: participants.filter(p => p.paymentStatus === 'failed').length,
        totalRevenue: participants
          .filter(p => p.paymentStatus === 'completed')
          .length * tournament.participantFee
      },
      skillDistribution: {
        beginner: participants.filter(p => p.player.skillLevel === 'beginner').length,
        intermediate: participants.filter(p => p.player.skillLevel === 'intermediate').length,
        advanced: participants.filter(p => p.player.skillLevel === 'advanced').length,
        expert: participants.filter(p => p.player.skillLevel === 'expert').length,
      },
      ratingStats: participants.length > 0 ? {
        average: Math.round(participants.reduce((sum, p) => sum + p.player.eloRating, 0) / participants.length),
        min: Math.min(...participants.map(p => p.player.eloRating)),
        max: Math.max(...participants.map(p => p.player.eloRating)),
      } : null,
      matches: {
        total: matches.length,
        scheduled: matches.filter(m => m.status === 'scheduled').length,
        ongoing: matches.filter(m => m.status === 'ongoing').length,
        completed: matches.filter(m => m.status === 'completed').length,
        cancelled: matches.filter(m => m.status === 'cancelled').length,
      },
      regional: participants.reduce((acc: any, p) => {
        const province = p.player.province;
        acc[province] = (acc[province] || 0) + 1;
        return acc;
      }, {})
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get tournament stats error:', error);
    res.status(500).json({
      success: false,
      message: '대회 통계 조회 중 오류가 발생했습니다.',
      error: 'GET_STATS_ERROR'
    });
  }
});

// Get tournament brackets
router.get('/:id/bracket', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id: tournamentId } = req.params;

    const brackets = await prisma.bracket.findMany({
      where: { tournamentId },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        matches: {
          include: {
            player1: { select: { id: true, name: true, eloRating: true } },
            player2: { select: { id: true, name: true, eloRating: true } }
          },
          orderBy: [
            { roundName: 'asc' },
            { matchNumber: 'asc' }
          ]
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (brackets.length === 0) {
      return res.status(404).json({
        success: false,
        message: '대진표가 생성되지 않았습니다.',
        error: 'NO_BRACKETS_FOUND'
      });
    }

    const enrichedBrackets = brackets.map(bracket => {
      const participants = JSON.parse(bracket.participants);
      const bracketData = bracket.bracketData ? JSON.parse(bracket.bracketData) : null;
      const matches = bracket.matches;
      
      return {
        ...bracket,
        participants,
        bracketStructure: bracketData,
        statistics: {
          totalParticipants: participants.length,
          totalMatches: matches.length,
          completedMatches: matches.filter((m: any) => m.status === 'completed').length,
          ongoingMatches: matches.filter((m: any) => m.status === 'ongoing').length,
          scheduledMatches: matches.filter((m: any) => m.status === 'scheduled').length
        }
      };
    });

    res.json({
      success: true,
      data: enrichedBrackets[0] // Return the latest bracket
    });
  } catch (error) {
    console.error('Get tournament bracket error:', error);
    res.status(500).json({
      success: false,
      message: '대진표 조회 중 오류가 발생했습니다.',
      error: 'GET_BRACKET_ERROR'
    });
  }
});

// Generate bracket for a tournament
router.post('/:id/bracket/generate', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id: tournamentId } = req.params;
    const {
      eventType = 'singles',
      bracketSize = 32,
      bracketType = 'single_elimination',
      name
    } = req.body;

    // Check if tournament exists and has approved participants
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
        name: true,
        status: true,
        skillDiffLimit: true,
      }
    });

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: '대회를 찾을 수 없습니다.',
        error: 'TOURNAMENT_NOT_FOUND'
      });
    }

    // Check for approved participants
    const approvedParticipants = await prisma.participant.count({
      where: {
        tournamentId,
        approvalStatus: 'approved',
        paymentStatus: 'completed',
        isActive: true
      }
    });
    
    if (approvedParticipants === 0) {
      return res.status(400).json({
        success: false,
        message: '승인된 참가자가 없습니다.',
        error: 'NO_APPROVED_PARTICIPANTS'
      });
    }

    // Delete existing bracket if any
    await prisma.bracket.deleteMany({
      where: { tournamentId }
    });

    // Generate balanced brackets using the service
    const bracketResult = await BracketGenerationService.generateBalancedBrackets(
      tournamentId,
      eventType,
      bracketSize
    );

    // Validate bracket fairness
    const fairnessValidation = BracketGenerationService.validateBracketFairness(bracketResult.groups);

    if (!fairnessValidation.isValid && fairnessValidation.score < 70) {
      return res.status(400).json({
        success: false,
        message: '공정한 대진표 생성에 실패했습니다.',
        error: 'BRACKET_GENERATION_FAILED',
        details: fairnessValidation.issues
      });
    }

    // Calculate skill level range for this bracket
    const allParticipants = bracketResult.groups.flatMap(g => g.players);
    const skillLevelMin = Math.min(...allParticipants.map(p => p.eloRating));
    const skillLevelMax = Math.max(...allParticipants.map(p => p.eloRating));

    // Save bracket to database
    const bracket = await prisma.bracket.create({
      data: {
        tournamentId,
        name: name || `${eventType} 대진표 - ${new Date().toLocaleDateString('ko-KR')}`,
        eventType,
        skillLevelMin,
        skillLevelMax,
        type: bracketType,
        maxParticipants: bracketSize,
        participants: JSON.stringify(allParticipants.map(p => ({
          id: p.id,
          name: p.name,
          eloRating: p.eloRating,
          skillLevel: p.skillLevel,
          province: p.province,
          district: p.district
        }))),
        bracketData: JSON.stringify(bracketResult.bracketStructure),
        status: 'published'
      }
    });

    // Create matches from bracket structure
    const matches = [];
    for (const group of bracketResult.groups) {
      // Generate round-robin matches within each group
      const players = group.players;
      for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
          matches.push({
            tournamentId,
            bracketId: bracket.id,
            roundName: 'group_stage',
            matchNumber: matches.length + 1,
            player1Id: players[i].id,
            player2Id: players[j].id,
            player1Name: players[i].name,
            player2Name: players[j].name,
            status: 'scheduled'
          });
        }
      }
    }

    if (matches.length > 0) {
      await prisma.match.createMany({
        data: matches
      });
    }

    // Update participant group assignments
    for (const group of bracketResult.groups) {
      const participantIds = group.players.map(p => p.id);
      
      await prisma.participant.updateMany({
        where: {
          tournamentId,
          playerId: { in: participantIds }
        },
        data: {
          assignedGroup: group.groupId
        }
      });
    }

    res.status(201).json({
      success: true,
      message: '대진표가 성공적으로 생성되었습니다.',
      data: {
        bracket,
        fairnessScore: fairnessValidation.score,
        statistics: bracketResult.statistics,
        matchesCreated: matches.length,
        groups: bracketResult.groups.length
      }
    });
  } catch (error) {
    console.error('Generate tournament bracket error:', error);
    res.status(500).json({
      success: false,
      message: '대진표 생성 중 오류가 발생했습니다.',
      error: 'GENERATE_BRACKET_ERROR'
    });
  }
});

// Copy tournament
router.post('/:id/copy', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name: newName } = req.body;

    // Find the original tournament
    const originalTournament = await prisma.tournament.findUnique({
      where: { id },
      select: {
        name: true,
        description: true,
        category: true,
        location: true,
        locationLat: true,
        locationLng: true,
        venue: true,
        maxParticipants: true,
        minSkillLevel: true,
        maxSkillLevel: true,
        skillDiffLimit: true,
        tournamentType: true,
        skillLevel: true,
        participantFee: true,
        organizerFee: true,
        pricingTier: true,
        contactPhone: true,
        contactEmail: true,
        bankInfo: true,
        organizerInfo: true
      }
    });

    if (!originalTournament) {
      return res.status(404).json({
        success: false,
        message: '복사할 대회를 찾을 수 없습니다.',
        error: 'TOURNAMENT_NOT_FOUND'
      });
    }

    // Set default dates (7 days from now for registration, 30 days for tournament)
    const now = new Date();
    const registrationStart = new Date(now);
    registrationStart.setDate(registrationStart.getDate() + 7);
    
    const registrationEnd = new Date(registrationStart);
    registrationEnd.setDate(registrationEnd.getDate() + 14);
    
    const startDate = new Date(registrationEnd);
    startDate.setDate(startDate.getDate() + 7);
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 2);

    // Create new tournament with copied data
    const copiedTournament = await prisma.tournament.create({
      data: {
        name: newName || `${originalTournament.name} (복사본)`,
        description: originalTournament.description,
        category: originalTournament.category,
        startDate,
        endDate,
        registrationStart,
        registrationEnd,
        location: originalTournament.location,
        locationLat: originalTournament.locationLat,
        locationLng: originalTournament.locationLng,
        venue: originalTournament.venue,
        maxParticipants: originalTournament.maxParticipants,
        minSkillLevel: originalTournament.minSkillLevel,
        maxSkillLevel: originalTournament.maxSkillLevel,
        skillDiffLimit: originalTournament.skillDiffLimit,
        tournamentType: originalTournament.tournamentType,
        skillLevel: originalTournament.skillLevel,
        participantFee: originalTournament.participantFee,
        organizerFee: originalTournament.organizerFee,
        pricingTier: originalTournament.pricingTier,
        contactPhone: originalTournament.contactPhone,
        contactEmail: originalTournament.contactEmail,
        bankInfo: originalTournament.bankInfo,
        organizerInfo: originalTournament.organizerInfo,
        status: 'draft'
      }
    });

    res.status(201).json({
      success: true,
      message: '대회가 성공적으로 복사되었습니다.',
      data: copiedTournament
    });
  } catch (error) {
    console.error('Copy tournament error:', error);
    res.status(500).json({
      success: false,
      message: '대회 복사 중 오류가 발생했습니다.',
      error: 'COPY_TOURNAMENT_ERROR'
    });
  }
});

export default router;