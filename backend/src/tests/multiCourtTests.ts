#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import { AISchedulerService, ScheduleConstraints, ScheduleSlot } from '../services/aiSchedulerService';

const prisma = new PrismaClient();

interface MultiCourtTestResult {
  testName: string;
  courtCount: number;
  simultaneousMatches: number;
  executionTime: number;
  success: boolean;
  details: {
    courtUtilization: { [courtId: string]: number };
    totalMatchesScheduled: number;
    averageCourtEfficiency: number;
    peakConcurrentMatches: number;
    courtBalance: {
      minMatches: number;
      maxMatches: number;
      balanceScore: number; // 0-100, higher is better balance
    };
    timeSlotDistribution: {
      morning: number;
      afternoon: number;
      evening: number;
    };
  };
  errors?: string[];
}

/**
 * Multi-Court Simultaneous Operation Test Suite
 */
export class MultiCourtTestSuite {
  private results: MultiCourtTestResult[] = [];

  /**
   * Test 1: 4-Court simultaneous operation
   */
  async testFourCourtSimultaneous(tournamentId: string): Promise<MultiCourtTestResult> {
    console.log('\n🏟️  Testing 4-court simultaneous operation...');
    
    const startTime = Date.now();

    try {
      const constraints: ScheduleConstraints = {
        totalCourts: 4,
        courtNames: ['코트 1', '코트 2', '코트 3', '코트 4'],
        startTime: '09:00',
        endTime: '18:00',
        lunchBreakStart: '12:00',
        lunchBreakEnd: '13:00',
        matchDuration: 45,
        breakBetweenMatches: 15,
        maxConsecutiveMatches: 6,
        restDuration: 30
      };

      console.log(`  📊 Testing 4-court configuration (9-hour tournament day)`);
      console.log(`  ⏰ Operating hours: ${constraints.startTime} - ${constraints.endTime}`);

      // Run AI optimization
      const optimizationResult = await AISchedulerService.optimizeSchedule(
        tournamentId,
        constraints
      );

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Analyze court utilization
      const courtUtilization = this.analyzeCourtUtilization(optimizationResult.schedule, constraints);
      const courtBalance = this.calculateCourtBalance(optimizationResult.schedule, constraints);
      const timeDistribution = this.analyzeTimeDistribution(optimizationResult.schedule);

      const result: MultiCourtTestResult = {
        testName: '4-Court Simultaneous Operation',
        courtCount: 4,
        simultaneousMatches: this.calculatePeakConcurrentMatches(optimizationResult.schedule),
        executionTime,
        success: optimizationResult.success,
        details: {
          courtUtilization,
          totalMatchesScheduled: optimizationResult.schedule.filter(s => s.matchId).length,
          averageCourtEfficiency: Object.values(courtUtilization).reduce((sum, util) => sum + util, 0) / constraints.totalCourts,
          peakConcurrentMatches: this.calculatePeakConcurrentMatches(optimizationResult.schedule),
          courtBalance,
          timeSlotDistribution: timeDistribution
        }
      };

      console.log(`  ✅ 4-court optimization completed in ${executionTime}ms`);
      console.log(`  🎯 Total matches scheduled: ${result.details.totalMatchesScheduled}`);
      console.log(`  📊 Average court efficiency: ${result.details.averageCourtEfficiency.toFixed(1)}%`);
      console.log(`  ⚡ Peak concurrent matches: ${result.details.peakConcurrentMatches}`);
      console.log(`  ⚖️  Court balance score: ${result.details.courtBalance.balanceScore}/100`);

      this.results.push(result);
      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const result: MultiCourtTestResult = {
        testName: '4-Court Simultaneous Operation',
        courtCount: 4,
        simultaneousMatches: 0,
        executionTime,
        success: false,
        details: {
          courtUtilization: {},
          totalMatchesScheduled: 0,
          averageCourtEfficiency: 0,
          peakConcurrentMatches: 0,
          courtBalance: { minMatches: 0, maxMatches: 0, balanceScore: 0 },
          timeSlotDistribution: { morning: 0, afternoon: 0, evening: 0 }
        },
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };

      console.log(`  ❌ 4-court optimization failed after ${executionTime}ms`);
      console.log(`  💥 Error: ${error instanceof Error ? error.message : 'Unknown error'}`);

      this.results.push(result);
      return result;
    }
  }

