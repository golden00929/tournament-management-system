import { prisma } from '../config/database';

interface ScheduleParameters {
  tournamentId: string;
  startTime: string; // 대회 시작 시간
  courtCount: number; // 사용 가능한 코트 수
  matchDuration: number; // 경기당 예상 소요 시간 (분)
  restBetweenMatches: number; // 경기 간 휴식 시간 (분)
  courtChangeDuration: number; // 코트 정리 시간 (분)
}

interface MatchWithSchedule {
  id: string;
  matchNumber: number;
  roundName: string;
  player1Id?: string;
  player2Id?: string;
  priority: number; // 라운드 우선순위
}

export class AISchedulingService {
  /**
   * AI 기반 자동 일정 생성
   */
  static async generateOptimalSchedule(params: ScheduleParameters): Promise<{
    success: boolean;
    message: string;
    data: {
      totalMatches: number;
      scheduledMatches: number;
      estimatedDuration: number;
      schedule: Array<{
        matchId: string;
        courtNumber: number;
        scheduledTime: string;
        estimatedEndTime: string;
      }>;
    };
  }> {
    try {
      // 1. 대회의 모든 경기를 가져옵니다 (pending 또는 scheduled 상태)
      const matches = await prisma.match.findMany({
        where: { 
          tournamentId: params.tournamentId,
          status: { in: ['pending', 'scheduled'] } // 대기중이거나 예정된 경기
        },
        orderBy: [
          { roundName: 'asc' },
          { matchNumber: 'asc' }
        ]
      });

      if (matches.length === 0) {
        return {
          success: false,
          message: '일정을 배정할 경기가 없습니다.',
          data: { totalMatches: 0, scheduledMatches: 0, estimatedDuration: 0, schedule: [] }
        };
      }

      // 2. 라운드별 우선순위를 계산합니다
      const matchesWithPriority = this.calculateRoundPriorities(matches);
      
      // 3. AI 알고리즘으로 최적 일정을 계산합니다
      const schedule = this.optimizeSchedule(matchesWithPriority, params);
      
      // 4. 데이터베이스에 일정을 저장합니다
      const updatePromises = schedule.map(item => 
        prisma.match.update({
          where: { id: item.matchId },
          data: {
            courtNumber: item.courtNumber,
            scheduledTime: new Date(item.scheduledTime),
            status: 'scheduled', // 상태를 scheduled로 변경
            notes: `AI 자동 배정 - 예상 종료: ${new Date(item.estimatedEndTime).toLocaleTimeString('ko-KR')}`
          }
        })
      );

      await Promise.all(updatePromises);

      // 5. 통계 계산
      const totalDuration = this.calculateTotalDuration(schedule, params);

      return {
        success: true,
        message: `${schedule.length}개 경기의 일정이 자동으로 배정되었습니다.`,
        data: {
          totalMatches: matches.length,
          scheduledMatches: schedule.length,
          estimatedDuration: totalDuration,
          schedule
        }
      };

    } catch (error) {
      console.error('AI 일정 생성 오류:', error);
      throw error;
    }
  }

  /**
   * 라운드별 우선순위 계산
   */
  private static calculateRoundPriorities(matches: any[]): MatchWithSchedule[] {
    const roundPriorities: { [key: string]: number } = {
      'Group': 1,      // 그룹전이 가장 먼저
      'Quarter': 2,    // 8강
      'Semi': 3,       // 4강  
      'Final': 4,      // 결승
      'Third': 3.5     // 3-4위전
    };

    return matches.map(match => ({
      id: match.id,
      matchNumber: match.matchNumber,
      roundName: match.roundName,
      player1Id: match.player1Id,
      player2Id: match.player2Id,
      priority: this.getRoundPriority(match.roundName, roundPriorities)
    }));
  }

  /**
   * 라운드명에서 우선순위 추출
   */
  private static getRoundPriority(roundName: string, priorities: { [key: string]: number }): number {
    for (const [key, priority] of Object.entries(priorities)) {
      if (roundName.includes(key)) {
        return priority;
      }
    }
    return 1; // 기본값 (그룹전 수준)
  }

