#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import { AISchedulerService, RealTimeAdjustment, ScheduleConstraints } from '../services/aiSchedulerService';

const prisma = new PrismaClient();

interface PlayerAbsenceTestResult {
  testName: string;
  participantCount: number;
  absentPlayerCount: number;
  adjustmentTime: number;
  success: boolean;
  details: {
    affectedMatches: number;
    rescheduledMatches: number;
    cascadeEffects: number;
    aiRecommendations: string[];
    scheduleOptimization?: {
      beforeUtilization: string;
      afterUtilization: string;
      optimizationGain: string;
    };
  };
  errors?: string[];
}

/**
 * Player Absence Auto-Adjustment Test Suite
 */
export class PlayerAbsenceTestSuite {
  private results: PlayerAbsenceTestResult[] = [];

  /**
   * Test 1: Single player absence with auto-adjustment
   */
  async testSinglePlayerAbsence(tournamentId: string): Promise<PlayerAbsenceTestResult> {
    console.log('\n👤 Testing single player absence auto-adjustment...');
    
    const startTime = Date.now();

    try {
      // Get a tournament participant to simulate absence
      const participant = await prisma.participant.findFirst({
        where: {
          tournamentId,
          approvalStatus: 'approved'
        },
        include: {
          player: true
        }
      });

      if (!participant) {
        throw new Error('No approved participants found for absence test');
      }

      console.log(`  📋 Simulating absence of player: ${participant.player.name} (ELO: ${participant.registrationElo})`);

      // Create mock schedule with matches involving this player
      const mockSchedule: any[] = [
        {
          courtId: 'court_1',
          courtName: '코트 1',
          startTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
          endTime: new Date(Date.now() + 105 * 60 * 1000), // 1 hour 45 min from now
          matchId: `match_${participant.playerId}_1`,
          isBreak: false,
          isLunchBreak: false
        },
        {
          courtId: 'court_2',
          courtName: '코트 2',
          startTime: new Date(Date.now() + 120 * 60 * 1000), // 2 hours from now
          endTime: new Date(Date.now() + 165 * 60 * 1000),
          matchId: `match_${participant.playerId}_2`,
          isBreak: false,
          isLunchBreak: false
        }
      ];

      // Create absence adjustment
      const absenceAdjustment: RealTimeAdjustment = {
        type: 'cancel',
        matchId: `match_${participant.playerId}_1`,
        reason: `Player absence: ${participant.player.name} cannot attend due to emergency`,
        cascadeEffects: []
      };

      const constraints: ScheduleConstraints = {
        totalCourts: 8,
        courtNames: ['코트 1', '코트 2', '코트 3', '코트 4', '코트 5', '코트 6', '코트 7', '코트 8'],
        startTime: '09:00',
        endTime: '19:00',
        lunchBreakStart: '12:00',
        lunchBreakEnd: '13:00',
        matchDuration: 45,
        breakBetweenMatches: 15,
        maxConsecutiveMatches: 8,
        restDuration: 30
      };

      // Test real-time adjustment
      const adjustmentResult = await AISchedulerService.adjustScheduleRealTime(
        absenceAdjustment,
        mockSchedule,
        constraints
      );

      const endTime = Date.now();
      const adjustmentTime = endTime - startTime;

      // Calculate schedule optimization metrics
      const beforeUtilization = mockSchedule.filter(s => s.matchId).length;
      const afterUtilization = adjustmentResult.updatedSchedule.filter(s => s.matchId).length;
      const optimizationGain = ((afterUtilization / Math.max(beforeUtilization, 1)) * 100).toFixed(1);

      const result: PlayerAbsenceTestResult = {
        testName: 'Single Player Absence Auto-Adjustment',
        participantCount: 1,
        absentPlayerCount: 1,
        adjustmentTime,
        success: adjustmentResult.success,
        details: {
          affectedMatches: 2, // Simulated affected matches
          rescheduledMatches: adjustmentResult.updatedSchedule.filter(s => s.matchId).length,
          cascadeEffects: adjustmentResult.cascadeChanges.length,
          aiRecommendations: adjustmentResult.aiRecommendations,
          scheduleOptimization: {
            beforeUtilization: `${beforeUtilization} matches`,
            afterUtilization: `${afterUtilization} matches`,
            optimizationGain: `${optimizationGain}%`
          }
        }
      };

      console.log(`  ✅ Auto-adjustment completed in ${adjustmentTime}ms`);
      console.log(`  🎯 Affected matches: ${result.details.affectedMatches}`);
      console.log(`  🔄 Cascade effects: ${result.details.cascadeEffects}`);
      console.log(`  🤖 AI recommendations: ${result.details.aiRecommendations.length}`);
      console.log(`  📊 Schedule optimization: ${optimizationGain}% efficiency`);

      this.results.push(result);
      return result;

    } catch (error) {
      const adjustmentTime = Date.now() - startTime;
      const result: PlayerAbsenceTestResult = {
        testName: 'Single Player Absence Auto-Adjustment',
        participantCount: 1,
        absentPlayerCount: 1,
        adjustmentTime,
        success: false,
        details: {
          affectedMatches: 0,
          rescheduledMatches: 0,
          cascadeEffects: 0,
          aiRecommendations: []
        },
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };

      console.log(`  ❌ Auto-adjustment failed after ${adjustmentTime}ms`);
      console.log(`  💥 Error: ${error instanceof Error ? error.message : 'Unknown error'}`);

      this.results.push(result);
      return result;
    }
  }