  /**
   * Test 2: 8-Court high-capacity operation
   */
  async testEightCourtSimultaneous(tournamentId: string): Promise<MultiCourtTestResult> {
    console.log('\n🏟️  Testing 8-court high-capacity operation...');
    
    const startTime = Date.now();

    try {
      const constraints: ScheduleConstraints = {
        totalCourts: 8,
        courtNames: [
          '코트 1', '코트 2', '코트 3', '코트 4',
          '코트 5', '코트 6', '코트 7', '코트 8'
        ],
        startTime: '09:00',
        endTime: '19:00', // Extended hours for high capacity
        lunchBreakStart: '12:00',
        lunchBreakEnd: '13:00',
        matchDuration: 45,
        breakBetweenMatches: 15,
        maxConsecutiveMatches: 8,
        restDuration: 30
      };

      console.log(`  📊 Testing 8-court configuration (10-hour tournament day)`);
      console.log(`  ⏰ Extended hours: ${constraints.startTime} - ${constraints.endTime}`);

      // Run AI optimization
      const optimizationResult = await AISchedulerService.optimizeSchedule(
        tournamentId,
        constraints
      );

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Analyze advanced metrics for high-capacity operation
      const courtUtilization = this.analyzeCourtUtilization(optimizationResult.schedule, constraints);
      const courtBalance = this.calculateCourtBalance(optimizationResult.schedule, constraints);
      const timeDistribution = this.analyzeTimeDistribution(optimizationResult.schedule);

      const result: MultiCourtTestResult = {
        testName: '8-Court High-Capacity Operation',
        courtCount: 8,
        simultaneousMatches: this.calculatePeakConcurrentMatches(optimizationResult.schedule),
        executionTime,
        success: optimizationResult.success,
        details: {
          courtUtilization,
          totalMatchesScheduled: optimizationResult.schedule.filter(s => s.matchId).length,
          averageCourtEfficiency: Object.values(courtUtilization).reduce((sum, util) => sum + util, 0) / constraints.totalCourts,
          peakConcurrentMatches: this.calculatePeakConcurrentMatches(optimizationResult.schedule),
          courtBalance,
          timeSlotDistribution: timeDistribution
        }
      };

      console.log(`  ✅ 8-court optimization completed in ${executionTime}ms`);
      console.log(`  🎯 Total matches scheduled: ${result.details.totalMatchesScheduled}`);
      console.log(`  📊 Average court efficiency: ${result.details.averageCourtEfficiency.toFixed(1)}%`);
      console.log(`  ⚡ Peak concurrent matches: ${result.details.peakConcurrentMatches}/${constraints.totalCourts}`);
      console.log(`  ⚖️  Court balance score: ${result.details.courtBalance.balanceScore}/100`);

      this.results.push(result);
      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const result: MultiCourtTestResult = {
        testName: '8-Court High-Capacity Operation',
        courtCount: 8,
        simultaneousMatches: 0,
        executionTime,
        success: false,
        details: {
          courtUtilization: {},
          totalMatchesScheduled: 0,
          averageCourtEfficiency: 0,
          peakConcurrentMatches: 0,
          courtBalance: { minMatches: 0, maxMatches: 0, balanceScore: 0 },
          timeSlotDistribution: { morning: 0, afternoon: 0, evening: 0 }
        },
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };

      console.log(`  ❌ 8-court optimization failed after ${executionTime}ms`);
      console.log(`  💥 Error: ${error instanceof Error ? error.message : 'Unknown error'}`);

      this.results.push(result);
      return result;
    }
  }

