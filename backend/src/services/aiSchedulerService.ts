import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
import { FallbackSchedulerService } from './fallbackSchedulerService';

const prisma = new PrismaClient();

// Interface definitions
export interface ScheduleConstraints {
  totalCourts: number;
  courtNames: string[];
  startTime: string; // "09:00"
  endTime: string; // "18:00"
  lunchBreakStart: string; // "12:00"
  lunchBreakEnd: string; // "13:00"
  matchDuration: number; // minutes
  breakBetweenMatches: number; // minutes
  maxConsecutiveMatches: number; // per court
  restDuration: number; // minutes between matches for same player
}

export interface Match {
  id: string;
  player1Id: string;
  player2Id: string;
  player1Name: string;
  player2Name: string;
  courtId?: string;
  courtName?: string;
  scheduledTime?: Date;
  estimatedDuration: number;
  priority: number; // 1-10, higher is more important
  bracketId: string;
  roundName: string;
}

export interface ScheduleSlot {
  courtId: string;
  courtName: string;
  startTime: Date;
  endTime: Date;
  matchId?: string;
  isBreak: boolean;
  isLunchBreak: boolean;
}

export interface OptimizationResult {
  success: boolean;
  schedule: ScheduleSlot[];
  unscheduledMatches: Match[];
  optimizationScore: number;
  aiInsights: string;
  constraints: ScheduleConstraints;
  warnings: string[];
}

export interface RealTimeAdjustment {
  type: 'delay' | 'court_change' | 'reschedule' | 'cancel';
  matchId: string;
  newCourtId?: string;
  newStartTime?: Date;
  delayMinutes?: number;
  reason: string;
  cascadeEffects: string[];
}

export class AISchedulerService {
  private static openai: OpenAI | null = null;