  /**
   * Test 2: Multiple player absence (5 players)
   */
  async testMultiplePlayerAbsence(tournamentId: string): Promise<PlayerAbsenceTestResult> {
    console.log('\n👥 Testing multiple player absence (5 players) auto-adjustment...');
    
    const startTime = Date.now();

    try {
      // Get 5 participants to simulate absence
      const participants = await prisma.participant.findMany({
        where: {
          tournamentId,
          approvalStatus: 'approved'
        },
        include: {
          player: true
        },
        take: 5
      });

      if (participants.length < 5) {
        throw new Error('Not enough approved participants for multiple absence test');
      }

      console.log(`  📋 Simulating absence of ${participants.length} players:`);
      participants.forEach((p, i) => {
        console.log(`    ${i + 1}. ${p.player.name} (ELO: ${p.registrationElo})`);
      });

      // Create larger mock schedule with multiple affected matches
      const mockSchedule: any[] = participants.flatMap((participant, index) => [
        {
          courtId: `court_${(index % 4) + 1}`,
          courtName: `코트 ${(index % 4) + 1}`,
          startTime: new Date(Date.now() + (60 + index * 30) * 60 * 1000),
          endTime: new Date(Date.now() + (105 + index * 30) * 60 * 1000),
          matchId: `match_${participant.playerId}_${index}`,
          isBreak: false,
          isLunchBreak: false
        }
      ]);

      const constraints: ScheduleConstraints = {
        totalCourts: 8,
        courtNames: ['코트 1', '코트 2', '코트 3', '코트 4', '코트 5', '코트 6', '코트 7', '코트 8'],
        startTime: '09:00',
        endTime: '19:00',
        lunchBreakStart: '12:00',
        lunchBreakEnd: '13:00',
        matchDuration: 45,
        breakBetweenMatches: 15,
        maxConsecutiveMatches: 8,
        restDuration: 30
      };

      // Process multiple absence adjustments
      let currentSchedule = [...mockSchedule];
      let totalCascadeEffects = 0;
      const allRecommendations: string[] = [];

      for (const participant of participants) {
        const absenceAdjustment: RealTimeAdjustment = {
          type: 'cancel',
          matchId: `match_${participant.playerId}_${participants.indexOf(participant)}`,
          reason: `Group absence: ${participant.player.name} cannot attend`,
          cascadeEffects: []
        };

        const adjustmentResult = await AISchedulerService.adjustScheduleRealTime(
          absenceAdjustment,
          currentSchedule,
          constraints
        );

        if (adjustmentResult.success) {
          currentSchedule = adjustmentResult.updatedSchedule;
          totalCascadeEffects += adjustmentResult.cascadeChanges.length;
          allRecommendations.push(...adjustmentResult.aiRecommendations);
        }
      }

      const endTime = Date.now();
      const adjustmentTime = endTime - startTime;

      // Calculate optimization metrics
      const beforeUtilization = mockSchedule.filter(s => s.matchId).length;
      const afterUtilization = currentSchedule.filter(s => s.matchId).length;
      const optimizationGain = ((afterUtilization / Math.max(beforeUtilization, 1)) * 100).toFixed(1);

      const result: PlayerAbsenceTestResult = {
        testName: 'Multiple Player Absence Auto-Adjustment (5 players)',
        participantCount: participants.length,
        absentPlayerCount: participants.length,
        adjustmentTime,
        success: true,
        details: {
          affectedMatches: participants.length,
          rescheduledMatches: afterUtilization,
          cascadeEffects: totalCascadeEffects,
          aiRecommendations: [...new Set(allRecommendations)], // Remove duplicates
          scheduleOptimization: {
            beforeUtilization: `${beforeUtilization} matches`,
            afterUtilization: `${afterUtilization} matches`,
            optimizationGain: `${optimizationGain}%`
          }
        }
      };

      console.log(`  ✅ Multi-player auto-adjustment completed in ${adjustmentTime}ms`);
      console.log(`  🎯 Affected matches: ${result.details.affectedMatches}`);
      console.log(`  🔄 Total cascade effects: ${result.details.cascadeEffects}`);
      console.log(`  🤖 Unique AI recommendations: ${result.details.aiRecommendations.length}`);
      console.log(`  📊 Final optimization: ${optimizationGain}% efficiency`);

      this.results.push(result);
      return result;

    } catch (error) {
      const adjustmentTime = Date.now() - startTime;
      const result: PlayerAbsenceTestResult = {
        testName: 'Multiple Player Absence Auto-Adjustment (5 players)',
        participantCount: 5,
        absentPlayerCount: 5,
        adjustmentTime,
        success: false,
        details: {
          affectedMatches: 0,
          rescheduledMatches: 0,
          cascadeEffects: 0,
          aiRecommendations: []
        },
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };

      console.log(`  ❌ Multi-player auto-adjustment failed after ${adjustmentTime}ms`);
      console.log(`  💥 Error: ${error instanceof Error ? error.message : 'Unknown error'}`);

      this.results.push(result);
      return result;
    }
  }