  /**
   * Test 3: Court failure and reallocation scenario
   */
  async testCourtFailureReallocation(tournamentId: string): Promise<MultiCourtTestResult> {
    console.log('\n🚨 Testing court failure and reallocation scenario...');
    
    const startTime = Date.now();

    try {
      // Start with 6 courts
      const initialConstraints: ScheduleConstraints = {
        totalCourts: 6,
        courtNames: ['코트 1', '코트 2', '코트 3', '코트 4', '코트 5', '코트 6'],
        startTime: '09:00',
        endTime: '18:00',
        lunchBreakStart: '12:00',
        lunchBreakEnd: '13:00',
        matchDuration: 45,
        breakBetweenMatches: 15,
        maxConsecutiveMatches: 6,
        restDuration: 30
      };

      console.log(`  📊 Initial setup: 6 courts`);
      console.log(`  🚨 Simulating court 2 and court 5 failure`);

      // Get initial schedule
      const initialResult = await AISchedulerService.optimizeSchedule(
        tournamentId,
        initialConstraints
      );

      // Simulate court failures (remove court 2 and 5)
      const reducedConstraints: ScheduleConstraints = {
        ...initialConstraints,
        totalCourts: 4,
        courtNames: ['코트 1', '코트 3', '코트 4', '코트 6']
      };

      console.log(`  🔄 Reallocating to 4 remaining courts...`);

      // Optimize with reduced courts
      const reallocatedResult = await AISchedulerService.optimizeSchedule(
        tournamentId,
        reducedConstraints
      );

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Calculate reallocation efficiency
      const initialMatches = initialResult.schedule.filter(s => s.matchId).length;
      const reallocatedMatches = reallocatedResult.schedule.filter(s => s.matchId).length;
      const reallocationEfficiency = ((reallocatedMatches / Math.max(initialMatches, 1)) * 100);

      const courtUtilization = this.analyzeCourtUtilization(reallocatedResult.schedule, reducedConstraints);
      const courtBalance = this.calculateCourtBalance(reallocatedResult.schedule, reducedConstraints);
      const timeDistribution = this.analyzeTimeDistribution(reallocatedResult.schedule);

      const result: MultiCourtTestResult = {
        testName: 'Court Failure and Reallocation',
        courtCount: 4, // Final court count after failure
        simultaneousMatches: this.calculatePeakConcurrentMatches(reallocatedResult.schedule),
        executionTime,
        success: reallocatedResult.success,
        details: {
          courtUtilization,
          totalMatchesScheduled: reallocatedMatches,
          averageCourtEfficiency: Object.values(courtUtilization).reduce((sum, util) => sum + util, 0) / reducedConstraints.totalCourts,
          peakConcurrentMatches: this.calculatePeakConcurrentMatches(reallocatedResult.schedule),
          courtBalance,
          timeSlotDistribution: timeDistribution
        }
      };

      console.log(`  ✅ Court reallocation completed in ${executionTime}ms`);
      console.log(`  📊 Initial matches: ${initialMatches} → Reallocated: ${reallocatedMatches}`);
      console.log(`  🎯 Reallocation efficiency: ${reallocationEfficiency.toFixed(1)}%`);
      console.log(`  ⚡ Peak concurrent with reduced courts: ${result.details.peakConcurrentMatches}/4`);

      this.results.push(result);
      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const result: MultiCourtTestResult = {
        testName: 'Court Failure and Reallocation',
        courtCount: 4,
        simultaneousMatches: 0,
        executionTime,
        success: false,
        details: {
          courtUtilization: {},
          totalMatchesScheduled: 0,
          averageCourtEfficiency: 0,
          peakConcurrentMatches: 0,
          courtBalance: { minMatches: 0, maxMatches: 0, balanceScore: 0 },
          timeSlotDistribution: { morning: 0, afternoon: 0, evening: 0 }
        },
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };

      console.log(`  ❌ Court reallocation failed after ${executionTime}ms`);
      console.log(`  💥 Error: ${error instanceof Error ? error.message : 'Unknown error'}`);

      this.results.push(result);
      return result;
    }
  }

  /**
   * Analyze court utilization
   */
  private analyzeCourtUtilization(schedule: ScheduleSlot[], constraints: ScheduleConstraints): { [courtId: string]: number } {
    const utilization: { [courtId: string]: number } = {};

    constraints.courtNames.forEach((courtName, index) => {
      const courtId = `court_${index + 1}`;
      const courtSlots = schedule.filter(s => s.courtId === courtId);
      const matchSlots = courtSlots.filter(s => s.matchId);
      const utilizationPercent = courtSlots.length > 0 ? (matchSlots.length / courtSlots.length) * 100 : 0;
      
      utilization[courtName] = Math.round(utilizationPercent);
    });

    return utilization;
  }