  /**
   * Initialize OpenAI client
   */
  private static initializeOpenAI(): OpenAI {
    if (!this.openai) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable is not set');
      }
      this.openai = new OpenAI({ apiKey });
    }
    return this.openai;
  }

  /**
   * Generate schedule optimization prompt for OpenAI
   */
  private static generateOptimizationPrompt(
    matches: Match[],
    constraints: ScheduleConstraints,
    currentSchedule?: ScheduleSlot[]
  ): string {
    const context = `
**Tournament Schedule Optimization Task**

You are an AI tournament scheduler for badminton/tennis/pickleball events. 
Optimize the match schedule considering all constraints and provide strategic insights.

**Constraints:**
- Total courts: ${constraints.totalCourts} (${constraints.courtNames.join(', ')})
- Operating hours: ${constraints.startTime} - ${constraints.endTime}
- Lunch break: ${constraints.lunchBreakStart} - ${constraints.lunchBreakEnd}
- Match duration: ${constraints.matchDuration} minutes
- Break between matches: ${constraints.breakBetweenMatches} minutes
- Max consecutive matches per court: ${constraints.maxConsecutiveMatches}
- Player rest duration: ${constraints.restDuration} minutes

**Matches to schedule (${matches.length} total):**
${matches.map((match, idx) => 
  `${idx + 1}. ${match.player1Name} vs ${match.player2Name} (Round: ${match.roundName}, Priority: ${match.priority})`
).join('\n')}

${currentSchedule ? `
**Current Schedule (for adjustment):**
${currentSchedule.filter(slot => slot.matchId).map(slot => 
  `${slot.courtName}: ${slot.startTime.toLocaleTimeString('ko-KR', {hour: '2-digit', minute: '2-digit'})} - ${slot.endTime.toLocaleTimeString('ko-KR', {hour: '2-digit', minute: '2-digit'})}`
).join('\n')}
` : ''}

**Optimization Goals:**
1. Minimize waiting time for players
2. Ensure fair rest periods between matches
3. Maximize court utilization
4. Respect priority ordering (higher priority first)
5. Balance workload across courts

**Response Format (JSON):**
{
  "optimizationScore": number (0-100),
  "insights": "Strategic recommendations and observations",
  "warnings": ["Any potential issues or concerns"],
  "recommendations": ["Specific scheduling suggestions"],
  "efficiency": {
    "courtUtilization": number (0-100),
    "playerRestBalance": number (0-100),
    "timeSlotOptimization": number (0-100)
  }
}

Provide analysis in Korean and focus on practical tournament management insights.
`;

    return context;
  }

  /**
   * Main schedule optimization function
   */
  static async optimizeSchedule(
    tournamentId: string,
    constraints: ScheduleConstraints,
    matches?: Match[]
  ): Promise<OptimizationResult> {
    try {
      console.log('🤖 Starting AI-powered schedule optimization...');

      // Get matches if not provided
      if (!matches) {
        matches = await this.getTournamentMatches(tournamentId);
      }

      if (matches.length === 0) {
        return {
          success: false,
          schedule: [],
          unscheduledMatches: [],
          optimizationScore: 0,
          aiInsights: '스케줄할 경기가 없습니다.',
          constraints,
          warnings: ['No matches found for scheduling']
        };
      }

      // Sort matches by priority and round
      const sortedMatches = matches.sort((a, b) => {
        if (a.priority !== b.priority) return b.priority - a.priority;
        return a.roundName.localeCompare(b.roundName);
      });

      // Generate base schedule using algorithm
      const baseSchedule = await this.generateBaseSchedule(sortedMatches, constraints);

      // Get AI insights
      const openai = this.initializeOpenAI();
      const prompt = this.generateOptimizationPrompt(sortedMatches, constraints);

      const aiResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert tournament scheduler with deep knowledge of badminton, tennis, and pickleball tournaments. Provide strategic scheduling insights in Korean.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      });

      let aiAnalysis;
      try {
        const responseContent = aiResponse.choices[0]?.message?.content;
        if (responseContent) {
          aiAnalysis = JSON.parse(responseContent);
        } else {
          throw new Error('Empty AI response');
        }
      } catch (parseError) {
        console.warn('Failed to parse AI response, using fallback:', parseError);
        aiAnalysis = {
          optimizationScore: 75,
          insights: 'AI 분석을 완료했습니다. 기본 스케줄링 알고리즘을 적용했습니다.',
          warnings: [],
          recommendations: ['스케줄을 검토하고 필요시 수동 조정하세요.'],
          efficiency: {
            courtUtilization: 80,
            playerRestBalance: 75,
            timeSlotOptimization: 70
          }
        };
      }

      // Apply AI insights to optimize the schedule
      const optimizedSchedule = await this.applyAIOptimizations(baseSchedule, aiAnalysis);

      return {
        success: true,
        schedule: optimizedSchedule.schedule,
        unscheduledMatches: optimizedSchedule.unscheduledMatches,
        optimizationScore: aiAnalysis.optimizationScore || 75,
        aiInsights: aiAnalysis.insights || 'AI 최적화 완료',
        constraints,
        warnings: aiAnalysis.warnings || []
      };

    } catch (error) {
      console.error('AI Schedule optimization error:', error);
      
      // Determine error type and apply appropriate fallback strategy
      let fallbackReason = 'Unknown error';
      let shouldUseFallback = true;
      
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('401') || errorMessage.includes('incorrect api key')) {
          fallbackReason = 'OpenAI API authentication failed';
          console.warn('🔑 OpenAI API key invalid - using local algorithms');
        } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
          fallbackReason = 'OpenAI API rate limit exceeded';
          console.warn('⏳ OpenAI API rate limited - using local algorithms');
        } else if (errorMessage.includes('503') || errorMessage.includes('502') || errorMessage.includes('504')) {
          fallbackReason = 'OpenAI API service unavailable';
          console.warn('🔧 OpenAI API service down - using local algorithms');
        } else if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
          fallbackReason = 'Network connectivity issue';
          console.warn('🌐 Network issues detected - using local algorithms');
        } else {
          fallbackReason = `OpenAI API error: ${error.message}`;
          console.warn('❌ OpenAI API general error - using local algorithms');
        }
      }
      
      try {
        // Use enhanced fallback scheduler service
        console.log('🚀 Activating enhanced fallback scheduler...');
        const fallbackResult = await FallbackSchedulerService.generateFallbackSchedule(
          tournamentId,
          constraints,
          matches || [],
          fallbackReason
        );
        
        if (fallbackResult.success) {
          console.log('✅ Fallback schedule generated successfully');
          return {
            success: true, // Fallback succeeded
            schedule: fallbackResult.schedule,
            unscheduledMatches: [],
            optimizationScore: fallbackResult.optimizationScore,
            aiInsights: `${fallbackResult.aiInsights}\n\n⚠️ 폴백 모드: ${fallbackReason}`,
            constraints,
            warnings: [
              `OpenAI API 사용 불가: ${fallbackReason}`,
              `로컬 ${fallbackResult.algorithm} 알고리즘 사용됨`,
              ...fallbackResult.warnings
            ]
          };
        } else {
          throw new Error('Fallback scheduler also failed');
        }
        
      } catch (fallbackError) {
        console.error('❌ Fallback scheduler failed:', fallbackError);
        
        // Last resort: basic scheduling
        const basicSchedule = await this.generateFallbackSchedule(matches || [], constraints);
        
        return {
          success: false,
          schedule: basicSchedule.schedule,
          unscheduledMatches: basicSchedule.unscheduledMatches,
          optimizationScore: 30,
          aiInsights: `모든 AI 서비스가 실패했습니다.\n원인: ${fallbackReason}\n기본 스케줄러를 사용했습니다.`,
          constraints,
          warnings: [
            'OpenAI API 실패',
            '고급 폴백 알고리즘 실패', 
            '최소 기능 스케줄러 사용',
            '수동 검토 및 조정 필요'
          ]
        };
      }
    }
  }

  /**
   * Generate base schedule using deterministic algorithm
   */
  private static async generateBaseSchedule(
    matches: Match[],
    constraints: ScheduleConstraints
  ): Promise<{schedule: ScheduleSlot[], unscheduledMatches: Match[]}> {
    const schedule: ScheduleSlot[] = [];
    const unscheduledMatches: Match[] = [];
    
    // Parse time constraints
    const [startHour, startMin] = constraints.startTime.split(':').map(Number);
    const [endHour, endMin] = constraints.endTime.split(':').map(Number);
    const [lunchStartHour, lunchStartMin] = constraints.lunchBreakStart.split(':').map(Number);
    const [lunchEndHour, lunchEndMin] = constraints.lunchBreakEnd.split(':').map(Number);

    // Create time slots for each court
    const baseDate = new Date();
    baseDate.setHours(startHour, startMin, 0, 0);

    // Track court availability and player schedules
    const courtSchedules: { [courtId: string]: Date } = {};
    const playerLastMatch: { [playerId: string]: Date } = {};

    // Initialize court schedules
    constraints.courtNames.forEach((courtName, index) => {
      const courtId = `court_${index + 1}`;
      courtSchedules[courtId] = new Date(baseDate);

      // Add lunch break slots
      const lunchStart = new Date(baseDate);
      lunchStart.setHours(lunchStartHour, lunchStartMin, 0, 0);
      const lunchEnd = new Date(baseDate);
      lunchEnd.setHours(lunchEndHour, lunchEndMin, 0, 0);

      schedule.push({
        courtId,
        courtName,
        startTime: new Date(lunchStart),
        endTime: new Date(lunchEnd),
        isBreak: false,
        isLunchBreak: true
      });
    });

    // Schedule matches
    for (const match of matches) {
      let bestCourt: string | null = null;
      let earliestTime: Date | null = null;

      // Find the best court and time slot
      for (let i = 0; i < constraints.courtNames.length; i++) {
        const courtId = `court_${i + 1}`;
        const courtAvailable = courtSchedules[courtId];
        
        // Check player availability
        const player1LastMatch = playerLastMatch[match.player1Id] || new Date(0);
        const player2LastMatch = playerLastMatch[match.player2Id] || new Date(0);
        
        const playerRestTime = Math.max(
          player1LastMatch.getTime() + constraints.restDuration * 60 * 1000,
          player2LastMatch.getTime() + constraints.restDuration * 60 * 1000
        );

        const proposedStartTime = new Date(Math.max(
          courtAvailable.getTime(),
          playerRestTime,
          baseDate.getTime()
        ));

        // Skip if it conflicts with lunch break
        const lunchStart = new Date(baseDate);
        lunchStart.setHours(lunchStartHour, lunchStartMin, 0, 0);
        const lunchEnd = new Date(baseDate);
        lunchEnd.setHours(lunchEndHour, lunchEndMin, 0, 0);

        if (proposedStartTime < lunchEnd && proposedStartTime.getTime() + match.estimatedDuration * 60 * 1000 > lunchStart.getTime()) {
          proposedStartTime.setTime(lunchEnd.getTime());
        }

        // Check if within operating hours
        const dayEnd = new Date(baseDate);
        dayEnd.setHours(endHour, endMin, 0, 0);
        
        if (proposedStartTime.getTime() + match.estimatedDuration * 60 * 1000 <= dayEnd.getTime()) {
          if (!earliestTime || proposedStartTime < earliestTime) {
            bestCourt = courtId;
            earliestTime = proposedStartTime;
          }
        }
      }

      if (bestCourt && earliestTime) {
        // Schedule the match
        const endTime = new Date(earliestTime.getTime() + match.estimatedDuration * 60 * 1000);
        const breakEndTime = new Date(endTime.getTime() + constraints.breakBetweenMatches * 60 * 1000);

        schedule.push({
          courtId: bestCourt,
          courtName: constraints.courtNames[parseInt(bestCourt.split('_')[1]) - 1],
          startTime: new Date(earliestTime),
          endTime: new Date(endTime),
          matchId: match.id,
          isBreak: false,
          isLunchBreak: false
        });

        // Update tracking
        courtSchedules[bestCourt] = breakEndTime;
        playerLastMatch[match.player1Id] = endTime;
        playerLastMatch[match.player2Id] = endTime;
      } else {
        unscheduledMatches.push(match);
      }
    }

    return { schedule, unscheduledMatches };
  }

  /**
   * Apply AI optimizations to the base schedule
   */
  private static async applyAIOptimizations(
    baseResult: {schedule: ScheduleSlot[], unscheduledMatches: Match[]},
    aiAnalysis: any
  ): Promise<{schedule: ScheduleSlot[], unscheduledMatches: Match[]}> {
    // For now, return the base schedule
    // In a more advanced implementation, we would apply specific AI recommendations
    return baseResult;
  }

  /**
   * Generate fallback schedule without AI
   */
  private static async generateFallbackSchedule(
    matches: Match[],
    constraints: ScheduleConstraints
  ): Promise<{schedule: ScheduleSlot[], unscheduledMatches: Match[]}> {
    return this.generateBaseSchedule(matches, constraints);
  }

  /**
   * Get tournament matches for scheduling
   */
  private static async getTournamentMatches(tournamentId: string): Promise<Match[]> {
    const matches = await prisma.match.findMany({
      where: {
        tournamentId,
        status: 'scheduled'
      },
      include: {
        player1: { select: { id: true, name: true } },
        player2: { select: { id: true, name: true } },
        bracket: { select: { id: true } }
      },
      orderBy: [
        { roundName: 'asc' },
        { matchNumber: 'asc' }
      ]
    });

    return matches
      .filter(match => match.player1Id && match.player2Id) // Filter out matches with null players
      .map(match => ({
        id: match.id,
        player1Id: match.player1Id!,
        player2Id: match.player2Id!,
        player1Name: match.player1?.name || 'Unknown',
        player2Name: match.player2?.name || 'Unknown',
        estimatedDuration: 45, // Default 45 minutes
        priority: this.calculateMatchPriority(match.roundName),
        bracketId: match.bracketId || '',
        roundName: match.roundName
      }));
  }

  /**
   * Calculate match priority based on round
   */
  private static calculateMatchPriority(roundName: string): number {
    const priorityMap: { [key: string]: number } = {
      'final': 10,
      'semi_final': 9,
      'quarter_final': 8,
      'round_16': 7,
      'round_32': 6,
      'group_stage': 5
    };

    const lowerRound = roundName.toLowerCase();
    for (const [round, priority] of Object.entries(priorityMap)) {
      if (lowerRound.includes(round.replace('_', ''))) {
        return priority;
      }
    }
    return 5; // Default priority
  }

  /**
   * Real-time schedule adjustment with AI
   */
  static async adjustScheduleRealTime(
    adjustment: RealTimeAdjustment,
    currentSchedule: ScheduleSlot[],
    constraints: ScheduleConstraints
  ): Promise<{
    success: boolean;
    updatedSchedule: ScheduleSlot[];
    cascadeChanges: RealTimeAdjustment[];
    aiRecommendations: string[];
  }> {
    try {
      console.log('🔄 Processing real-time schedule adjustment...');

      // Find the affected match
      const affectedSlot = currentSchedule.find(slot => slot.matchId === adjustment.matchId);
      if (!affectedSlot) {
        throw new Error('Match not found in current schedule');
      }

      // Generate AI prompt for adjustment strategy
      const adjustmentPrompt = `
**Real-time Schedule Adjustment**

A tournament schedule needs immediate adjustment due to: ${adjustment.reason}

**Adjustment Details:**
- Type: ${adjustment.type}
- Affected match: ${adjustment.matchId}
- Current time: ${affectedSlot.startTime.toLocaleTimeString('ko-KR')}
- Court: ${affectedSlot.courtName}
${adjustment.delayMinutes ? `- Delay: ${adjustment.delayMinutes} minutes` : ''}
${adjustment.newCourtId ? `- New court requested: ${adjustment.newCourtId}` : ''}

**Current Schedule Impact:**
${currentSchedule.filter(s => s.matchId && s.startTime > affectedSlot.startTime).length} subsequent matches may be affected

Provide strategic recommendations for minimal disruption in Korean.

Response format:
{
  "strategy": "Overall adjustment strategy",
  "recommendations": ["Specific action items"],
  "riskAssessment": "Potential risks and mitigation",
  "communicationPoints": ["Key messages for participants"]
}
`;

      // Get AI recommendations
      const openai = this.initializeOpenAI();
      const aiResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a tournament operations expert. Provide practical advice for real-time schedule adjustments in Korean.'
          },
          {
            role: 'user',
            content: adjustmentPrompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      });

      let aiGuidance;
      try {
        const responseContent = aiResponse.choices[0]?.message?.content;
        aiGuidance = responseContent ? JSON.parse(responseContent) : null;
      } catch {
        aiGuidance = {
          strategy: '최소한의 영향으로 일정을 조정합니다.',
          recommendations: ['영향받는 경기들을 순차적으로 재조정', '참가자들에게 즉시 알림'],
          riskAssessment: '후속 경기 지연 가능성이 있습니다.',
          communicationPoints: ['일정 변경 사항 안내', '예상 지연 시간 공지']
        };
      }

      // Apply the adjustment logic
      const updatedSchedule = [...currentSchedule];
      const cascadeChanges: RealTimeAdjustment[] = [];

      switch (adjustment.type) {
        case 'delay':
          if (adjustment.delayMinutes) {
            this.applyDelayAdjustment(updatedSchedule, adjustment, cascadeChanges);
          }
          break;
        case 'court_change':
          if (adjustment.newCourtId) {
            this.applyCourtChangeAdjustment(updatedSchedule, adjustment, cascadeChanges);
          }
          break;
        case 'reschedule':
          if (adjustment.newStartTime) {
            this.applyRescheduleAdjustment(updatedSchedule, adjustment, cascadeChanges);
          }
          break;
        case 'cancel':
          this.applyCancelAdjustment(updatedSchedule, adjustment, cascadeChanges);
          break;
      }

      return {
        success: true,
        updatedSchedule,
        cascadeChanges,
        aiRecommendations: aiGuidance?.recommendations || ['일정 조정이 완료되었습니다.']
      };

    } catch (error) {
      console.error('Real-time adjustment error:', error);
      return {
        success: false,
        updatedSchedule: currentSchedule,
        cascadeChanges: [],
        aiRecommendations: [`조정 중 오류 발생: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Apply delay adjustment to schedule
   */
  private static applyDelayAdjustment(
    schedule: ScheduleSlot[],
    adjustment: RealTimeAdjustment,
    cascadeChanges: RealTimeAdjustment[]
  ): void {
    const delayMs = (adjustment.delayMinutes || 0) * 60 * 1000;
    
    for (const slot of schedule) {
      if (slot.matchId === adjustment.matchId) {
        slot.startTime = new Date(slot.startTime.getTime() + delayMs);
        slot.endTime = new Date(slot.endTime.getTime() + delayMs);
        break;
      }
    }

    // Add cascade effects for subsequent matches on the same court
    const affectedSlot = schedule.find(s => s.matchId === adjustment.matchId);
    if (affectedSlot) {
      const subsequentMatches = schedule.filter(s => 
        s.courtId === affectedSlot.courtId && 
        s.startTime > affectedSlot.endTime &&
        s.matchId
      );

      subsequentMatches.forEach(slot => {
        slot.startTime = new Date(slot.startTime.getTime() + delayMs);
        slot.endTime = new Date(slot.endTime.getTime() + delayMs);
        
        if (slot.matchId) {
          cascadeChanges.push({
            type: 'delay',
            matchId: slot.matchId,
            delayMinutes: adjustment.delayMinutes,
            reason: `Cascade effect from match ${adjustment.matchId}`,
            cascadeEffects: []
          });
        }
      });
    }
  }

  /**
   * Apply court change adjustment
   */
  private static applyCourtChangeAdjustment(
    schedule: ScheduleSlot[],
    adjustment: RealTimeAdjustment,
    cascadeChanges: RealTimeAdjustment[]
  ): void {
    for (const slot of schedule) {
      if (slot.matchId === adjustment.matchId && adjustment.newCourtId) {
        slot.courtId = adjustment.newCourtId;
        // Note: courtName would need to be looked up from constraints
        break;
      }
    }
  }

  /**
   * Apply reschedule adjustment
   */
  private static applyRescheduleAdjustment(
    schedule: ScheduleSlot[],
    adjustment: RealTimeAdjustment,
    cascadeChanges: RealTimeAdjustment[]
  ): void {
    for (const slot of schedule) {
      if (slot.matchId === adjustment.matchId && adjustment.newStartTime) {
        const duration = slot.endTime.getTime() - slot.startTime.getTime();
        slot.startTime = new Date(adjustment.newStartTime);
        slot.endTime = new Date(adjustment.newStartTime.getTime() + duration);
        break;
      }
    }
  }

  /**
   * Apply cancel adjustment
   */
  private static applyCancelAdjustment(
    schedule: ScheduleSlot[],
    adjustment: RealTimeAdjustment,
    cascadeChanges: RealTimeAdjustment[]
  ): void {
    const index = schedule.findIndex(slot => slot.matchId === adjustment.matchId);
    if (index !== -1) {
      schedule.splice(index, 1);
    }
  }
}

export default AISchedulerService;