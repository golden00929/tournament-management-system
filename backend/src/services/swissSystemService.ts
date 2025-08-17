import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SwissParticipant {
  id: string;
  name: string;
  eloRating: number;
  points: number; // 승점 (승리=1점, 무승부=0.5점, 패배=0점)
  buchholzScore: number; // 상대방들의 점수 합계
  opponents: string[]; // 이미 대전한 상대방 ID 목록
  matchHistory: SwissMatchResult[];
}

export interface SwissMatchResult {
  roundNumber: number;
  opponentId: string;
  opponentName: string;
  result: 'win' | 'loss' | 'draw';
  points: number;
}

export interface SwissRound {
  roundNumber: number;
  matches: SwissMatch[];
}

export interface SwissMatch {
  player1Id: string;
  player2Id: string;
  player1Name: string;
  player2Name: string;
  player1Rating: number;
  player2Rating: number;
  result?: 'win' | 'loss' | 'draw';
  winnerId?: string;
}

export interface SwissBracket {
  tournamentId: string;
  totalRounds: number;
  currentRound: number;
  participants: SwissParticipant[];
  rounds: SwissRound[];
  fairnessScore: number;
  statistics: {
    averageEloVariance: number;
    balanceScore: number;
    rematchCount: number;
  };
}

export interface SwissSystemConfig {
  allowRematch: boolean; // 재매칭 허용 여부
  maxEloVariance: number; // 최대 ELO 차이
  useBuchholz: boolean; // Buchholz 점수 사용 여부
  preferBalanced: boolean; // 균형잡힌 매칭 우선
}

export class SwissSystemService {
  private static readonly DEFAULT_CONFIG: SwissSystemConfig = {
    allowRematch: false,
    maxEloVariance: 300,
    useBuchholz: true,
    preferBalanced: true
  };

  /**
   * Swiss System에 필요한 라운드 수 계산
   * @param participantCount 참가자 수
   * @returns 라운드 수
   */
  static calculateRounds(participantCount: number): number {
    if (participantCount <= 2) return 1;
    if (participantCount <= 4) return 2;
    if (participantCount <= 8) return 3;
    if (participantCount <= 16) return 4;
    if (participantCount <= 32) return 5;
    if (participantCount <= 64) return 6;
    if (participantCount <= 128) return 7;
    return Math.ceil(Math.log2(participantCount));
  }

  /**
   * Swiss System 대진표 생성
   * @param tournamentId 대회 ID
   * @param config Swiss System 설정
   * @returns Swiss 대진표
   */
  static async generateSwissBracket(
    tournamentId: string, 
    config: Partial<SwissSystemConfig> = {}
  ): Promise<SwissBracket> {
    try {
      const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
      
      // 대회 정보 및 참가자 조회
      const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: {
          participants: {
            where: { approvalStatus: 'approved' },
            include: {
              player: {
                select: {
                  id: true,
                  name: true,
                  eloRating: true
                }
              }
            }
          }
        }
      });

      if (!tournament) {
        throw new Error('대회를 찾을 수 없습니다.');
      }

      if (tournament.participants.length < 4) {
        throw new Error('Swiss System은 최소 4명의 참가자가 필요합니다.');
      }

      // 참가자 초기화
      const participants: SwissParticipant[] = tournament.participants.map(p => ({
        id: p.player.id,
        name: p.player.name,
        eloRating: p.player.eloRating,
        points: 0,
        buchholzScore: 0,
        opponents: [],
        matchHistory: []
      }));

      const totalRounds = this.calculateRounds(participants.length);
      const rounds: SwissRound[] = [];

      // 첫 번째 라운드 생성 (ELO 기반 매칭)
      const firstRound = this.generateFirstRound(participants);
      rounds.push(firstRound);

      // Swiss 대진표 객체 생성
      const swissBracket: SwissBracket = {
        tournamentId,
        totalRounds,
        currentRound: 1,
        participants,
        rounds,
        fairnessScore: 0,
        statistics: {
          averageEloVariance: 0,
          balanceScore: 0,
          rematchCount: 0
        }
      };

      // 공정성 점수 계산
      swissBracket.fairnessScore = this.calculateFairnessScore(swissBracket);
      swissBracket.statistics = this.calculateStatistics(swissBracket);

