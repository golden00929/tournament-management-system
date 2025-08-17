import { Request, Response } from 'express';

export const notFound = (req: Request, res: Response) => {
  return res.status(404).json({
    success: false,
    message: `요청한 경로 ${req.originalUrl}를 찾을 수 없습니다.`,
    error: 'NOT_FOUND'
  });
};