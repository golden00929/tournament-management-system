/**
 * Fallback Scheduler Service
 * Provides robust scheduling algorithms when OpenAI API is unavailable
 * Part of the OpenAI API failure fallback enhancement system
 */

export interface FallbackScheduleResult {
  success: boolean;
  schedule: any[];
  algorithm: string;
  aiInsights: string;
  warnings: string[];
  optimizationScore: number;
  executionTime: number;
  fallbackReason?: string;
}

export interface ScheduleConstraints {
  totalCourts: number;
  courtNames: string[];
  startTime: string;
  endTime: string;
  lunchBreakStart: string;
  lunchBreakEnd: string;
  matchDuration: number;
  breakBetweenMatches: number;
  maxConsecutiveMatches: number;
  restDuration: number;
}

export interface Match {
  id: string;
  player1Id: string;
  player2Id: string;
  player1Name: string;
  player2Name: string;
  roundName: string;
  estimatedDuration: number;
}

export class FallbackSchedulerService {
  /**
   * Generate schedule using local algorithms when OpenAI fails
   */
  static async generateFallbackSchedule(
    tournamentId: string,
    constraints: ScheduleConstraints,
    matches: Match[],
    fallbackReason: string = 'OpenAI API unavailable'
  ): Promise<FallbackScheduleResult> {
    const startTime = performance.now();

    try {
      console.log(`🔄 Generating fallback schedule for tournament ${tournamentId}`);
      console.log(`📊 Algorithm: Local Round-Robin with Court Balancing`);
      console.log(`🚫 Reason: ${fallbackReason}`);

      // Choose best available algorithm based on tournament size
      const algorithm = this.selectOptimalAlgorithm(matches.length, constraints.totalCourts);
      
      let schedule: any[];
      let insights: string;
      let warnings: string[] = [];
      let optimizationScore: number;

      switch (algorithm) {
        case 'balanced-round-robin':
          ({ schedule, insights, warnings, optimizationScore } = 
            await this.generateBalancedRoundRobin(matches, constraints));
          break;
        
        case 'time-optimized':
          ({ schedule, insights, warnings, optimizationScore } = 
            await this.generateTimeOptimizedSchedule(matches, constraints));
          break;
        
        case 'court-balanced':
          ({ schedule, insights, warnings, optimizationScore } = 
            await this.generateCourtBalancedSchedule(matches, constraints));
          break;
        
        default:
          ({ schedule, insights, warnings, optimizationScore } = 
            await this.generateBasicSchedule(matches, constraints));
      }

      const executionTime = performance.now() - startTime;

      console.log(`✅ Fallback schedule generated in ${executionTime.toFixed(2)}ms`);
      console.log(`📈 Optimization score: ${optimizationScore}/100`);

      return {
        success: true,
        schedule,
        algorithm,
        aiInsights: insights,
        warnings,
        optimizationScore,
        executionTime,
        fallbackReason
      };

    } catch (error) {
      console.error('❌ Fallback schedule generation failed:', error);
      
      return {
        success: false,
        schedule: [],
        algorithm: 'failed',
        aiInsights: 'Fallback 스케줄 생성에 실패했습니다.',
        warnings: ['Fallback 알고리즘 실행 중 오류가 발생했습니다.'],
        optimizationScore: 0,
        executionTime: performance.now() - startTime,
        fallbackReason
      };
    }
  }

  /**
   * Select optimal algorithm based on tournament characteristics
   */
  private static selectOptimalAlgorithm(matchCount: number, courtCount: number): string {
    if (matchCount <= 16) {
      return 'balanced-round-robin';
    } else if (matchCount <= 64) {
      return 'time-optimized';
    } else if (courtCount >= 4) {
      return 'court-balanced';
    } else {
      return 'basic';
    }
  }

  /**
   * Generate balanced round-robin schedule (optimal for small tournaments)
   */
  private static async generateBalancedRoundRobin(
    matches: Match[],
    constraints: ScheduleConstraints
  ): Promise<{
    schedule: any[];
    insights: string;
    warnings: string[];
    optimizationScore: number;
  }> {
    const schedule: any[] = [];
    const warnings: string[] = [];
    
    // Calculate time slots
    const timeSlots = this.generateTimeSlots(constraints);
    
    // Balance matches across courts
    let matchIndex = 0;
    let currentCourtIndex = 0;
    
    for (const timeSlot of timeSlots) {
      if (matchIndex >= matches.length) break;
      
      const match = matches[matchIndex];
      const courtId = (currentCourtIndex % constraints.totalCourts) + 1;
      const courtName = constraints.courtNames[currentCourtIndex % constraints.courtNames.length];
      
      schedule.push({
        matchId: match.id,
        player1Id: match.player1Id,
        player2Id: match.player2Id,
        player1Name: match.player1Name,
        player2Name: match.player2Name,
        courtId: courtId.toString(),
        courtName,
        startTime: timeSlot.start,
        endTime: timeSlot.end,
        roundName: match.roundName,
        isBreak: false,
        isLunchBreak: false,
        estimatedDuration: constraints.matchDuration
      });
      
      matchIndex++;
      currentCourtIndex++;
    }
    
    const optimizationScore = this.calculateOptimizationScore(schedule, constraints);
    
    if (optimizationScore < 70) {
      warnings.push('스케줄 밸런스가 최적화되지 않았습니다.');
    }
    
    const insights = `Balanced Round-Robin 알고리즘을 사용하여 ${matches.length}경기를 ${constraints.totalCourts}개 코트에 배정했습니다. 각 코트의 활용도를 균등하게 분배했습니다.`;
    
    return { schedule, insights, warnings, optimizationScore };
  }