      return swissBracket;
    } catch (error) {
      console.error('Swiss System 대진표 생성 오류:', error);
      throw error;
    }
  }

  /**
   * 첫 번째 라운드 생성 (ELO 기반 매칭)
   * @param participants 참가자 목록
   * @returns 첫 번째 라운드
   */
  private static generateFirstRound(participants: SwissParticipant[]): SwissRound {
    // ELO 레이팅 순으로 정렬
    const sorted = [...participants].sort((a, b) => b.eloRating - a.eloRating);
    const matches: SwissMatch[] = [];

    // 상위권과 하위권을 섞어서 매칭
    const halfPoint = Math.floor(sorted.length / 2);
    const topHalf = sorted.slice(0, halfPoint);
    const bottomHalf = sorted.slice(halfPoint);

    for (let i = 0; i < topHalf.length; i++) {
      const player1 = topHalf[i];
      const player2 = bottomHalf[i] || bottomHalf[bottomHalf.length - 1 - i];

      if (player2) {
        matches.push({
          player1Id: player1.id,
          player2Id: player2.id,
          player1Name: player1.name,
          player2Name: player2.name,
          player1Rating: player1.eloRating,
          player2Rating: player2.eloRating
        });
      }
    }

    // 홀수 참가자 처리 (부전승)
    if (sorted.length % 2 === 1) {
      const lastPlayer = sorted[sorted.length - 1];
      // 부전승 처리 로직 (실제로는 다음 라운드에서 처리)
    }

    return {
      roundNumber: 1,
      matches
    };
  }

  /**
   * 다음 라운드 생성
   * @param swissBracket 현재 Swiss 대진표
   * @param config Swiss System 설정
   * @returns 다음 라운드
   */
  static generateNextRound(
    swissBracket: SwissBracket, 
    config: Partial<SwissSystemConfig> = {}
  ): SwissRound {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const { participants } = swissBracket;
    const nextRoundNumber = swissBracket.currentRound + 1;

    if (nextRoundNumber > swissBracket.totalRounds) {
      throw new Error('모든 라운드가 완료되었습니다.');
    }

    // 점수별로 그룹화
    const pointGroups = this.groupByPoints(participants);
    const matches: SwissMatch[] = [];

    // 각 점수 그룹 내에서 매칭
    for (const group of pointGroups) {
      const groupMatches = this.matchWithinGroup(group, finalConfig);
      matches.push(...groupMatches);
    }

    return {
      roundNumber: nextRoundNumber,
      matches
    };
  }

  /**
   * 참가자를 점수별로 그룹화
   * @param participants 참가자 목록
   * @returns 점수별 그룹
   */
  private static groupByPoints(participants: SwissParticipant[]): SwissParticipant[][] {
    const groups = new Map<number, SwissParticipant[]>();

    participants.forEach(participant => {
      const points = participant.points;
      if (!groups.has(points)) {
        groups.set(points, []);
      }
      groups.get(points)!.push(participant);
    });

    // 점수 높은 순으로 정렬
    return Array.from(groups.entries())
      .sort(([a], [b]) => b - a)
      .map(([, group]) => group);
  }

  /**
   * 그룹 내 매칭 생성
   * @param group 같은 점수의 참가자 그룹
   * @param config Swiss System 설정
   * @returns 매칭 목록
   */
  private static matchWithinGroup(
    group: SwissParticipant[], 
    config: SwissSystemConfig
  ): SwissMatch[] {
    if (group.length < 2) return [];

    // ELO 레이팅 순으로 정렬
    const sorted = [...group].sort((a, b) => b.eloRating - a.eloRating);
    const matches: SwissMatch[] = [];
    const used = new Set<string>();

    for (let i = 0; i < sorted.length - 1; i++) {
      const player1 = sorted[i];
      if (used.has(player1.id)) continue;

      // 가장 적합한 상대방 찾기
      let bestOpponent: SwissParticipant | null = null;
      let bestScore = -1;

      for (let j = i + 1; j < sorted.length; j++) {
        const player2 = sorted[j];
        if (used.has(player2.id)) continue;

        // 이미 대전한 상대인지 확인
        if (!config.allowRematch && player1.opponents.includes(player2.id)) {
          continue;
        }

        // ELO 차이 확인
        const eloDiff = Math.abs(player1.eloRating - player2.eloRating);
        if (eloDiff > config.maxEloVariance) {
          continue;
        }

        // 매칭 점수 계산 (ELO 차이가 적을수록 좋음)
        const matchScore = 1000 - eloDiff;
        if (matchScore > bestScore) {
          bestScore = matchScore;
          bestOpponent = player2;
        }
      }

      if (bestOpponent) {
        matches.push({
          player1Id: player1.id,
          player2Id: bestOpponent.id,
          player1Name: player1.name,
          player2Name: bestOpponent.name,
          player1Rating: player1.eloRating,
          player2Rating: bestOpponent.eloRating
        });

        used.add(player1.id);
        used.add(bestOpponent.id);
      }
    }

    return matches;
  }

  /**
   * 경기 결과 업데이트
   * @param swissBracket Swiss 대진표
   * @param roundNumber 라운드 번호
   * @param matchResults 경기 결과 목록
   */
  static updateMatchResults(
    swissBracket: SwissBracket,
    roundNumber: number,
    matchResults: { player1Id: string; player2Id: string; winnerId?: string; isDraw?: boolean }[]
  ): void {
    const round = swissBracket.rounds.find(r => r.roundNumber === roundNumber);
    if (!round) {
      throw new Error(`라운드 ${roundNumber}를 찾을 수 없습니다.`);
    }

    matchResults.forEach(result => {
      const match = round.matches.find(
        m => m.player1Id === result.player1Id && m.player2Id === result.player2Id
      );

      if (!match) {
        throw new Error('해당 경기를 찾을 수 없습니다.');
      }

      // 경기 결과 업데이트
      if (result.isDraw) {
        match.result = 'draw';
        this.updateParticipantResult(swissBracket, result.player1Id, result.player2Id, 'draw');
        this.updateParticipantResult(swissBracket, result.player2Id, result.player1Id, 'draw');
      } else if (result.winnerId === result.player1Id) {
        match.result = 'win';
        match.winnerId = result.player1Id;
        this.updateParticipantResult(swissBracket, result.player1Id, result.player2Id, 'win');
        this.updateParticipantResult(swissBracket, result.player2Id, result.player1Id, 'loss');
      } else if (result.winnerId === result.player2Id) {
        match.result = 'loss';
        match.winnerId = result.player2Id;
        this.updateParticipantResult(swissBracket, result.player1Id, result.player2Id, 'loss');
        this.updateParticipantResult(swissBracket, result.player2Id, result.player1Id, 'win');
      }
    });

    // Buchholz 점수 재계산
    this.calculateBuchholzScores(swissBracket);
  }

  /**
   * 참가자 결과 업데이트
   * @param swissBracket Swiss 대진표
   * @param playerId 선수 ID
   * @param opponentId 상대방 ID
   * @param result 경기 결과
   */
  private static updateParticipantResult(
    swissBracket: SwissBracket,
    playerId: string,
    opponentId: string,
    result: 'win' | 'loss' | 'draw'
  ): void {
    const participant = swissBracket.participants.find(p => p.id === playerId);
    const opponent = swissBracket.participants.find(p => p.id === opponentId);

    if (!participant || !opponent) return;

    // 점수 업데이트
    if (result === 'win') {
      participant.points += 1;
    } else if (result === 'draw') {
      participant.points += 0.5;
    }

    // 상대방 목록에 추가
    if (!participant.opponents.includes(opponentId)) {
      participant.opponents.push(opponentId);
    }

    // 경기 이력 추가
    const roundNumber = swissBracket.currentRound;
    participant.matchHistory.push({
      roundNumber,
      opponentId,
      opponentName: opponent.name,
      result,
      points: result === 'win' ? 1 : result === 'draw' ? 0.5 : 0
    });
  }

  /**
   * Buchholz 점수 계산
   * @param swissBracket Swiss 대진표
   */
  private static calculateBuchholzScores(swissBracket: SwissBracket): void {
    swissBracket.participants.forEach(participant => {
      let buchholzScore = 0;
      participant.opponents.forEach(opponentId => {
        const opponent = swissBracket.participants.find(p => p.id === opponentId);
        if (opponent) {
          buchholzScore += opponent.points;
        }
      });
      participant.buchholzScore = buchholzScore;
    });
  }

  /**
   * 대진표 공정성 점수 계산
   * @param swissBracket Swiss 대진표
   * @returns 공정성 점수 (0-100)
   */
  private static calculateFairnessScore(swissBracket: SwissBracket): number {
    if (swissBracket.rounds.length === 0) return 0;

    let totalEloVariance = 0;
    let totalMatches = 0;
    let rematchCount = 0;

    swissBracket.rounds.forEach(round => {
      round.matches.forEach(match => {
        const eloDiff = Math.abs(match.player1Rating - match.player2Rating);
        totalEloVariance += eloDiff;
        totalMatches++;

        // 재매칭 확인
        const player1 = swissBracket.participants.find(p => p.id === match.player1Id);
        if (player1 && player1.opponents.includes(match.player2Id)) {
          rematchCount++;
        }
      });
    });

    const averageEloVariance = totalMatches > 0 ? totalEloVariance / totalMatches : 0;
    
    // 공정성 점수 계산 (낮은 ELO 차이와 적은 재매칭이 좋음)
    const eloScore = Math.max(0, 100 - (averageEloVariance / 5)); // 500점 차이면 0점
    const rematchPenalty = rematchCount * 10; // 재매칭당 10점 감점
    
    return Math.max(0, Math.min(100, eloScore - rematchPenalty));
  }

  /**
   * 통계 계산
   * @param swissBracket Swiss 대진표
   * @returns 통계 정보
   */
  private static calculateStatistics(swissBracket: SwissBracket) {
    let totalEloVariance = 0;
    let totalMatches = 0;
    let rematchCount = 0;

    swissBracket.rounds.forEach(round => {
      round.matches.forEach(match => {
        const eloDiff = Math.abs(match.player1Rating - match.player2Rating);
        totalEloVariance += eloDiff;
        totalMatches++;

        // 재매칭 확인
        const player1 = swissBracket.participants.find(p => p.id === match.player1Id);
        if (player1 && player1.opponents.includes(match.player2Id)) {
          rematchCount++;
        }
      });
    });

    const averageEloVariance = totalMatches > 0 ? totalEloVariance / totalMatches : 0;
    const balanceScore = totalMatches > 0 ? 100 - Math.min(100, averageEloVariance / 10) : 0;

    return {
      averageEloVariance: Math.round(averageEloVariance),
      balanceScore: Math.round(balanceScore),
      rematchCount
    };
  }

  /**
   * Swiss System 시뮬레이션 실행
   * @param tournamentId 대회 ID
   * @param simulationCount 시뮬레이션 횟수
   * @returns 시뮬레이션 결과
   */
  static async runSimulation(tournamentId: string, simulationCount: number = 10) {
    const results = [];

    for (let i = 0; i < simulationCount; i++) {
      try {
        const bracket = await this.generateSwissBracket(tournamentId);
        results.push({
          simulation: i + 1,
          fairnessScore: bracket.fairnessScore,
          statistics: bracket.statistics
        });
      } catch (error) {
        console.error(`시뮬레이션 ${i + 1} 실패:`, error);
      }
    }

    if (results.length === 0) {
      throw new Error('모든 시뮬레이션이 실패했습니다.');
    }

    // 평균값 계산
    const averages = {
      fairnessScore: results.reduce((sum, r) => sum + r.fairnessScore, 0) / results.length,
      averageEloVariance: results.reduce((sum, r) => sum + r.statistics.averageEloVariance, 0) / results.length,
      balanceScore: results.reduce((sum, r) => sum + r.statistics.balanceScore, 0) / results.length,
      rematchCount: results.reduce((sum, r) => sum + r.statistics.rematchCount, 0) / results.length
    };

    return {
      simulationCount: results.length,
      results,
      averages: {
        fairnessScore: Math.round(averages.fairnessScore * 100) / 100,
        averageEloVariance: Math.round(averages.averageEloVariance),
        balanceScore: Math.round(averages.balanceScore),
        rematchCount: Math.round(averages.rematchCount * 100) / 100
      }
    };
  }

  /**
   * 최종 순위 계산
   * @param swissBracket Swiss 대진표
   * @returns 순위별 참가자 목록
   */
  static calculateFinalRanking(swissBracket: SwissBracket): SwissParticipant[] {
    return [...swissBracket.participants].sort((a, b) => {
      // 1순위: 점수
      if (a.points !== b.points) {
        return b.points - a.points;
      }
      
      // 2순위: Buchholz 점수
      if (a.buchholzScore !== b.buchholzScore) {
        return b.buchholzScore - a.buchholzScore;
      }
      
      // 3순위: ELO 레이팅
      return b.eloRating - a.eloRating;
    });
  }
}

export default SwissSystemService;