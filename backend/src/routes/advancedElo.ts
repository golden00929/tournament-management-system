import express from 'express';
import { AdvancedEloService } from '../services/advancedEloService';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

/**
 * 선수의 성능 지수 조회
 */
router.get('/performance/:playerId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { playerId } = req.params;
    
    const metrics = await AdvancedEloService.calculatePerformanceMetrics(playerId);
    
    res.json({
      success: true,
      data: {
        playerId,
        metrics
      }
    });
  } catch (error) {
    console.error('성능 지수 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '성능 지수 조회 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 두 선수 간의 상대 전적 조회
 */
router.get('/head-to-head/:player1Id/:player2Id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { player1Id, player2Id } = req.params;
    
    const h2hStats = await AdvancedEloService.getHeadToHeadStats(player1Id, player2Id);
    
    res.json({
      success: true,
      data: {
        player1Id,
        player2Id,
        stats: h2hStats
      }
    });
  } catch (error) {
    console.error('상대 전적 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '상대 전적 조회 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 경기 결과 예측
 */
router.get('/predict/:player1Id/:player2Id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { player1Id, player2Id } = req.params;
    
    const winProbability = await AdvancedEloService.predictMatchOutcome(player1Id, player2Id);
    
    res.json({
      success: true,
      data: {
        player1Id,
        player2Id,
        player1WinProbability: winProbability,
        player2WinProbability: 100 - winProbability
      }
    });
  } catch (error) {
    console.error('경기 예측 오류:', error);
    res.status(500).json({
      success: false,
      message: '경기 예측 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 선수의 성능 지수 수동 업데이트
 */
router.post('/update-performance/:playerId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { playerId } = req.params;
    
    await AdvancedEloService.updatePlayerPerformanceMetrics(playerId);
    const updatedMetrics = await AdvancedEloService.calculatePerformanceMetrics(playerId);
    
    res.json({
      success: true,
      message: '성능 지수가 업데이트되었습니다.',
      data: {
        playerId,
        metrics: updatedMetrics
      }
    });
  } catch (error) {
    console.error('성능 지수 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      message: '성능 지수 업데이트 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 모든 선수의 성능 지수 일괄 업데이트 (관리자 전용)
 */
router.post('/update-all-performance', authenticate, async (req: AuthRequest, res) => {
  try {
    await AdvancedEloService.updateAllPlayersPerformance();
    
    res.json({
      success: true,
      message: '모든 선수의 성능 지수가 업데이트되었습니다.'
    });
  } catch (error) {
    console.error('전체 성능 지수 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      message: '전체 성능 지수 업데이트 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 동적 K-Factor 계산 테스트
 */
router.get('/k-factor/:totalMatches/:eloRating', authenticate, async (req: AuthRequest, res) => {
  try {
    const { totalMatches, eloRating } = req.params;
    
    const kFactor = AdvancedEloService.calculateDynamicKFactor(
      parseInt(totalMatches),
      parseInt(eloRating)
    );
    
    res.json({
      success: true,
      data: {
        totalMatches: parseInt(totalMatches),
        eloRating: parseInt(eloRating),
        kFactor
      }
    });
  } catch (error) {
    console.error('K-Factor 계산 오류:', error);
    res.status(500).json({
      success: false,
      message: 'K-Factor 계산 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;