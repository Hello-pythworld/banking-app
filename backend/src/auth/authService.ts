import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/hash';
import { signToken } from '../utils/jwt';

const prisma = new PrismaClient();

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export async function register(dto: RegisterDto) {
  const existing = await prisma.user.findUnique({ where: { email: dto.email } });
  if (existing) throw new Error('이미 사용중인 이메일입니다');

  const hashed = await hashPassword(dto.password);
  const user = await prisma.user.create({
    data: { email: dto.email, password: hashed, name: dto.name },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  const token = signToken({ userId: user.id, email: user.email });
  return { user, token };
}

export async function login(dto: LoginDto) {
  const user = await prisma.user.findUnique({ where: { email: dto.email } });
  if (!user) throw new Error('이메일 또는 비밀번호가 올바르지 않습니다');

  const valid = await comparePassword(dto.password, user.password);
  if (!valid) throw new Error('이메일 또는 비밀번호가 올바르지 않습니다');

  const token = signToken({ userId: user.id, email: user.email });
  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
}

export async function getProfile(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, createdAt: true },
  });
  if (!user) throw new Error('사용자를 찾을 수 없습니다');
  return user;
}

export async function updateName(userId: number, name: string) {
  if (!name.trim()) throw new Error('이름을 입력해주세요');
  return prisma.user.update({
    where: { id: userId },
    data: { name: name.trim() },
    select: { id: true, email: true, name: true, createdAt: true },
  });
}

export async function changePassword(userId: number, currentPassword: string, newPassword: string) {
  if (newPassword.length < 6) throw new Error('새 비밀번호는 6자 이상이어야 합니다');

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('사용자를 찾을 수 없습니다');

  const valid = await comparePassword(currentPassword, user.password);
  if (!valid) throw new Error('현재 비밀번호가 올바르지 않습니다');

  const hashed = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
}
