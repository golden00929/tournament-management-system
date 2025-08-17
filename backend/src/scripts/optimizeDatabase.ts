import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

/**
 * Database optimization script for tournament management system
 * Adds strategic indexes to improve query performance for large-scale tournaments
 */

interface OptimizationResult {
  success: boolean;
  indexesCreated: number;
  optimizationsApplied: string[];
  executionTime: number;
  error?: string;
}

class DatabaseOptimizer {
  private startTime: number = 0;
  private optimizationsApplied: string[] = [];

  async optimizeDatabase(): Promise<OptimizationResult> {
    this.startTime = Date.now();
    let indexesCreated = 0;

    try {
      console.log('🔧 Starting database optimization...');

      // 1. Player table optimizations
      await this.optimizePlayerTable();
      indexesCreated += 6;

      // 2. Tournament table optimizations  
      await this.optimizeTournamentTable();
      indexesCreated += 4;

      // 3. Participant table optimizations
      await this.optimizeParticipantTable();
      indexesCreated += 5;

      // 4. Match table optimizations
      await this.optimizeMatchTable();
      indexesCreated += 6;

      // 5. Schedule table optimizations
      await this.optimizeScheduleTable();
      indexesCreated += 3;

      // 6. Rating history optimizations
      await this.optimizeRatingHistoryTable();
      indexesCreated += 3;

      // 7. SQLite-specific optimizations
      await this.applySQLiteOptimizations();

      const executionTime = Date.now() - this.startTime;

      console.log(`✅ Database optimization completed in ${executionTime}ms`);
      console.log(`📊 Created ${indexesCreated} indexes`);
      console.log(`🎯 Applied ${this.optimizationsApplied.length} optimizations`);

      return {
        success: true,
        indexesCreated,
        optimizationsApplied: this.optimizationsApplied,
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - this.startTime;
      console.error('❌ Database optimization failed:', error);
      
      return {
        success: false,
        indexesCreated,
        optimizationsApplied: this.optimizationsApplied,
        executionTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async optimizePlayerTable(): Promise<void> {
    console.log('🏃 Optimizing Player table...');

    const optimizations = [
      // ELO rating queries (frequent sorting and filtering)
      `CREATE INDEX IF NOT EXISTS idx_players_elo_rating ON players (eloRating DESC)`,
      
      // Skill level filtering
      `CREATE INDEX IF NOT EXISTS idx_players_skill_level ON players (skillLevel, isActive)`,
      
      // Performance tracking queries
      `CREATE INDEX IF NOT EXISTS idx_players_performance ON players (performanceIndex DESC, totalMatches DESC)`,
      
      // Active player filtering with ELO
      `CREATE INDEX IF NOT EXISTS idx_players_active_elo ON players (isActive, eloRating DESC)`,
      
      // Last match date for activity tracking
      `CREATE INDEX IF NOT EXISTS idx_players_last_match ON players (lastMatchDate DESC, isActive)`,
      
      // Email lookups for authentication
      `CREATE INDEX IF NOT EXISTS idx_players_email_active ON players (email, isActive)`
    ];

    for (const sql of optimizations) {
      await prisma.$executeRawUnsafe(sql);
    }

    this.optimizationsApplied.push('Player table indexes');
  }

  private async optimizeTournamentTable(): Promise<void> {
    console.log('🏆 Optimizing Tournament table...');

    const optimizations = [
      // Tournament status and date filtering
      `CREATE INDEX IF NOT EXISTS idx_tournaments_status_date ON tournaments (status, startDate DESC)`,
      
      // Category and skill level filtering
      `CREATE INDEX IF NOT EXISTS idx_tournaments_category_skill ON tournaments (category, skillLevel, status)`,
      
      // Registration period queries
      `CREATE INDEX IF NOT EXISTS idx_tournaments_registration ON tournaments (registrationStart, registrationEnd, status)`,
      
      // Location-based searches
      `CREATE INDEX IF NOT EXISTS idx_tournaments_location ON tournaments (location, status)`
    ];

    for (const sql of optimizations) {
      await prisma.$executeRawUnsafe(sql);
    }

    this.optimizationsApplied.push('Tournament table indexes');
  }

  private async optimizeParticipantTable(): Promise<void> {
    console.log('👥 Optimizing Participant table...');

    const optimizations = [
      // Tournament participants lookup (most frequent query)
      `CREATE INDEX IF NOT EXISTS idx_participants_tournament ON participants (tournamentId, approvalStatus, isActive)`,
      
      // Player's tournament history
      `CREATE INDEX IF NOT EXISTS idx_participants_player ON participants (playerId, registrationDate DESC)`,
      
      // Payment status tracking
      `CREATE INDEX IF NOT EXISTS idx_participants_payment ON participants (paymentStatus, tournamentId)`,
      
      // ELO-based grouping for bracket generation
      `CREATE INDEX IF NOT EXISTS idx_participants_elo_group ON participants (tournamentId, registrationElo, approvalStatus)`,
      
      // Event type filtering (singles/doubles)
      `CREATE INDEX IF NOT EXISTS idx_participants_event_type ON participants (tournamentId, eventType, approvalStatus)`
    ];

    for (const sql of optimizations) {
      await prisma.$executeRawUnsafe(sql);
    }

    this.optimizationsApplied.push('Participant table indexes');
  }

  private async optimizeMatchTable(): Promise<void> {
    console.log('⚔️ Optimizing Match table...');

    const optimizations = [
      // Tournament matches lookup
      `CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches (tournamentId, status, roundName)`,
      
      // Player match history
      `CREATE INDEX IF NOT EXISTS idx_matches_player1 ON matches (player1Id, status, createdAt DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_matches_player2 ON matches (player2Id, status, createdAt DESC)`,
      
      // Court scheduling
      `CREATE INDEX IF NOT EXISTS idx_matches_court_schedule ON matches (courtNumber, scheduledTime, status)`,
      
      // Bracket matches
      `CREATE INDEX IF NOT EXISTS idx_matches_bracket ON matches (bracketId, roundName, matchNumber)`,
      
      // Status and time-based queries
      `CREATE INDEX IF NOT EXISTS idx_matches_status_time ON matches (status, scheduledTime, tournamentId)`
    ];

    for (const sql of optimizations) {
      await prisma.$executeRawUnsafe(sql);
    }

    this.optimizationsApplied.push('Match table indexes');
  }

  private async optimizeScheduleTable(): Promise<void> {
    console.log('📅 Optimizing Schedule table...');

    const optimizations = [
      // Tournament schedule lookup
      `CREATE INDEX IF NOT EXISTS idx_schedules_tournament_time ON schedules (tournamentId, startTime, endTime)`,
      
      // Court scheduling conflicts
      `CREATE INDEX IF NOT EXISTS idx_schedules_court_time ON schedules (courtNumber, startTime, endTime)`,
      
      // Public schedule filtering
      `CREATE INDEX IF NOT EXISTS idx_schedules_public ON schedules (isPublic, tournamentId, startTime)`
    ];

    for (const sql of optimizations) {
      await prisma.$executeRawUnsafe(sql);
    }

    this.optimizationsApplied.push('Schedule table indexes');
  }

  private async optimizeRatingHistoryTable(): Promise<void> {
    console.log('📈 Optimizing Rating History table...');

    const optimizations = [
      // Player rating timeline
      `CREATE INDEX IF NOT EXISTS idx_rating_history_player ON player_rating_history (playerId, createdAt DESC)`,
      
      // Match-based rating changes
      `CREATE INDEX IF NOT EXISTS idx_rating_history_match ON player_rating_history (matchId, playerId)`,
      
      // Rating change analysis
      `CREATE INDEX IF NOT EXISTS idx_rating_history_reason ON player_rating_history (reason, createdAt DESC)`
    ];

    for (const sql of optimizations) {
      await prisma.$executeRawUnsafe(sql);
    }

    this.optimizationsApplied.push('Rating history table indexes');
  }

  private async applySQLiteOptimizations(): Promise<void> {
    console.log('⚡ Applying SQLite-specific optimizations...');

    // SQLite performance optimizations
    const optimizations = [
      // Enable WAL mode for better concurrent access
      `PRAGMA journal_mode = WAL`,
      
      // Optimize for read performance
      `PRAGMA synchronous = NORMAL`,
      
      // Increase cache size (in pages, default is 2000)
      `PRAGMA cache_size = 10000`,
      
      // Optimize page size for better I/O
      `PRAGMA page_size = 4096`,
      
      // Enable automatic indexing for temporary tables
      `PRAGMA automatic_index = ON`,
      
      // Optimize query planner
      `PRAGMA optimize`
    ];

    for (const sql of optimizations) {
      try {
        await prisma.$executeRawUnsafe(sql);
      } catch (error) {
        console.warn(`⚠️ SQLite optimization warning: ${sql} - ${error}`);
      }
    }

    this.optimizationsApplied.push('SQLite performance settings');
  }

  async analyzePerformance(): Promise<void> {
    console.log('📊 Analyzing database performance...');

    try {
      // Get table sizes
      const tableStats = await this.getTableStatistics();
      
      // Analyze common query patterns
      await this.analyzeQueryPerformance();
      
      // Generate optimization report
      await this.generateOptimizationReport(tableStats);

    } catch (error) {
      console.error('❌ Performance analysis failed:', error);
    }
  }

  private async getTableStatistics(): Promise<any> {
    const tables = ['players', 'tournaments', 'participants', 'matches', 'schedules', 'player_rating_history'];
    const stats: any = {};

    for (const table of tables) {
      try {
        const countResult = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM ${table}`);
        stats[table] = Array.isArray(countResult) ? countResult[0] : { count: 0 };
      } catch (error) {
        stats[table] = { count: 0, error: error instanceof Error ? error.message : 'Unknown' };
      }
    }

    return stats;
  }

  private async analyzeQueryPerformance(): Promise<void> {
    console.log('🔍 Testing optimized query performance...');

    const testQueries = [
      // Common tournament query
      `SELECT * FROM tournaments WHERE status = 'open' ORDER BY startDate DESC LIMIT 10`,
      
      // Participant lookup
      `SELECT * FROM participants WHERE tournamentId = 'test' AND approvalStatus = 'approved'`,
      
      // Player ELO ranking
      `SELECT * FROM players WHERE isActive = 1 ORDER BY eloRating DESC LIMIT 50`,
      
      // Match schedule
      `SELECT * FROM matches WHERE status = 'scheduled' ORDER BY scheduledTime ASC LIMIT 20`
    ];

    for (const query of testQueries) {
      const startTime = Date.now();
      try {
        await prisma.$queryRawUnsafe(query);
        const executionTime = Date.now() - startTime;
        console.log(`✅ Query executed in ${executionTime}ms: ${query.substring(0, 50)}...`);
      } catch (error) {
        console.warn(`⚠️ Query test failed: ${query.substring(0, 50)}...`);
      }
    }
  }

  private async generateOptimizationReport(tableStats: any): Promise<void> {
    const reportPath = path.join(__dirname, '../logs/database_optimization_report.txt');
    const reportDir = path.dirname(reportPath);

    // Ensure logs directory exists
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const report = `
=== DATABASE OPTIMIZATION REPORT ===
Generated: ${new Date().toISOString()}
Execution Time: ${Date.now() - this.startTime}ms

=== TABLE STATISTICS ===
${Object.entries(tableStats).map(([table, stats]: [string, any]) => 
  `${table}: ${stats.count || 0} records${stats.error ? ` (Error: ${stats.error})` : ''}`
).join('\n')}

=== OPTIMIZATIONS APPLIED ===
${this.optimizationsApplied.map((opt, index) => `${index + 1}. ${opt}`).join('\n')}

=== PERFORMANCE RECOMMENDATIONS ===
1. Monitor query execution times regularly
2. Consider partitioning large tables (>100k records)
3. Archive old tournament data periodically
4. Use EXPLAIN QUERY PLAN for slow queries
5. Consider upgrading to PostgreSQL for production

=== INDEX USAGE GUIDELINES ===
- Players: Use ELO-based queries for ranking
- Tournaments: Filter by status and dates
- Participants: Always include tournamentId in queries
- Matches: Include tournamentId and status filters
- Schedules: Use time-based range queries

=== MONITORING QUERIES ===
-- Check index usage
SELECT name, sql FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_%';

-- Analyze query plans
EXPLAIN QUERY PLAN SELECT * FROM players WHERE eloRating > 1500 ORDER BY eloRating DESC;

-- Database integrity check
PRAGMA integrity_check;

-- Optimization statistics
PRAGMA optimize;
`;

    fs.writeFileSync(reportPath, report);
    console.log(`📄 Optimization report saved to: ${reportPath}`);
  }
}

// Export for direct execution
export async function optimizeDatabase(): Promise<OptimizationResult> {
  const optimizer = new DatabaseOptimizer();
  return await optimizer.optimizeDatabase();
}

export async function analyzePerformance(): Promise<void> {
  const optimizer = new DatabaseOptimizer();
  await optimizer.analyzePerformance();
}

// CLI execution
if (require.main === module) {
  (async () => {
    try {
      console.log('🚀 Starting database optimization process...');
      
      const result = await optimizeDatabase();
      
      if (result.success) {
        console.log('🎉 Database optimization completed successfully!');
        console.log(`📊 Summary:`);
        console.log(`   - Indexes created: ${result.indexesCreated}`);
        console.log(`   - Optimizations: ${result.optimizationsApplied.length}`);
        console.log(`   - Execution time: ${result.executionTime}ms`);
        
        // Run performance analysis
        await analyzePerformance();
        
      } else {
        console.error('💥 Database optimization failed!');
        console.error(`Error: ${result.error}`);
        process.exit(1);
      }
      
    } catch (error) {
      console.error('💥 Critical error during optimization:', error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  })();
}

export default DatabaseOptimizer;