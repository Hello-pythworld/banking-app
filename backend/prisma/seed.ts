import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: hashedPassword,
      name: '홍길동',
      accounts: {
        create: [
          {
            accountNumber: '1000-0001-0001',
            balance: 1000000,
            type: 'CHECKING',
          },
          {
            accountNumber: '1000-0001-0002',
            balance: 5000000,
            type: 'SAVINGS',
          },
        ],
      },
    },
  });

  console.log('시드 데이터 생성 완료:', user.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
