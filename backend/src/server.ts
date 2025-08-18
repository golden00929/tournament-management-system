import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import http from 'http';

// Import middleware
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler';
import { setupSecurityMiddleware, loginRateLimit } from './middleware/security';
import { cacheTournamentData, cachePlayerData, cacheScheduleData, warmUpCache } from './middleware/cache';

// Import routes
import authRoutes from './routes/auth';
import playerAuthRoutes from './routes/playerAuth';
import publicApiRoutes from './routes/public';
import playerRoutes from './routes/player';
import playerTournamentRoutes from './routes/playerTournament';
import playerApiRoutes from './routes/playerApi';
import tournamentRoutes from './routes/tournament';
import participantRoutes from './routes/participant';
import bracketRoutes from './routes/bracket';
import matchRoutes from './routes/match';
import teamRoutes from './routes/team';
import scheduleRoutes from './routes/schedule';
import paymentRoutes from './routes/payment';
import advancedEloRoutes from './routes/advancedElo';
import aiSchedulerRoutes from './routes/aiScheduler';
import notificationRoutes from './routes/notification';
import setupRoutes from './routes/setup';

// Import WebSocket server
import { initializeSocketServer } from './websocket/socketServer';

// Load environment variables
dotenv.config();

console.log('🔧 환경변수 로드 완료:', process.env.NODE_ENV || 'development', '모드');
console.log('📊 데이터베이스:', process.env.DATABASE_URL?.includes('postgresql') ? 'postgresql' : 'sqlite');
console.log('🚀 서버 포트:', process.env.PORT || 8080);

const app = express();
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

// Apply security middleware
app.use(setupSecurityMiddleware());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 모든 POST 요청 로깅
app.use((req, res, next) => {
  if (req.method === 'POST') {
    console.log(`🚀 POST 요청: ${req.originalUrl}`);
    console.log(`🚀 Body:`, req.body);
  }
  next();
});

// Logging middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check endpoints for Railway
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Tournament Management Server is running',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: process.env.DATABASE_URL ? 'connected' : 'not configured'
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    api: 'running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes with caching
app.use('/api/auth', authRoutes);
app.use('/api/player-auth', playerAuthRoutes);
app.use('/api/public', cacheTournamentData(), publicApiRoutes); // 공개 API (인증 불필요)
app.use('/api/player-api', playerApiRoutes); // 선수용 인증된 API 
app.use('/api/player-tournaments', playerTournamentRoutes); // 선수용 대회 참가 API
app.use('/api/players', cachePlayerData(), playerRoutes);
app.use('/api/tournaments', cacheTournamentData(), tournamentRoutes);
app.use('/api/participants', participantRoutes);
// 대진표 API 요청 로깅 미들웨어
app.use('/api/brackets', (req, res, next) => {
  console.log('🚀 BRACKET API 요청:', req.method, req.originalUrl);
  console.log('🚀 Request Body:', JSON.stringify(req.body, null, 2));
  console.log('🚀 Request Headers Authorization:', req.headers.authorization ? 'Present' : 'Missing');
  next();
});
app.use('/api/brackets', bracketRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/schedules', cacheScheduleData(), scheduleRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/advanced-elo', advancedEloRoutes);
app.use('/api/ai-scheduler', aiSchedulerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/setup', setupRoutes);

// Static files for uploads
app.use('/uploads', express.static('./uploads'));

// 404 middleware
app.use(notFoundHandler);

// Error handling middleware
app.use(globalErrorHandler);

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket server
const socketServer = initializeSocketServer(server);

// Start server
server.listen(PORT, HOST, async () => {
  console.log(`🚀 Tournament Management Server is running on port ${PORT}`);
  console.log(`🏠 Host: ${HOST}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
  console.log(`💾 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
  console.log(`🔌 WebSocket server initialized on port ${PORT}`);
  console.log(`🤖 AI Scheduler ready with OpenAI integration`);
  console.log(`📦 API response caching enabled`);
  
  // Warm up cache
  await warmUpCache();
});

export default app;
export { socketServer };