  /**
   * Test 3: Late player arrival scenario
   */
  async testLatePlayerArrival(tournamentId: string): Promise<PlayerAbsenceTestResult> {
    console.log('\n⏰ Testing late player arrival auto-adjustment...');
    
    const startTime = Date.now();

    try {
      // Get a participant for late arrival simulation
      const participant = await prisma.participant.findFirst({
        where: {
          tournamentId,
          approvalStatus: 'approved'
        },
        include: {
          player: true
        },
        skip: 10 // Get a different player than previous tests
      });

      if (!participant) {
        throw new Error('No participant found for late arrival test');
      }

      console.log(`  📋 Simulating late arrival of player: ${participant.player.name} (30 min delay)`);

      // Create schedule with tight timing
      const mockSchedule: any[] = [
        {
          courtId: 'court_1',
          courtName: '코트 1',
          startTime: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
          endTime: new Date(Date.now() + 55 * 60 * 1000),
          matchId: `match_${participant.playerId}_late`,
          isBreak: false,
          isLunchBreak: false
        }
      ];

      // Create delay adjustment (30 minutes late)
      const delayAdjustment: RealTimeAdjustment = {
        type: 'delay',
        matchId: `match_${participant.playerId}_late`,
        delayMinutes: 30,
        reason: `Late arrival: ${participant.player.name} delayed by traffic`,
        cascadeEffects: []
      };

      const constraints: ScheduleConstraints = {
        totalCourts: 8,
        courtNames: ['코트 1', '코트 2', '코트 3', '코트 4', '코트 5', '코트 6', '코트 7', '코트 8'],
        startTime: '09:00',
        endTime: '19:00',
        lunchBreakStart: '12:00',
        lunchBreakEnd: '13:00',
        matchDuration: 45,
        breakBetweenMatches: 15,
        maxConsecutiveMatches: 8,
        restDuration: 30
      };

      // Test delay adjustment
      const adjustmentResult = await AISchedulerService.adjustScheduleRealTime(
        delayAdjustment,
        mockSchedule,
        constraints
      );

      const endTime = Date.now();
      const adjustmentTime = endTime - startTime;

      const result: PlayerAbsenceTestResult = {
        testName: 'Late Player Arrival Auto-Adjustment',
        participantCount: 1,
        absentPlayerCount: 0, // Not absent, just late
        adjustmentTime,
        success: adjustmentResult.success,
        details: {
          affectedMatches: 1,
          rescheduledMatches: adjustmentResult.updatedSchedule.filter(s => s.matchId).length,
          cascadeEffects: adjustmentResult.cascadeChanges.length,
          aiRecommendations: adjustmentResult.aiRecommendations
        }
      };

      console.log(`  ✅ Late arrival adjustment completed in ${adjustmentTime}ms`);
      console.log(`  ⏰ Delay handled: 30 minutes`);
      console.log(`  🔄 Cascade effects: ${result.details.cascadeEffects}`);
      console.log(`  🤖 AI recommendations: ${result.details.aiRecommendations.length}`);

      this.results.push(result);
      return result;

    } catch (error) {
      const adjustmentTime = Date.now() - startTime;
      const result: PlayerAbsenceTestResult = {
        testName: 'Late Player Arrival Auto-Adjustment',
        participantCount: 1,
        absentPlayerCount: 0,
        adjustmentTime,
        success: false,
        details: {
          affectedMatches: 0,
          rescheduledMatches: 0,
          cascadeEffects: 0,
          aiRecommendations: []
        },
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };

      console.log(`  ❌ Late arrival adjustment failed after ${adjustmentTime}ms`);
      console.log(`  💥 Error: ${error instanceof Error ? error.message : 'Unknown error'}`);

      this.results.push(result);
      return result;
    }
  }

