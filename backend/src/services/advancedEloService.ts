import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PlayerPerformanceMetrics {
  consistencyIndex: number;
  momentumScore: number;
  performanceIndex: number;
}

export interface HeadToHeadStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  recentMatches: number; // 최근 3개월
}

export class AdvancedEloService {
  /**
   * 동적 K-Factor 계산
   * @param totalMatches 총 경기 수
   * @param currentElo 현재 ELO 레이팅
   * @returns K-Factor 값
   */
  static calculateDynamicKFactor(totalMatches: number, currentElo: number): number {
    // 마스터급 선수 (ELO 2400+)
    if (currentElo >= 2400) {
      return 10;
    }
    
    // 신규 선수 (경기 10회 미만)
    if (totalMatches < 10) {
      return 40;
    }
    
    // 초보 선수 (경기 10-30회)
    if (totalMatches >= 10 && totalMatches <= 30) {
      return 30;
    }
    
    // 일반 선수
    return 20;
  }

  /**
   * 선수의 일관성 지수 계산 (최근 10경기 점수 표준편차 기반)
   * @param playerId 선수 ID
   * @returns 일관성 지수 (0-1, 높을수록 일관성 있음)
   */
  static async calculateConsistencyIndex(playerId: string): Promise<number> {
    try {
      // 최근 10경기의 ELO 변화량 조회
      const recentMatches = await prisma.match.findMany({
        where: {
          OR: [
            { player1Id: playerId },
            { player2Id: playerId }
          ],
          status: 'completed'
        },
        orderBy: {
          actualEndTime: 'desc'
        },
        take: 10,
        select: {
          player1Id: true,
          player2Id: true,
          player1EloChange: true,
          player2EloChange: true
        }
      });

      if (recentMatches.length < 3) {
        return 1.0; // 경기 수가 적으면 기본값
      }

      // 해당 선수의 ELO 변화량 추출
      const eloChanges = recentMatches.map(match => {
        return match.player1Id === playerId 
          ? (match.player1EloChange || 0)
          : (match.player2EloChange || 0);
      });

      // 표준편차 계산
      const mean = eloChanges.reduce((sum, change) => sum + change, 0) / eloChanges.length;
      const variance = eloChanges.reduce((sum, change) => sum + Math.pow(change - mean, 2), 0) / eloChanges.length;
      const standardDeviation = Math.sqrt(variance);

      // 표준편차를 0-1 범위로 정규화 (표준편차가 클수록 일관성이 낮음)
      // 최대 표준편차를 50으로 가정하고 역수로 계산
      const normalizedConsistency = Math.max(0, 1 - (standardDeviation / 50));
      
      return Math.round(normalizedConsistency * 1000) / 1000; // 소수점 3자리
    } catch (error) {
      console.error('일관성 지수 계산 오류:', error);
      return 1.0;
    }
  }

  /**
   * 선수의 모멘텀 점수 계산 (최근 5경기 가중 평균)
   * @param playerId 선수 ID
   * @returns 모멘텀 점수
   */
  static async calculateMomentumScore(playerId: string): Promise<number> {
    try {
      // 최근 5경기 조회
      const recentMatches = await prisma.match.findMany({
        where: {
          OR: [
            { player1Id: playerId },
            { player2Id: playerId }
          ],
          status: 'completed'
        },
        orderBy: {
          actualEndTime: 'desc'
        },
        take: 5,
        select: {
          player1Id: true,
          player2Id: true,
          winnerId: true,
          player1EloChange: true,
          player2EloChange: true,
          actualEndTime: true
        }
      });

      if (recentMatches.length === 0) {
        return 0; // 경기가 없으면 모멘텀 없음
      }

      let weightedSum = 0;
      let totalWeight = 0;

      recentMatches.forEach((match, index) => {
        const isPlayer1 = match.player1Id === playerId;
        const isWinner = match.winnerId === playerId;
        const eloChange = isPlayer1 ? (match.player1EloChange || 0) : (match.player2EloChange || 0);
        
        // 가중치: 최근 경기일수록 높음 (5, 4, 3, 2, 1)
        const weight = 5 - index;
        
        // 승리 보너스와 ELO 변화량을 결합
        const performanceScore = eloChange + (isWinner ? 10 : -5);
        
        weightedSum += performanceScore * weight;
        totalWeight += weight;
      });

      const momentum = totalWeight > 0 ? weightedSum / totalWeight : 0;
      
      return Math.round(momentum * 100) / 100; // 소수점 2자리
    } catch (error) {
      console.error('모멘텀 점수 계산 오류:', error);
      return 0;
    }
  }

  /**
   * 선수의 종합 성능 지수 계산
   * @param playerId 선수 ID
   * @returns 성능 메트릭스
   */
  static async calculatePerformanceMetrics(playerId: string): Promise<PlayerPerformanceMetrics> {
    try {
      // 현재 선수 정보 조회
      const player = await prisma.player.findUnique({
        where: { id: playerId },
        select: { eloRating: true }
      });

      if (!player) {
        throw new Error('선수를 찾을 수 없습니다.');
      }

      // 각 지수 계산
      const consistencyIndex = await this.calculateConsistencyIndex(playerId);
      const momentumScore = await this.calculateMomentumScore(playerId);
      
      // 종합 성능 지수 계산
      const performanceIndex = player.eloRating + (momentumScore * 0.2) + (consistencyIndex * 100 * 0.1);

      return {
        consistencyIndex,
        momentumScore,
        performanceIndex: Math.round(performanceIndex)
      };
    } catch (error) {
      console.error('성능 지수 계산 오류:', error);
      return {
        consistencyIndex: 1.0,
        momentumScore: 0,
        performanceIndex: 1200
      };
    }
  }

