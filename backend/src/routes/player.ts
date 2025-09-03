import express from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { EloRatingService } from '../services/eloRatingService';
import { stringify } from 'csv-stringify';
import multer from 'multer';
import csv from 'csv-parser';

const router = express.Router();

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

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
    console.log('=== CREATE PLAYER API DEBUG ===');
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
      initialRating,
      notes
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !gender || !province || !district) {
      return res.status(400).json({
        success: false,
        message: '필수 정보를 모두 입력해주세요.',
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    const rating = initialRating || parseInt(process.env.DEFAULT_ELO_RATING || '1200');
    
    // Use provided skillLevel or derive from rating
    const finalSkillLevel = skillLevel || EloRatingService.getSkillLevel(rating);
    
    console.log('Final data to create:', {
      name,
      email,
      phone,
      birthYear,
      birthDate,
      gender,
      skillLevel: finalSkillLevel,
      province,
      district,
      rating
    });

    const player = await prisma.player.create({
      data: {
        name,
        email,
        phone,
        birthYear: birthYear ? parseInt(birthYear) : null,
        birthDate: birthDate ? new Date(birthDate) : null,
        gender,
        skillLevel: finalSkillLevel,
        province,
        district,
        address,
        emergencyContact,
        emergencyPhone,
        eloRating: rating,
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
    if (error.code === 'P2002') {
      res.status(400).json({
        success: false,
        message: '이미 등록된 이메일입니다.',
        error: 'EMAIL_ALREADY_EXISTS'
      });
    } else {
      res.status(500).json({
        success: false,
        message: '선수 등록 중 오류가 발생했습니다.',
        error: 'CREATE_PLAYER_ERROR'
      });
    }
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

// Import players from CSV
router.post('/import/csv', authenticate, requireRole(['admin']), upload.single('csvFile'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV 파일이 업로드되지 않았습니다.',
        error: 'NO_FILE_UPLOADED'
      });
    }

    const results: any[] = [];
    const errors: string[] = [];
    let validCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    // Parse CSV data
    const csvData = req.file.buffer.toString('utf8');
    
    return new Promise((resolve, reject) => {
      const stream = csv({
        // Handle CSV with or without BOM
        skipEmptyLines: true,
        headers: ['name', 'email', 'phone', 'birthYear', 'gender', 'province', 'district', 'eloRating', 'skillLevel']
      });

      stream.on('data', (data) => {
        results.push(data);
      });

      stream.on('end', async () => {
        try {
          // Skip header row if exists
          const dataRows = results.slice(1);
          
          for (let i = 0; i < dataRows.length; i++) {
            const row = dataRows[i];
            const lineNumber = i + 2; // Account for header and 0-based index

            try {
              // Validate required fields
              if (!row.name || !row.email) {
                errors.push(`줄 ${lineNumber}: 이름과 이메일은 필수입니다.`);
                errorCount++;
                continue;
              }

              // Email validation
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(row.email)) {
                errors.push(`줄 ${lineNumber}: 올바르지 않은 이메일 형식입니다.`);
                errorCount++;
                continue;
              }

              // Check for duplicate email
              const existingPlayer = await prisma.player.findUnique({
                where: { email: row.email }
              });

              if (existingPlayer) {
                errors.push(`줄 ${lineNumber}: 이메일 ${row.email}는 이미 등록된 선수입니다.`);
                duplicateCount++;
                continue;
              }

              // Parse and validate data
              const birthYear = row.birthYear ? parseInt(row.birthYear) : new Date().getFullYear() - 25;
              const eloRating = row.eloRating ? parseInt(row.eloRating) : 1200;
              
              // Gender validation
              let gender = 'male';
              if (row.gender) {
                const genderLower = row.gender.toLowerCase();
                if (genderLower.includes('여') || genderLower.includes('female') || genderLower.includes('f')) {
                  gender = 'female';
                }
              }

              // Skill level mapping
              let skillLevel = 'beginner';
              if (row.skillLevel) {
                const skillLower = row.skillLevel.toLowerCase();
                if (skillLower.includes('intermediate') || skillLower.includes('중급') || skillLower.includes('c')) {
                  skillLevel = 'intermediate';
                } else if (skillLower.includes('advanced') || skillLower.includes('고급') || skillLower.includes('b')) {
                  skillLevel = 'advanced';
                } else if (skillLower.includes('expert') || skillLower.includes('전문') || skillLower.includes('a')) {
                  skillLevel = 'expert';
                }
              }

              // Create player
              await prisma.player.create({
                data: {
                  name: row.name.trim(),
                  email: row.email.trim().toLowerCase(),
                  phone: row.phone || '',
                  birthYear,
                  gender,
                  province: row.province || '',
                  district: row.district || '',
                  eloRating,
                  skillLevel,
                  isActive: true,
                  registrationDate: new Date(),
                }
              });

              validCount++;
            } catch (error) {
              console.error(`Error processing row ${lineNumber}:`, error);
              errors.push(`줄 ${lineNumber}: 데이터 처리 중 오류가 발생했습니다.`);
              errorCount++;
            }
          }

          res.json({
            success: true,
            message: `CSV 가져오기가 완료되었습니다. 성공: ${validCount}명, 중복: ${duplicateCount}명, 오류: ${errorCount}개`,
            data: {
              totalRows: dataRows.length,
              validCount,
              duplicateCount,
              errorCount,
              errors: errors.slice(0, 50) // Limit error messages to first 50
            }
          });
        } catch (error) {
          console.error('CSV import error:', error);
          res.status(500).json({
            success: false,
            message: 'CSV 파일 처리 중 오류가 발생했습니다.',
            error: 'CSV_PROCESSING_ERROR'
          });
        }
      });

      stream.on('error', (error) => {
        console.error('CSV parsing error:', error);
        res.status(400).json({
          success: false,
          message: 'CSV 파일 형식이 올바르지 않습니다.',
          error: 'CSV_PARSING_ERROR'
        });
      });

      // Parse the CSV
      stream.write(csvData);
      stream.end();
    });

  } catch (error) {
    console.error('Import players error:', error);
    res.status(500).json({
      success: false,
      message: '선수 목록 가져오기 중 오류가 발생했습니다.',
      error: 'IMPORT_PLAYERS_ERROR'
    });
  }
});

// Export players to CSV
router.get('/export/csv', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const {
      search = '',
      skillLevel,
      province,
      minRating,
      maxRating,
      format = 'csv'
    } = req.query;

    // Build where clause (same as regular get)
    const where: any = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (skillLevel) {
      where.skillLevel = skillLevel;
    }

    if (province) {
      where.province = province;
    }

    if (minRating || maxRating) {
      where.eloRating = {};
      if (minRating) where.eloRating.gte = parseInt(minRating as string);
      if (maxRating) where.eloRating.lte = parseInt(maxRating as string);
    }

    // Get all players without pagination for export
    const players = await prisma.player.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        birthYear: true,
        gender: true,
        province: true,
        district: true,
        address: true,
        emergencyContact: true,
        emergencyPhone: true,
        eloRating: true,
        skillLevel: true,
        totalMatches: true,
        wins: true,
        losses: true,
        registrationDate: true,
        createdAt: true
      },
      orderBy: { eloRating: 'desc' }
    });

    // Prepare CSV data
    const csvHeaders = [
      '선수ID',
      '이름', 
      '이메일',
      '전화번호',
      '출생년도',
      '성별',
      '지역',
      '구/군',
      '주소',
      '비상연락처',
      '비상연락처 전화',
      'ELO 레이팅',
      '실력등급',
      '총 경기수',
      '승수',
      '패수',
      '승률(%)',
      '등록일자',
      '생성일시'
    ];

    const csvData = players.map(player => [
      player.id,
      player.name,
      player.email,
      player.phone || '',
      player.birthYear || '',
      player.gender || '',
      player.province || '',
      player.district || '',
      player.address || '',
      player.emergencyContact || '',
      player.emergencyPhone || '',
      player.eloRating || 1200,
      player.skillLevel || '',
      player.totalMatches || 0,
      player.wins || 0,
      player.losses || 0,
      player.totalMatches > 0 ? Math.round((player.wins || 0) / player.totalMatches * 100) : 0,
      player.registrationDate ? new Date(player.registrationDate).toLocaleDateString('ko-KR') : '',
      new Date(player.createdAt).toLocaleDateString('ko-KR')
    ]);

    // Generate CSV
    stringify([csvHeaders, ...csvData], (err, output) => {
      if (err) {
        throw err;
      }

      // Set headers for file download
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `players_${timestamp}.csv`;
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      // Add BOM for proper Korean character display in Excel
      res.write('\uFEFF');
      res.end(output);
    });

  } catch (error) {
    console.error('Export players error:', error);
    res.status(500).json({
      success: false,
      message: '선수 목록 내보내기 중 오류가 발생했습니다.',
      error: 'EXPORT_PLAYERS_ERROR'
    });
  }
});

export default router;