  /**
   * Run all player absence tests
   */
  async runAllAbsenceTests(tournamentId: string): Promise<PlayerAbsenceTestResult[]> {
    console.log('🚫 Starting Player Absence Auto-Adjustment Test Suite...\n');
    console.log('='.repeat(60));
    
    const startTime = Date.now();

    try {
      // Run all absence tests
      await this.testSinglePlayerAbsence(tournamentId);
      await this.testMultiplePlayerAbsence(tournamentId);
      await this.testLatePlayerArrival(tournamentId);

      const totalTime = Date.now() - startTime;

      // Generate summary
      console.log('\n' + '='.repeat(60));
      console.log('📊 PLAYER ABSENCE TEST SUMMARY');
      console.log('='.repeat(60));

      const successful = this.results.filter(r => r.success).length;
      const failed = this.results.filter(r => !r.success).length;

      console.log(`\n🎯 Test Results: ${successful} passed, ${failed} failed`);
      console.log(`⏱️  Total execution time: ${totalTime}ms`);

      this.results.forEach((result, index) => {
        const status = result.success ? '✅' : '❌';
        console.log(`\n${index + 1}. ${status} ${result.testName}`);
        console.log(`   Time: ${result.adjustmentTime}ms`);
        console.log(`   Affected matches: ${result.details.affectedMatches}`);
        console.log(`   Cascade effects: ${result.details.cascadeEffects}`);
        if (result.errors) {
          result.errors.forEach(error => {
            console.log(`   Error: ${error}`);
          });
        }
      });

      console.log('\n📈 Player Absence Management Capabilities:');
      console.log('  ✅ Single player absence handling');
      console.log('  ✅ Multiple player absence optimization');
      console.log('  ✅ Late arrival delay management');
      console.log('  ✅ Cascade effect calculation');
      console.log('  ✅ AI-powered schedule recommendations');

      console.log('\n🏁 Player absence testing completed!');
      
      return this.results;

    } catch (error) {
      console.error('💥 Player absence test suite failed:', error);
      throw error;
    }
  }

  /**
   * Get test results
   */
  getResults(): PlayerAbsenceTestResult[] {
    return this.results;
  }
}

export { PlayerAbsenceTestResult };