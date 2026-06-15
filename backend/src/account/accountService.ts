import { PrismaClient } from '@prisma/client';

type AccountType = 'CHECKING' | 'SAVINGS';

const prisma = new PrismaClient();

function generateAccountNumber(): string {
  const rand = Math.floor(Math.random() * 9000) + 1000;
  const rand2 = Math.floor(Math.random() * 9000) + 1000;
  return `1000-${rand}-${rand2}`;
}

export async function getAccounts(userId: number) {
  return prisma.account.findMany({
    where: { userId, status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAccountById(id: number, userId: number) {
  const account = await prisma.account.findFirst({
    where: { id, userId },
    include: {
      sentTransactions: { orderBy: { createdAt: 'desc' }, take: 10 },
      receivedTransactions: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });
  if (!account) throw new Error('계좌를 찾을 수 없습니다');
  return account;
}

export async function createAccount(userId: number, type: AccountType) {
  const accountNumber = generateAccountNumber();
  return prisma.account.create({
    data: { userId, accountNumber, type },
  });
}

export async function closeAccount(id: number, userId: number) {
  const account = await prisma.account.findFirst({ where: { id, userId } });
  if (!account) throw new Error('계좌를 찾을 수 없습니다');
  if (account.balance > 0) throw new Error('잔액이 있는 계좌는 해지할 수 없습니다');

  return prisma.account.update({
    where: { id },
    data: { status: 'CLOSED' },
  });
}

export async function deposit(id: number, userId: number, amount: number) {
  if (amount <= 0) throw new Error('입금액은 0보다 커야 합니다');
  const account = await prisma.account.findFirst({ where: { id, userId, status: 'ACTIVE' } });
  if (!account) throw new Error('계좌를 찾을 수 없습니다');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.account.update({
      where: { id },
      data: { balance: { increment: amount } },
    });
    await tx.transaction.create({
      data: { toAccountId: id, amount, type: 'DEPOSIT', description: '입금' },
    });
    return updated;
  });
}

export async function withdraw(id: number, userId: number, amount: number) {
  if (amount <= 0) throw new Error('출금액은 0보다 커야 합니다');
  const account = await prisma.account.findFirst({ where: { id, userId, status: 'ACTIVE' } });
  if (!account) throw new Error('계좌를 찾을 수 없습니다');
  if (account.balance < amount) throw new Error('잔액이 부족합니다');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.account.update({
      where: { id },
      data: { balance: { decrement: amount } },
    });
    await tx.transaction.create({
      data: { fromAccountId: id, amount, type: 'WITHDRAWAL', description: '출금' },
    });
    return updated;
  });
}

export async function transfer(
  fromId: number,
  userId: number,
  toAccountNumber: string,
  amount: number,
  description?: string
) {
  if (amount <= 0) throw new Error('이체금액은 0보다 커야 합니다');

  const fromAccount = await prisma.account.findFirst({
    where: { id: fromId, userId, status: 'ACTIVE' },
  });
  if (!fromAccount) throw new Error('출금 계좌를 찾을 수 없습니다');
  if (fromAccount.balance < amount) throw new Error('잔액이 부족합니다');

  const toAccount = await prisma.account.findFirst({
    where: { accountNumber: toAccountNumber, status: 'ACTIVE' },
  });
  if (!toAccount) throw new Error('입금 계좌를 찾을 수 없습니다');
  if (fromAccount.id === toAccount.id) throw new Error('같은 계좌로 이체할 수 없습니다');

  return prisma.$transaction(async (tx) => {
    await tx.account.update({ where: { id: fromId }, data: { balance: { decrement: amount } } });
    await tx.account.update({ where: { id: toAccount.id }, data: { balance: { increment: amount } } });
    await tx.transaction.create({
      data: {
        fromAccountId: fromId,
        toAccountId: toAccount.id,
        amount,
        type: 'TRANSFER',
        description: description || '이체',
      },
    });
    return tx.account.findUnique({ where: { id: fromId } });
  });
}
