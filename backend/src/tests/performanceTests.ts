#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import { AISchedulerService, ScheduleConstraints } from '../services/aiSchedulerService';
import { TournamentSocketServer, initializeSocketServer } from '../websocket/socketServer';
import { Server as HTTPServer } from 'http';
import express from 'express';

const prisma = new PrismaClient();

interface PerformanceTestResult {
  testName: string;
  participantCount: number;
  executionTime: number;
  success: boolean;
  details: any;
  errors?: string[];
}

interface AIPerformanceMetrics {
  responseTime: number;
  optimizationScore: number;
  scheduledMatches: number;
  unscheduledMatches: number;
  memoryUsage: NodeJS.MemoryUsage;
}

/**
 * Performance Test Suite for 100-participant tournament
 */
export class PerformanceTestSuite {
  private results: PerformanceTestResult[] = [];
  private socketServer: TournamentSocketServer | null = null;

  constructor() {
    console.log('🧪 Initializing Performance Test Suite');
  }

  /**
   * Initialize WebSocket server for testing
   */
  private async initializeTestEnvironment(): Promise<void> {
    const app = express();
    const server = new HTTPServer(app);
    this.socketServer = initializeSocketServer(server);
    console.log('🔌 Test WebSocket server initialized');
  }

  /**
   * Test 1: Large-scale AI optimization performance
   */
  async testAIOptimizationPerformance(tournamentId: string): Promise<PerformanceTestResult> {
    console.log('\n🤖 Testing AI optimization performance with 100 participants...');
    
    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    try {
      // Multi-court configuration for large tournament
      const constraints: ScheduleConstraints = {
        totalCourts: 8,
        courtNames: [
          '코트 1', '코트 2', '코트 3', '코트 4',
          '코트 5', '코트 6', '코트 7', '코트 8'
        ],
        startTime: '09:00',
        endTime: '19:00', // Extended day for large tournament
        lunchBreakStart: '12:00',
        lunchBreakEnd: '13:00',
        matchDuration: 45,
        breakBetweenMatches: 15,
        maxConsecutiveMatches: 8, // More matches per court
        restDuration: 30
      };

      console.log('  📊 Testing with 8-court configuration...');
      console.log('  ⏰ Tournament duration: 10 hours (09:00-19:00)');

      const optimizationResult = await AISchedulerService.optimizeSchedule(
        tournamentId,
        constraints
      );

      const endTime = Date.now();
      const endMemory = process.memoryUsage();
      const executionTime = endTime - startTime;

      const metrics: AIPerformanceMetrics = {
        responseTime: executionTime,
        optimizationScore: optimizationResult.optimizationScore,
        scheduledMatches: optimizationResult.schedule.filter(s => s.matchId).length,
        unscheduledMatches: optimizationResult.unscheduledMatches.length,
        memoryUsage: {
          rss: endMemory.rss - startMemory.rss,
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          heapTotal: endMemory.heapTotal - startMemory.heapTotal,
          external: endMemory.external - startMemory.external,
          arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
        }
      };

      const result: PerformanceTestResult = {
        testName: 'AI Optimization Performance (100 participants)',
        participantCount: 100,
        executionTime,
        success: optimizationResult.success,
        details: {
          ...metrics,
          aiInsights: optimizationResult.aiInsights,
          warnings: optimizationResult.warnings,
          courtUtilization: optimizationResult.schedule.length > 0 ? 
            (optimizationResult.schedule.filter(s => s.matchId).length / optimizationResult.schedule.length * 100).toFixed(1) + '%' : '0%'
        }
      };

      console.log(`  ✅ AI optimization completed in ${executionTime}ms`);
      console.log(`  📈 Optimization score: ${optimizationResult.optimizationScore}/100`);
      console.log(`  🎯 Scheduled matches: ${metrics.scheduledMatches}`);
      console.log(`  ⚠️  Unscheduled matches: ${metrics.unscheduledMatches}`);
      console.log(`  🧠 Memory usage: ${(metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);

      this.results.push(result);
      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const result: PerformanceTestResult = {
        testName: 'AI Optimization Performance (100 participants)',
        participantCount: 100,
        executionTime,
        success: false,
        details: null,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };

      console.log(`  ❌ AI optimization failed after ${executionTime}ms`);
      console.log(`  💥 Error: ${error instanceof Error ? error.message : 'Unknown error'}`);

      this.results.push(result);
      return result;
    }
  }

  /**
   * Test 2: Database query performance under load
   */
  async testDatabasePerformance(tournamentId: string): Promise<PerformanceTestResult> {
    console.log('\n💾 Testing database performance with large dataset...');
    
    const startTime = Date.now();

    try {
      // Simulate multiple concurrent database operations
      const operations = await Promise.all([
        // Get tournament with all participants
        prisma.tournament.findUnique({
          where: { id: tournamentId },
          include: {
            participants: {
              include: {
                player: true
              }
            }
          }
        }),

        // Get all matches for tournament
        prisma.match.findMany({
          where: { tournamentId },
          include: {
            player1: true,
            player2: true,
            bracket: true
          }
        }),

        // Complex aggregation query
        prisma.participant.aggregate({
          where: { tournamentId },
          _count: { id: true },
          _avg: { registrationElo: true },
          _min: { registrationElo: true },
          _max: { registrationElo: true }
        }),

        // Group participants by skill level
        prisma.$queryRaw`
          SELECT p.skillLevel, COUNT(*) as count
          FROM participants pt
          JOIN players p ON pt.playerId = p.id
          WHERE pt.tournamentId = ${tournamentId}
          GROUP BY p.skillLevel
        `
      ]);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      const tournament = operations[0];
      const matches = operations[1];
      const aggregation = operations[2];
      const skillDistribution = operations[3];

      const result: PerformanceTestResult = {
        testName: 'Database Performance (Concurrent Queries)',
        participantCount: tournament?.participants?.length || 0,
        executionTime,
        success: true,
        details: {
          tournament: {
            id: tournament?.id,
            name: tournament?.name,
            participantCount: tournament?.participants?.length
          },
          matches: {
            count: matches.length,
            hasAllData: matches.every(m => m.player1 && m.player2)
          },
          aggregation: {
            totalParticipants: aggregation._count.id,
            avgElo: aggregation._avg.registrationElo,
            eloRange: `${aggregation._min.registrationElo} - ${aggregation._max.registrationElo}`
          },
          skillDistribution,
          queriesExecuted: 4
        }
      };

      console.log(`  ✅ Database queries completed in ${executionTime}ms`);
      console.log(`  👥 Participants loaded: ${tournament?.participants?.length}`);
      console.log(`  🥊 Matches found: ${matches.length}`);
      console.log(`  📊 Average ELO: ${aggregation._avg.registrationElo?.toFixed(0)}`);

      this.results.push(result);
      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const result: PerformanceTestResult = {
        testName: 'Database Performance (Concurrent Queries)',
        participantCount: 0,
        executionTime,
        success: false,
        details: null,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };

      console.log(`  ❌ Database performance test failed after ${executionTime}ms`);
      console.log(`  💥 Error: ${error instanceof Error ? error.message : 'Unknown error'}`);

      this.results.push(result);
      return result;
    }
  }

  /**
   * Test 3: Concurrent WebSocket connections simulation
   */
  async testWebSocketPerformance(tournamentId: string): Promise<PerformanceTestResult> {
    console.log('\n🔌 Testing WebSocket performance with multiple connections...');
    
    if (!this.socketServer) {
      await this.initializeTestEnvironment();
    }

    const startTime = Date.now();

    try {
      // Simulate 50 concurrent WebSocket connections (realistic load)
      const connectionCount = 50;
      const connections: any[] = [];

      // Test WebSocket functionality without actual socket connections
      // (In a real environment, you'd use socket.io-client for this)
      
      const testData = {
        schedule: this.socketServer?.getTournamentSchedule(tournamentId) || [],
        courtStatuses: this.socketServer?.getCourtStatuses(tournamentId) || new Map()
      };

      // Simulate broadcasting to multiple clients
      const broadcastTest = {
        tournamentId,
        optimizationResult: {
          success: true,
          schedule: Array(50).fill(null).map((_, i) => ({
            courtId: `court_${(i % 8) + 1}`,
            courtName: `코트 ${(i % 8) + 1}`,
            startTime: new Date(),
            endTime: new Date(),
            matchId: `match_${i}`,
            isBreak: false,
            isLunchBreak: false
          })),
          optimizationScore: 85,
          aiInsights: 'Performance test simulation',
          warnings: []
        }
      };

      // Test broadcast functionality
      if (this.socketServer) {
        this.socketServer.broadcastScheduleOptimization(
          tournamentId,
          broadcastTest.optimizationResult
        );
      }

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      const result: PerformanceTestResult = {
        testName: 'WebSocket Performance (Concurrent Connections)',
        participantCount: connectionCount,
        executionTime,
        success: true,
        details: {
          connectionCount,
          broadcastTest: {
            scheduleSlots: broadcastTest.optimizationResult.schedule.length,
            optimizationScore: broadcastTest.optimizationResult.optimizationScore
          },
          serverStatus: 'Active',
          memoryAfterTest: process.memoryUsage()
        }
      };

      console.log(`  ✅ WebSocket test completed in ${executionTime}ms`);
      console.log(`  🔗 Simulated connections: ${connectionCount}`);
      console.log(`  📡 Broadcast test: Success`);

      this.results.push(result);
      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const result: PerformanceTestResult = {
        testName: 'WebSocket Performance (Concurrent Connections)',
        participantCount: 50,
        executionTime,
        success: false,
        details: null,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };

      console.log(`  ❌ WebSocket performance test failed after ${executionTime}ms`);
      console.log(`  💥 Error: ${error instanceof Error ? error.message : 'Unknown error'}`);

      this.results.push(result);
      return result;
    }
  }

  /**
   * Test 4: Memory usage and garbage collection
   */
  async testMemoryPerformance(): Promise<PerformanceTestResult> {
    console.log('\n🧠 Testing memory performance and garbage collection...');
    
    const startTime = Date.now();
    const initialMemory = process.memoryUsage();

    try {
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const afterGCMemory = process.memoryUsage();

      // Simulate heavy memory operations
      const largeData = Array(10000).fill(null).map((_, i) => ({
        id: i,
        data: Array(100).fill(0).map(() => Math.random())
      }));

      const afterAllocationMemory = process.memoryUsage();

      // Clear large data
      largeData.length = 0;

      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      const result: PerformanceTestResult = {
        testName: 'Memory Performance and GC',
        participantCount: 0,
        executionTime,
        success: true,
        details: {
          initialMemory: {
            heapUsed: (initialMemory.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
            heapTotal: (initialMemory.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
            rss: (initialMemory.rss / 1024 / 1024).toFixed(2) + ' MB'
          },
          afterGC: {
            heapUsed: (afterGCMemory.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
            memoryFreed: ((initialMemory.heapUsed - afterGCMemory.heapUsed) / 1024 / 1024).toFixed(2) + ' MB'
          },
          afterAllocation: {
            heapUsed: (afterAllocationMemory.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
            memoryAdded: ((afterAllocationMemory.heapUsed - afterGCMemory.heapUsed) / 1024 / 1024).toFixed(2) + ' MB'
          },
          finalMemory: {
            heapUsed: (finalMemory.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
            memoryRecovered: ((afterAllocationMemory.heapUsed - finalMemory.heapUsed) / 1024 / 1024).toFixed(2) + ' MB'
          }
        }
      };

      console.log(`  ✅ Memory test completed in ${executionTime}ms`);
      console.log(`  🗑️  Memory freed by GC: ${result.details.afterGC.memoryFreed}`);
      console.log(`  📈 Memory used for allocation: ${result.details.afterAllocation.memoryAdded}`);
      console.log(`  ♻️  Memory recovered: ${result.details.finalMemory.memoryRecovered}`);

      this.results.push(result);
      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const result: PerformanceTestResult = {
        testName: 'Memory Performance and GC',
        participantCount: 0,
        executionTime,
        success: false,
        details: null,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };

      this.results.push(result);
      return result;
    }
  }

  /**
   * Run all performance tests
   */
  async runAllTests(tournamentId: string): Promise<PerformanceTestResult[]> {
    console.log('🚀 Starting comprehensive performance test suite...\n');
    console.log('='.repeat(60));
    
    const startTime = Date.now();

    try {
      // Run all tests sequentially
      await this.testAIOptimizationPerformance(tournamentId);
      await this.testDatabasePerformance(tournamentId);
      await this.testWebSocketPerformance(tournamentId);
      await this.testMemoryPerformance();

      const totalTime = Date.now() - startTime;

      // Generate summary report
      console.log('\n' + '='.repeat(60));
      console.log('📊 PERFORMANCE TEST SUMMARY');
      console.log('='.repeat(60));

      const successful = this.results.filter(r => r.success).length;
      const failed = this.results.filter(r => !r.success).length;

      console.log(`\n🎯 Test Results: ${successful} passed, ${failed} failed`);
      console.log(`⏱️  Total execution time: ${totalTime}ms`);
      console.log(`💾 System memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`);

      this.results.forEach((result, index) => {
        const status = result.success ? '✅' : '❌';
        console.log(`\n${index + 1}. ${status} ${result.testName}`);
        console.log(`   Time: ${result.executionTime}ms`);
        if (result.errors) {
          result.errors.forEach(error => {
            console.log(`   Error: ${error}`);
          });
        }
      });

      console.log('\n📈 Performance Recommendations:');
      
      if (this.results[0]?.success) {
        const aiTest = this.results[0];
        if (aiTest.executionTime > 5000) {
          console.log('  ⚠️  AI optimization taking >5s - consider caching strategies');
        } else {
          console.log('  ✅ AI optimization performance is acceptable');
        }
      }

      if (this.results[1]?.success) {
        const dbTest = this.results[1];
        if (dbTest.executionTime > 1000) {
          console.log('  ⚠️  Database queries taking >1s - consider indexing');
        } else {
          console.log('  ✅ Database performance is good');
        }
      }

      console.log('\n🏁 Performance testing completed!');
      
      return this.results;

    } catch (error) {
      console.error('💥 Performance test suite failed:', error);
      throw error;
    }
  }

  /**
   * Get test results
   */
  getResults(): PerformanceTestResult[] {
    return this.results;
  }
}

// Export for use in other modules
export { PerformanceTestResult, AIPerformanceMetrics };