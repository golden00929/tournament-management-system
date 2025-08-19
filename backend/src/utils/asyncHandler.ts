import { Request, Response, NextFunction } from 'express';

/**
 * 🔄 비동기 함수 에러 처리 래퍼 유틸리티
 * Express 라우트 핸들러에서 발생하는 비동기 에러를 자동으로 catch하여 다음 미들웨어로 전달
 */

/**
 * 비동기 라우트 핸들러를 래핑하여 에러를 자동으로 처리
 * 
 * @param fn - 비동기 함수 (라우트 핸들러)
 * @returns Express 미들웨어 함수
 * 
 * @example
 * // 기존 방식 (try-catch 필요)
 * router.get('/users', async (req, res) => {
 *   try {
 *     const users = await User.findAll();
 *     res.json(users);
 *   } catch (error) {
 *     next(error);
 *   }
 * });
 * 
 * // asyncHandler 사용 방식
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await User.findAll();
 *   res.json(users);
 * }));
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 타입 안전한 비동기 핸들러 (제네릭 버전)
 * 더 엄격한 타입 체크를 원할 때 사용
 */
export const typedAsyncHandler = <T extends Request = Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: T, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 인증이 필요한 라우트를 위한 asyncHandler
 * AuthRequest 타입을 사용하여 req.user에 안전하게 접근 가능
 */
export const authAsyncHandler = (
  fn: (req: any, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: any, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 여러 개의 비동기 미들웨어를 체이닝할 때 사용
 * 
 * @param middlewares - 비동기 미들웨어 함수들의 배열
 * @returns 체이닝된 미들웨어 함수
 * 
 * @example
 * router.post('/tournaments', 
 *   chainAsyncHandlers([
 *     validateTournament,
 *     checkPermissions,
 *     createTournament
 *   ])
 * );
 */
export const chainAsyncHandlers = (
  middlewares: Array<(req: Request, res: Response, next: NextFunction) => Promise<any>>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    let index = 0;

    const executeNext = (): void => {
      if (index >= middlewares.length) {
        return;
      }

      const middleware = middlewares[index++];
      
      Promise.resolve(middleware(req, res, (error?: any) => {
        if (error) {
          next(error);
        } else {
          executeNext();
        }
      })).catch(next);
    };

    executeNext();
  };
};

/**
 * 조건부 비동기 핸들러
 * 특정 조건을 만족할 때만 핸들러를 실행
 * 
 * @param condition - 실행 조건을 확인하는 함수
 * @param handler - 조건을 만족할 때 실행할 핸들러
 * @param fallback - 조건을 만족하지 않을 때 실행할 핸들러 (선택사항)
 * 
 * @example
 * router.get('/admin-only', 
 *   conditionalAsyncHandler(
 *     (req) => req.user?.role === 'admin',
 *     async (req, res) => {
 *       // 관리자 전용 로직
 *       res.json({ adminData: true });
 *     },
 *     (req, res) => {
 *       res.status(403).json({ error: 'Admin access required' });
 *     }
 *   )
 * );
 */
export const conditionalAsyncHandler = (
  condition: (req: Request) => boolean,
  handler: (req: Request, res: Response, next: NextFunction) => Promise<any>,
  fallback?: (req: Request, res: Response, next: NextFunction) => void
) => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (condition(req)) {
      await handler(req, res, next);
    } else if (fallback) {
      fallback(req, res, next);
    } else {
      next();
    }
  });
};

/**
 * 캐시된 비동기 핸들러
 * 결과를 메모리에 캐시하여 동일한 요청에 대해 빠른 응답 제공
 * 
 * @param handler - 캐시할 핸들러
 * @param keyGenerator - 캐시 키를 생성하는 함수
 * @param ttl - 캐시 유효 시간 (밀리초)
 * 
 * @example
 * const cachedUserHandler = cachedAsyncHandler(
 *   async (req, res) => {
 *     const users = await User.findAll();
 *     res.json(users);
 *   },
 *   (req) => `users-${req.query.page || 1}`,
 *   60000 // 1분 캐시
 * );
 */
const cache = new Map<string, { data: any; expires: number }>();

export const cachedAsyncHandler = (
  handler: (req: Request, res: Response, next: NextFunction) => Promise<any>,
  keyGenerator: (req: Request) => string,
  ttl: number = 60000
) => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const cacheKey = keyGenerator(req);
    const cached = cache.get(cacheKey);
    
    if (cached && cached.expires > Date.now()) {
      return res.json(cached.data);
    }
    
    // 원래 res.json을 래핑하여 캐시에 저장
    const originalJson = res.json;
    res.json = function(data: any) {
      cache.set(cacheKey, {
        data,
        expires: Date.now() + ttl
      });
      
      // 캐시 정리 (메모리 누수 방지)
      if (cache.size > 1000) {
        const now = Date.now();
        for (const [key, value] of cache.entries()) {
          if (value.expires <= now) {
            cache.delete(key);
          }
        }
      }
      
      return originalJson.call(this, data);
    };
    
    await handler(req, res, next);
  });
};

/**
 * 시간 제한이 있는 비동기 핸들러
 * 지정된 시간 내에 완료되지 않으면 타임아웃 에러 발생
 * 
 * @param handler - 시간 제한을 적용할 핸들러
 * @param timeout - 타임아웃 시간 (밀리초)
 * 
 * @example
 * router.get('/slow-operation', 
 *   timeoutAsyncHandler(
 *     async (req, res) => {
 *       const result = await slowDatabaseOperation();
 *       res.json(result);
 *     },
 *     5000 // 5초 타임아웃
 *   )
 * );
 */
export const timeoutAsyncHandler = (
  handler: (req: Request, res: Response, next: NextFunction) => Promise<any>,
  timeout: number = 30000
) => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timeout after ${timeout}ms`));
      }, timeout);
    });
    
    await Promise.race([
      handler(req, res, next),
      timeoutPromise
    ]);
  });
};

/**
 * 재시도 기능이 있는 비동기 핸들러
 * 실패 시 지정된 횟수만큼 재시도
 * 
 * @param handler - 재시도할 핸들러
 * @param retries - 최대 재시도 횟수
 * @param delay - 재시도 간격 (밀리초)
 * 
 * @example
 * router.post('/external-api', 
 *   retryAsyncHandler(
 *     async (req, res) => {
 *       const result = await callExternalAPI(req.body);
 *       res.json(result);
 *     },
 *     3, // 3번 재시도
 *     1000 // 1초 간격
 *   )
 * );
 */
export const retryAsyncHandler = (
  handler: (req: Request, res: Response, next: NextFunction) => Promise<any>,
  retries: number = 3,
  delay: number = 1000
) => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        await handler(req, res, next);
        return; // 성공 시 종료
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < retries) {
          // 재시도 전 대기
          await new Promise(resolve => setTimeout(resolve, delay));
          console.warn(`Request failed, retrying... (${attempt + 1}/${retries})`);
        }
      }
    }
    
    // 모든 재시도 실패 시 마지막 에러 throw
    throw lastError!;
  });
};

// 기본 export
export default asyncHandler;