import { prisma } from '../config/database';
import { AdvancedEloService } from './advancedEloService';

interface EloCalculationResult {
  player1NewRating: number;
  player2NewRating: number;
  player1Change: number;
  player2Change: number;
}

interface Player {
  id: string;
  eloRating: number;
  totalMatches: number;
  wins: number;
  losses: number;
}

export class EloRatingService {
  private static readonly K_FACTOR = parseInt(process.env.ELO_K_FACTOR || '32');
  private static readonly MIN_RATING = parseInt(process.env.MIN_ELO_RATING || '100');
  private static readonly MAX_RATING = parseInt(process.env.MAX_ELO_RATING || '4000');

  /**
   * Calculate new ELO ratings after a match
   */
  static calculateNewRatings(
    player1: Player,
    player2: Player,
    player1Won: boolean
  ): EloCalculationResult {
    const rating1 = player1.eloRating;
    const rating2 = player2.eloRating;

    // Calculate expected scores
    const expected1 = this.getExpectedScore(rating1, rating2);
    const expected2 = this.getExpectedScore(rating2, rating1);

    // Actual scores (1 for win, 0 for loss)
    const actual1 = player1Won ? 1 : 0;
    const actual2 = player1Won ? 0 : 1;

    // Dynamic K-factor based on player experience and rating
    const k1 = this.getDynamicKFactor(player1);
    const k2 = this.getDynamicKFactor(player2);

    // Calculate rating changes
    const change1 = Math.round(k1 * (actual1 - expected1));
    const change2 = Math.round(k2 * (actual2 - expected2));

    // Apply rating changes with bounds
    const newRating1 = Math.max(
      this.MIN_RATING,
      Math.min(this.MAX_RATING, rating1 + change1)
    );
    const newRating2 = Math.max(
      this.MIN_RATING,
      Math.min(this.MAX_RATING, rating2 + change2)
    );

    return {
      player1NewRating: newRating1,
      player2NewRating: newRating2,
      player1Change: newRating1 - rating1,
      player2Change: newRating2 - rating2,
    };
  }

  /**
   * Get expected score for a player against another
   */
  private static getExpectedScore(playerRating: number, opponentRating: number): number {
    return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  }

  /**
   * Get dynamic K-factor based on player experience and rating
   * Now uses AdvancedEloService for more sophisticated calculation
   */
  private static getDynamicKFactor(player: Player): number {
    return AdvancedEloService.calculateDynamicKFactor(player.totalMatches, player.eloRating);
  }

  /**
   * Update player ratings after a match
   */
  static async updatePlayerRatings(
    player1Id: string,
    player2Id: string,
    player1Won: boolean,
    matchId?: string
  ): Promise<EloCalculationResult> {
    // Get current player data
    const [player1, player2] = await Promise.all([
      prisma.player.findUnique({
        where: { id: player1Id },
        select: {
          id: true,
          eloRating: true,
          totalMatches: true,
          wins: true,
          losses: true,
        },
      }),
      prisma.player.findUnique({
        where: { id: player2Id },
        select: {
          id: true,
          eloRating: true,
          totalMatches: true,
          wins: true,
          losses: true,
        },
      }),
    ]);

    if (!player1 || !player2) {
      throw new Error('Player not found');
    }

    // Calculate new ratings
    const result = this.calculateNewRatings(player1, player2, player1Won);

    // Update players in database
    const updatePromises = [
      // Update player 1
      prisma.player.update({
        where: { id: player1Id },
        data: {
          eloRating: result.player1NewRating,
          totalMatches: { increment: 1 },
          wins: player1Won ? { increment: 1 } : undefined,
          losses: !player1Won ? { increment: 1 } : undefined,
          lastMatchDate: new Date(),
          skillLevel: this.getSkillLevel(result.player1NewRating),
          confidenceIndex: this.calculateConfidenceIndex(
            player1.totalMatches + 1,
            result.player1NewRating
          ),
        },
      }),
      // Update player 2
      prisma.player.update({
        where: { id: player2Id },
        data: {
          eloRating: result.player2NewRating,
          totalMatches: { increment: 1 },
          wins: !player1Won ? { increment: 1 } : undefined,
          losses: player1Won ? { increment: 1 } : undefined,
          lastMatchDate: new Date(),
          skillLevel: this.getSkillLevel(result.player2NewRating),
          confidenceIndex: this.calculateConfidenceIndex(
            player2.totalMatches + 1,
            result.player2NewRating
          ),
        },
      }),
      // Record rating history for player 1
      prisma.playerRatingHistory.create({
        data: {
          playerId: player1Id,
          oldRating: player1.eloRating,
          newRating: result.player1NewRating,
          ratingChange: result.player1Change,
          matchId,
          reason: 'match_result',
        },
      }),
      // Record rating history for player 2
      prisma.playerRatingHistory.create({
        data: {
          playerId: player2Id,
          oldRating: player2.eloRating,
          newRating: result.player2NewRating,
          ratingChange: result.player2Change,
          matchId,
          reason: 'match_result',
        },
      }),
    ];

    await Promise.all(updatePromises);

    // Update performance metrics using AdvancedEloService
    try {
      await Promise.all([
        AdvancedEloService.updatePlayerPerformanceMetrics(player1Id),
        AdvancedEloService.updatePlayerPerformanceMetrics(player2Id)
      ]);
    } catch (error) {
      console.error('성능 지수 업데이트 오류:', error);
      // 성능 지수 업데이트 실패해도 메인 로직은 계속 진행
    }

    return result;
  }

  /**
   * Get skill level based on ELO rating
   */
  static getSkillLevel(rating: number): string {
    if (rating >= 2500) return 'a_class';  // Expert -> A Class
    if (rating >= 2000) return 'b_class';  // Advanced -> B Class  
    if (rating >= 1500) return 'c_class';  // Intermediate -> C Class
    return 'd_class';  // Beginner -> D Class
  }

  /**
   * Calculate confidence index based on matches played and rating
   */
  private static calculateConfidenceIndex(totalMatches: number, rating: number): number {
    // Base confidence from number of matches (0-1 scale)
    let confidence = Math.min(totalMatches / 50, 1.0); // Max confidence at 50 matches

    // Adjust for rating extremes (less confident for very high or very low ratings)
    if (rating < 800 || rating > 3200) {
      confidence *= 0.8;
    }

    return Math.round(confidence * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Get players within rating range for balanced matchmaking
   */
  static async getPlayersInRatingRange(
    targetRating: number,
    maxDifference: number = 200,
    excludePlayerIds: string[] = [],
    limit: number = 20
  ) {
    const minRating = Math.max(this.MIN_RATING, targetRating - maxDifference);
    const maxRating = Math.min(this.MAX_RATING, targetRating + maxDifference);

    return prisma.player.findMany({
      where: {
        eloRating: {
          gte: minRating,
          lte: maxRating,
        },
        id: {
          notIn: excludePlayerIds,
        },
        isActive: true,
      },
      orderBy: [
        // Prioritize players closer to target rating
        {
          eloRating: targetRating > 1800 ? 'desc' : 'asc',
        },
      ],
      take: limit,
    });
  }

  /**
   * Recalculate all player ratings (for system maintenance)
   */
  static async recalculateAllRatings(): Promise<void> {
    // This would be a complex operation to recalculate based on match history
    // Implementation would depend on specific requirements
    console.log('Rating recalculation not implemented yet');
  }
}