  /**
   * Generate time-optimized schedule (minimal total time)
   */
  private static async generateTimeOptimizedSchedule(
    matches: Match[],
    constraints: ScheduleConstraints
  ): Promise<{
    schedule: any[];
    insights: string;
    warnings: string[];
    optimizationScore: number;
  }> {
    const schedule: any[] = [];
    const warnings: string[] = [];
    
    // Parallel court scheduling for maximum efficiency
    const courtSchedules: { [courtId: string]: any[] } = {};
    
    // Initialize court schedules
    for (let i = 0; i < constraints.totalCourts; i++) {
      courtSchedules[i + 1] = [];
    }
    
    const timeSlots = this.generateTimeSlots(constraints);
    let currentSlotIndex = 0;
    
    for (const match of matches) {
      // Find the court with earliest available slot
      let earliestCourt = 1;
      let earliestTime = timeSlots[currentSlotIndex]?.start || timeSlots[0].start;
      
      for (let courtId = 1; courtId <= constraints.totalCourts; courtId++) {
        const lastMatch = courtSchedules[courtId].slice(-1)[0];
        if (!lastMatch) {
          earliestCourt = courtId;
          break;
        }
        
        const nextAvailableTime = new Date(lastMatch.endTime);
        nextAvailableTime.setMinutes(nextAvailableTime.getMinutes() + constraints.breakBetweenMatches);
        
        if (nextAvailableTime < new Date(earliestTime)) {
          earliestTime = nextAvailableTime.toISOString();
          earliestCourt = courtId;
        }
      }
      
      const startTime = earliestTime;
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + constraints.matchDuration);
      
      const scheduleItem = {
        matchId: match.id,
        player1Id: match.player1Id,
        player2Id: match.player2Id,
        player1Name: match.player1Name,
        player2Name: match.player2Name,
        courtId: earliestCourt.toString(),
        courtName: constraints.courtNames[earliestCourt - 1],
        startTime,
        endTime: endTime.toISOString(),
        roundName: match.roundName,
        isBreak: false,
        isLunchBreak: false,
        estimatedDuration: constraints.matchDuration
      };
      
      schedule.push(scheduleItem);
      courtSchedules[earliestCourt].push(scheduleItem);
    }
    
    const optimizationScore = this.calculateOptimizationScore(schedule, constraints);
    
    if (schedule.length < matches.length) {
      warnings.push(`${matches.length - schedule.length}개 경기가 스케줄되지 않았습니다.`);
    }
    
    const insights = `Time-Optimized 알고리즘을 사용하여 총 대회 시간을 최소화했습니다. ${constraints.totalCourts}개 코트를 병렬로 활용하여 효율성을 극대화했습니다.`;
    