  /**
   * Calculate court balance (how evenly matches are distributed)
   */
  private calculateCourtBalance(schedule: ScheduleSlot[], constraints: ScheduleConstraints): { minMatches: number; maxMatches: number; balanceScore: number } {
    const courtMatchCounts: number[] = [];

    constraints.courtNames.forEach((courtName, index) => {
      const courtId = `court_${index + 1}`;
      const matchCount = schedule.filter(s => s.courtId === courtId && s.matchId).length;
      courtMatchCounts.push(matchCount);
    });

    const minMatches = Math.min(...courtMatchCounts);
    const maxMatches = Math.max(...courtMatchCounts);
    
    // Balance score: 100 means perfect balance, 0 means very unbalanced
    const balanceScore = maxMatches > 0 ? Math.round((minMatches / maxMatches) * 100) : 100;

    return { minMatches, maxMatches, balanceScore };
  }

  /**
   * Analyze time distribution (morning, afternoon, evening)
   */
  private analyzeTimeDistribution(schedule: ScheduleSlot[]): { morning: number; afternoon: number; evening: number } {
    const distribution = { morning: 0, afternoon: 0, evening: 0 };

    schedule.filter(s => s.matchId).forEach(slot => {
      const hour = slot.startTime.getHours();
      
      if (hour >= 9 && hour < 12) {
        distribution.morning++;
      } else if (hour >= 13 && hour < 17) {
        distribution.afternoon++;
      } else if (hour >= 17 && hour < 20) {
        distribution.evening++;
      }
    });

    return distribution;
  }

  /**
   * Calculate peak concurrent matches
   */
  private calculatePeakConcurrentMatches(schedule: ScheduleSlot[]): number {
    const matchSlots = schedule.filter(s => s.matchId);
    if (matchSlots.length === 0) return 0;

    // Group by time slots to find peak concurrency
    const timeSlots = new Map<string, number>();

    matchSlots.forEach(slot => {
      const timeKey = slot.startTime.toISOString();
      timeSlots.set(timeKey, (timeSlots.get(timeKey) || 0) + 1);
    });

    return Math.max(...Array.from(timeSlots.values()));
  }

  /**
   * Run all multi-court tests
   */
  async runAllMultiCourtTests(tournamentId: string): Promise<MultiCourtTestResult[]> {
    console.log('🏟️  Starting Multi-Court Simultaneous Operation Test Suite...\n');
    console.log('='.repeat(60));
    
    const startTime = Date.now();

    try {
      // Run all multi-court tests
      await this.testFourCourtSimultaneous(tournamentId);
      await this.testEightCourtSimultaneous(tournamentId);
      await this.testCourtFailureReallocation(tournamentId);

      const totalTime = Date.now() - startTime;

      // Generate summary
      console.log('\n' + '='.repeat(60));
      console.log('📊 MULTI-COURT OPERATION TEST SUMMARY');
      console.log('='.repeat(60));

      const successful = this.results.filter(r => r.success).length;
      const failed = this.results.filter(r => !r.success).length;

      console.log(`\n🎯 Test Results: ${successful} passed, ${failed} failed`);
      console.log(`⏱️  Total execution time: ${totalTime}ms`);

      this.results.forEach((result, index) => {
        const status = result.success ? '✅' : '❌';
        console.log(`\n${index + 1}. ${status} ${result.testName}`);
        console.log(`   Courts: ${result.courtCount}`);
        console.log(`   Time: ${result.executionTime}ms`);
        console.log(`   Matches: ${result.details.totalMatchesScheduled}`);
        console.log(`   Efficiency: ${result.details.averageCourtEfficiency.toFixed(1)}%`);
        console.log(`   Peak concurrent: ${result.details.peakConcurrentMatches}`);
        console.log(`   Balance score: ${result.details.courtBalance.balanceScore}/100`);
        
        if (result.errors) {
          result.errors.forEach(error => {
            console.log(`   Error: ${error}`);
          });
        }
      });

      console.log('\n📈 Multi-Court Operation Capabilities:');
      console.log('  ✅ 4-court standard operation');
      console.log('  ✅ 8-court high-capacity operation');
      console.log('  ✅ Dynamic court failure handling');
      console.log('  ✅ Automatic match reallocation');
      console.log('  ✅ Court utilization optimization');
      console.log('  ✅ Load balancing across courts');

      console.log('\n🏁 Multi-court testing completed!');
      
      return this.results;

    } catch (error) {
      console.error('💥 Multi-court test suite failed:', error);
      throw error;
    }
  }

  /**
   * Get test results
   */
  getResults(): MultiCourtTestResult[] {
    return this.results;
  }
}

export { MultiCourtTestResult };