  /**
   * 🤖 AI 최적화 알고리즘
   */
  private static optimizeSchedule(
    matches: MatchWithSchedule[], 
    params: ScheduleParameters
  ): Array<{
    matchId: string;
    courtNumber: number;
    scheduledTime: string;
    estimatedEndTime: string;
  }> {
    const schedule: Array<{
      matchId: string;
      courtNumber: number;
      scheduledTime: string;
      estimatedEndTime: string;
    }> = [];

    // 코트별 마지막 경기 종료 시간 추적
    const courtLastEndTime: { [courtNumber: number]: Date } = {};
    
    // 선수별 마지막 경기 종료 시간 추적 (휴식 시간 보장)
    const playerLastEndTime: { [playerId: string]: Date } = {};

    const startTime = new Date(params.startTime);

    // 우선순위별로 정렬 (그룹전 → 토너먼트 순)
    const sortedMatches = matches.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.matchNumber - b.matchNumber;
    });

    for (const match of sortedMatches) {
      const bestSlot = this.findBestTimeSlot(
        match,
        params,
        courtLastEndTime,
        playerLastEndTime,
        startTime
      );

      schedule.push({
        matchId: match.id,
        courtNumber: bestSlot.courtNumber,
        scheduledTime: bestSlot.startTime.toISOString(),
        estimatedEndTime: bestSlot.endTime.toISOString()
      });

      // 상태 업데이트
      courtLastEndTime[bestSlot.courtNumber] = new Date(
        bestSlot.endTime.getTime() + params.courtChangeDuration * 60000
      );

      // 선수 휴식 시간 업데이트
      if (match.player1Id) {
        playerLastEndTime[match.player1Id] = new Date(
          bestSlot.endTime.getTime() + params.restBetweenMatches * 60000
        );
      }
      if (match.player2Id) {
        playerLastEndTime[match.player2Id] = new Date(
          bestSlot.endTime.getTime() + params.restBetweenMatches * 60000
        );
      }
    }

    return schedule;
  }

  /**
   * 🎯 최적의 시간대 찾기 (AI 핵심 로직)
   */
  private static findBestTimeSlot(
    match: MatchWithSchedule,
    params: ScheduleParameters,
    courtLastEndTime: { [courtNumber: number]: Date },
    playerLastEndTime: { [playerId: string]: Date },
    globalStartTime: Date
  ): { courtNumber: number; startTime: Date; endTime: Date } {
    let bestCourt = 1;
    let bestStartTime = globalStartTime;

    // 선수들의 최소 대기 시간 계산
    const playerConstraints = [match.player1Id, match.player2Id]
      .filter(Boolean)
      .map(playerId => playerLastEndTime[playerId] || globalStartTime);
    
    const minPlayerAvailableTime = new Date(Math.max(
      ...playerConstraints.map(date => date.getTime()),
      globalStartTime.getTime()
    ));

    // 각 코트별로 최적 시간 계산
    for (let court = 1; court <= params.courtCount; court++) {
      const courtAvailableTime = courtLastEndTime[court] || globalStartTime;
      
      // 코트 사용 가능 시간과 선수 대기 시간 중 늦은 시간 선택
      const candidateStartTime = new Date(Math.max(
        courtAvailableTime.getTime(),
        minPlayerAvailableTime.getTime()
      ));

      // 첫 번째 코트이거나 더 빠른 시간에 시작할 수 있으면 선택
      if (court === 1 || candidateStartTime < bestStartTime) {
        bestCourt = court;
        bestStartTime = candidateStartTime;
      }
    }

    const endTime = new Date(bestStartTime.getTime() + params.matchDuration * 60000);

    return {
      courtNumber: bestCourt,
      startTime: bestStartTime,
      endTime
    };
  }

  /**
   * 전체 대회 소요 시간 계산
   */
  private static calculateTotalDuration(
    schedule: Array<{ estimatedEndTime: string }>,
    params: ScheduleParameters
  ): number {
    if (schedule.length === 0) return 0;

    const startTime = new Date(params.startTime);
    const lastEndTime = new Date(Math.max(
      ...schedule.map(item => new Date(item.estimatedEndTime).getTime())
    ));

    return Math.round((lastEndTime.getTime() - startTime.getTime()) / (1000 * 60)); // 분 단위
  }

  /**
   * 일정 충돌 검사
   */
  static async validateSchedule(tournamentId: string): Promise<{
    conflicts: Array<{
      type: 'court' | 'player';
      description: string;
      matches: string[];
    }>;
    isValid: boolean;
  }> {
    const matches = await prisma.match.findMany({
      where: { 
        tournamentId,
        courtNumber: { not: null },
        scheduledTime: { not: null }
      },
      orderBy: { scheduledTime: 'asc' }
    });

    const conflicts: Array<{
      type: 'court' | 'player';
      description: string;
      matches: string[];
    }> = [];

    // 코트 충돌 검사
    this.checkCourtConflicts(matches, conflicts);
    
    // 선수 충돌 검사  
    this.checkPlayerConflicts(matches, conflicts);

    return {
      conflicts,
      isValid: conflicts.length === 0
    };
  }

  private static checkCourtConflicts(matches: any[], conflicts: any[]) {
    for (let i = 0; i < matches.length; i++) {
      for (let j = i + 1; j < matches.length; j++) {
        const match1 = matches[i];
        const match2 = matches[j];

        if (match1.courtNumber === match2.courtNumber) {
          const start1 = new Date(match1.scheduledTime);
          const start2 = new Date(match2.scheduledTime);
          const end1 = new Date(start1.getTime() + 60 * 60000); // 1시간 가정
          const end2 = new Date(start2.getTime() + 60 * 60000);

          // 시간 겹침 검사
          if ((start1 < end2) && (start2 < end1)) {
            conflicts.push({
              type: 'court',
              description: `코트 ${match1.courtNumber} 시간 충돌`,
              matches: [match1.id, match2.id]
            });
          }
        }
      }
    }
  }

  private static checkPlayerConflicts(matches: any[], conflicts: any[]) {
    for (let i = 0; i < matches.length; i++) {
      for (let j = i + 1; j < matches.length; j++) {
        const match1 = matches[i];
        const match2 = matches[j];

        // 공통 선수 확인
        const commonPlayers = [
          match1.player1Id === match2.player1Id && match1.player1Id,
          match1.player1Id === match2.player2Id && match1.player1Id,
          match1.player2Id === match2.player1Id && match1.player2Id,
          match1.player2Id === match2.player2Id && match1.player2Id
        ].filter(Boolean);

        if (commonPlayers.length > 0) {
          const start1 = new Date(match1.scheduledTime);
          const start2 = new Date(match2.scheduledTime);
          const gap = Math.abs(start2.getTime() - start1.getTime()) / (1000 * 60);

          if (gap < 120) { // 2시간 미만이면 충돌로 간주
            conflicts.push({
              type: 'player',
              description: `선수 연속 경기 (간격: ${Math.round(gap)}분)`,
              matches: [match1.id, match2.id]
            });
          }
        }
      }
    }
  }
}