  /**
   * 두 선수 간의 상대 전적 분석
   * @param player1Id 선수1 ID
   * @param player2Id 선수2 ID
   * @returns Head-to-Head 통계
   */
  static async getHeadToHeadStats(player1Id: string, player2Id: string): Promise<HeadToHeadStats> {
    try {
      // 전체 상대 전적 조회
      const allMatches = await prisma.match.findMany({
        where: {
          OR: [
            { player1Id: player1Id, player2Id: player2Id },
            { player1Id: player2Id, player2Id: player1Id }
          ],
          status: 'completed'
        },
        select: {
          winnerId: true,
          actualEndTime: true
        }
      });

      // 최근 3개월 날짜 계산
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      // 최근 3개월 경기 필터링
      const recentMatches = allMatches.filter(match => 
        match.actualEndTime && new Date(match.actualEndTime) >= threeMonthsAgo
      );

      // player1 기준으로 승수 계산
      const totalWins = allMatches.filter(match => match.winnerId === player1Id).length;
      const totalMatches = allMatches.length;
      const winRate = totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0;

      return {
        totalMatches,
        wins: totalWins,
        losses: totalMatches - totalWins,
        winRate: Math.round(winRate * 100) / 100,
        recentMatches: recentMatches.length
      };
    } catch (error) {
      console.error('상대 전적 분석 오류:', error);
      return {
        totalMatches: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        recentMatches: 0
      };
    }
  }

  /**
   * 선수의 성능 지수를 데이터베이스에 업데이트
   * @param playerId 선수 ID
   */
  static async updatePlayerPerformanceMetrics(playerId: string): Promise<void> {
    try {
      const metrics = await this.calculatePerformanceMetrics(playerId);
      
      await prisma.player.update({
        where: { id: playerId },
        data: {
          consistencyIndex: metrics.consistencyIndex,
          momentumScore: metrics.momentumScore,
          performanceIndex: metrics.performanceIndex,
          lastFormUpdate: new Date()
        }
      });
    } catch (error) {
      console.error('선수 성능 지수 업데이트 오류:', error);
      throw error;
    }
  }

  /**
   * 모든 활성 선수의 성능 지수 일괄 업데이트
   */
  static async updateAllPlayersPerformance(): Promise<void> {
    try {
      const players = await prisma.player.findMany({
        where: {
          totalMatches: { gt: 0 } // 경기 경험이 있는 선수만
        },
        select: { id: true }
      });

      for (const player of players) {
        await this.updatePlayerPerformanceMetrics(player.id);
        // API 과부하 방지를 위한 짧은 지연
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      console.log(`${players.length}명 선수의 성능 지수 업데이트 완료`);
    } catch (error) {
      console.error('전체 선수 성능 지수 업데이트 오류:', error);
      throw error;
    }
  }

  /**
   * 선수의 예상 매치 결과 예측
   * @param player1Id 선수1 ID
   * @param player2Id 선수2 ID
   * @returns 선수1의 승률 예측
   */
  static async predictMatchOutcome(player1Id: string, player2Id: string): Promise<number> {
    try {
      // 두 선수의 성능 지수 조회
      const [player1, player2] = await Promise.all([
        prisma.player.findUnique({
          where: { id: player1Id },
          select: { 
            performanceIndex: true, 
            eloRating: true,
            momentumScore: true,
            consistencyIndex: true
          }
        }),
        prisma.player.findUnique({
          where: { id: player2Id },
          select: { 
            performanceIndex: true, 
            eloRating: true,
            momentumScore: true,
            consistencyIndex: true
          }
        })
      ]);

      if (!player1 || !player2) {
        throw new Error('선수 정보를 찾을 수 없습니다.');
      }

      // 상대 전적 고려
      const h2hStats = await this.getHeadToHeadStats(player1Id, player2Id);
      
      // 기본 ELO 기반 승률 계산
      const ratingDiff = player1.eloRating - player2.eloRating;
      const basicWinProbability = 1 / (1 + Math.pow(10, -ratingDiff / 400));
      
      // 성능 지수 차이 반영
      const performanceDiff = (player1.performanceIndex || player1.eloRating) - 
                             (player2.performanceIndex || player2.eloRating);
      const performanceAdjustment = performanceDiff / 2000; // 정규화
      
      // 모멘텀 차이 반영
      const momentumDiff = (player1.momentumScore || 0) - (player2.momentumScore || 0);
      const momentumAdjustment = momentumDiff / 100;
      
      // 상대 전적 반영 (최근 5경기 이상인 경우만)
      let h2hAdjustment = 0;
      if (h2hStats.totalMatches >= 5) {
        h2hAdjustment = (h2hStats.winRate - 50) / 500; // -0.1 ~ 0.1 범위
      }
      
      // 최종 승률 계산 (각 요소별 가중치 적용)
      let finalWinProbability = basicWinProbability + 
                               (performanceAdjustment * 0.1) + 
                               (momentumAdjustment * 0.05) + 
                               (h2hAdjustment * 0.05);
      
      // 0-1 범위로 제한
      finalWinProbability = Math.max(0.05, Math.min(0.95, finalWinProbability));
      
      return Math.round(finalWinProbability * 10000) / 100; // 백분율로 반환
    } catch (error) {
      console.error('경기 결과 예측 오류:', error);
      return 50; // 오류 시 50% 반환
    }
  }
}

export default AdvancedEloService;