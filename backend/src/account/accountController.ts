import { Response } from 'express';
import * as accountService from './accountService';
import { AuthRequest } from '../middleware/authMiddleware';

export async function getAccounts(req: AuthRequest, res: Response): Promise<void> {
  try {
    const accounts = await accountService.getAccounts(req.user!.userId);
    res.json(accounts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function getAccountById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const account = await accountService.getAccountById(Number(req.params.id), req.user!.userId);
    res.json(account);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
}

export async function createAccount(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { type } = req.body;
    if (!type || !['CHECKING', 'SAVINGS'].includes(type)) {
      res.status(400).json({ message: '계좌 종류는 CHECKING 또는 SAVINGS여야 합니다' });
      return;
    }
    const account = await accountService.createAccount(req.user!.userId, type as 'CHECKING' | 'SAVINGS');
    res.status(201).json(account);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

export async function closeAccount(req: AuthRequest, res: Response): Promise<void> {
  try {
    const account = await accountService.closeAccount(Number(req.params.id), req.user!.userId);
    res.json(account);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

export async function deposit(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { amount } = req.body;
    const account = await accountService.deposit(Number(req.params.id), req.user!.userId, amount);
    res.json(account);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

export async function withdraw(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { amount } = req.body;
    const account = await accountService.withdraw(Number(req.params.id), req.user!.userId, amount);
    res.json(account);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

export async function transfer(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { toAccountNumber, amount, description } = req.body;
    const account = await accountService.transfer(
      Number(req.params.id),
      req.user!.userId,
      toAccountNumber,
      amount,
      description
    );
    res.json(account);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}
