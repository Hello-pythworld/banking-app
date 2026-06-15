import { Request, Response } from 'express';
import * as authService from './authService';
import { AuthRequest } from '../middleware/authMiddleware';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      res.status(400).json({ message: '이메일, 비밀번호, 이름은 필수입니다' });
      return;
    }
    const result = await authService.register({ email, password, name });
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: '이메일과 비밀번호는 필수입니다' });
      return;
    }
    const result = await authService.login({ email, password });
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
}

export async function getProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const user = await authService.getProfile(userId);
    res.json(user);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
}