    return { schedule, insights, warnings, optimizationScore };
  }

  /**
   * Generate court-balanced schedule (equal load distribution)
   */
  private static async generateCourtBalancedSchedule(
    matches: Match[],
    constraints: ScheduleConstraints
  ): Promise<{
    schedule: any[];
    insights: string;
    warnings: string[];
    optimizationScore: number;
  }> {
    const schedule: any[] = [];
    const warnings: string[] = [];
    
    // Distribute matches evenly across courts
    const matchesPerCourt = Math.ceil(matches.length / constraints.totalCourts);
    const timeSlots = this.generateTimeSlots(constraints);
    
    for (let courtId = 1; courtId <= constraints.totalCourts; courtId++) {
      const courtMatches = matches.slice(
        (courtId - 1) * matchesPerCourt,
        courtId * matchesPerCourt
      );
      
      let timeSlotIndex = 0;
      
      for (const match of courtMatches) {
        if (timeSlotIndex >= timeSlots.length) {
          warnings.push(`코트 ${courtId}에서 시간 슬롯이 부족합니다.`);
          break;
        }
        
        const timeSlot = timeSlots[timeSlotIndex];
        
        schedule.push({
          matchId: match.id,
          player1Id: match.player1Id,
          player2Id: match.player2Id,
          player1Name: match.player1Name,
          player2Name: match.player2Name,
          courtId: courtId.toString(),
          courtName: constraints.courtNames[courtId - 1],
          startTime: timeSlot.start,
          endTime: timeSlot.end,
          roundName: match.roundName,
          isBreak: false,
          isLunchBreak: false,
          estimatedDuration: constraints.matchDuration
        });
        
        timeSlotIndex++;
      }
    }
    
    const optimizationScore = this.calculateOptimizationScore(schedule, constraints);
    
    const insights = `Court-Balanced 알고리즘을 사용하여 각 코트별 경기 수를 균등하게 분배했습니다. 코트당 평균 ${matchesPerCourt}경기가 배정되었습니다.`;
    
    return { schedule, insights, warnings, optimizationScore };
  }

  /**
   * Generate basic schedule (simple sequential assignment)
   */
  private static async generateBasicSchedule(
    matches: Match[],
    constraints: ScheduleConstraints
  ): Promise<{
    schedule: any[];
    insights: string;
    warnings: string[];
    optimizationScore: number;
  }> {
    const schedule: any[] = [];
    const warnings: string[] = ['기본 알고리즘을 사용합니다. 최적화가 제한적일 수 있습니다.'];
    
    const timeSlots = this.generateTimeSlots(constraints);
    
    for (let i = 0; i < matches.length && i < timeSlots.length; i++) {
      const match = matches[i];
      const timeSlot = timeSlots[i];
      const courtId = (i % constraints.totalCourts) + 1;
      
      schedule.push({
        matchId: match.id,
        player1Id: match.player1Id,
        player2Id: match.player2Id,
        player1Name: match.player1Name,
        player2Name: match.player2Name,
        courtId: courtId.toString(),
        courtName: constraints.courtNames[courtId - 1],
        startTime: timeSlot.start,
        endTime: timeSlot.end,
        roundName: match.roundName,
        isBreak: false,
        isLunchBreak: false,
        estimatedDuration: constraints.matchDuration
      });
    }
    
    const optimizationScore = this.calculateOptimizationScore(schedule, constraints);
    
    const insights = `기본 순차 알고리즘을 사용하여 ${schedule.length}경기를 스케줄했습니다.`;
    
    return { schedule, insights, warnings, optimizationScore };
  }

  /**
   * Generate time slots based on constraints
   */
  private static generateTimeSlots(constraints: ScheduleConstraints): Array<{ start: string; end: string }> {
    const slots: Array<{ start: string; end: string }> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Parse start and end times
    const [startHour, startMinute] = constraints.startTime.split(':').map(Number);
    const [endHour, endMinute] = constraints.endTime.split(':').map(Number);
    const [lunchStartHour, lunchStartMinute] = constraints.lunchBreakStart.split(':').map(Number);
    const [lunchEndHour, lunchEndMinute] = constraints.lunchBreakEnd.split(':').map(Number);
    
    const currentTime = new Date(today);
    currentTime.setHours(startHour, startMinute);
    
    const endTime = new Date(today);
    endTime.setHours(endHour, endMinute);
    
    const lunchStart = new Date(today);
    lunchStart.setHours(lunchStartHour, lunchStartMinute);
    
    const lunchEnd = new Date(today);
    lunchEnd.setHours(lunchEndHour, lunchEndMinute);
    
    while (currentTime < endTime) {
      const slotEnd = new Date(currentTime);
      slotEnd.setMinutes(slotEnd.getMinutes() + constraints.matchDuration);
      
      // Skip lunch break
      if (currentTime >= lunchStart && currentTime < lunchEnd) {
        currentTime.setTime(lunchEnd.getTime());
        continue;
      }
      
      if (slotEnd <= endTime) {
        slots.push({
          start: currentTime.toISOString(),
          end: slotEnd.toISOString()
        });
      }
      
      currentTime.setMinutes(currentTime.getMinutes() + constraints.matchDuration + constraints.breakBetweenMatches);
    }
    
    return slots;
  }

  /**
   * Calculate optimization score for a schedule
   */
  private static calculateOptimizationScore(schedule: any[], constraints: ScheduleConstraints): number {
    if (schedule.length === 0) return 0;
    
    let score = 100;
    
    // Check court utilization balance
    const courtUsage: { [courtId: string]: number } = {};
    schedule.forEach(item => {
      courtUsage[item.courtId] = (courtUsage[item.courtId] || 0) + 1;
    });
    
    const usageValues = Object.values(courtUsage);
    const avgUsage = usageValues.reduce((sum, count) => sum + count, 0) / usageValues.length;
    const usageVariance = usageValues.reduce((sum, count) => sum + Math.pow(count - avgUsage, 2), 0) / usageValues.length;
    
    // Penalize uneven court usage
    score -= Math.min(usageVariance * 5, 30);
    
    // Check time efficiency
    const totalScheduledTime = schedule.length * constraints.matchDuration;
    const theoreticalOptimalTime = schedule.length * constraints.matchDuration / constraints.totalCourts;
    const efficiency = theoreticalOptimalTime / totalScheduledTime * 100;
    
    if (efficiency < 80) {
      score -= (80 - efficiency) * 0.5;
    }
    
    return Math.max(0, Math.round(score));
  }
}

export default FallbackSchedulerService;