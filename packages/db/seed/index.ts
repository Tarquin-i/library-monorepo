import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { user, account } from '../schema/user.entity';
import { hashPassword, generateRandomString } from 'better-auth/crypto';
import { eq } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL!);

async function seed() {
  console.log('👤 开始创建超管数据...');

  const adminEmail = '1@1.cc';
  const adminPassword = 'admin123';
  const adminName = '超级管理员';

  // 检查是否已存在
  const existing = await db
    .select()
    .from(user)
    .where(eq(user.email, adminEmail))
    .limit(1);

  if (existing.length > 0) {
    console.log('⚠️  超管用户已存在，跳过创建');
    process.exit(0);
  }

  const userId = generateRandomString(32, 'a-z', '0-9', 'A-Z');
  const accountId = generateRandomString(32, 'a-z', '0-9', 'A-Z');
  const hashedPassword = await hashPassword(adminPassword);

  // 插入 user 记录
  await db.insert(user).values({
    id: userId,
    name: adminName,
    email: adminEmail,
    emailVerified: true,
    role: 'admin',
  });

  // 插入 account 记录（邮箱密码登录方式）
  await db.insert(account).values({
    id: accountId,
    accountId: userId,
    providerId: 'credential',
    userId: userId,
    password: hashedPassword,
  });

  console.log('✅ 超管用户创建成功');
  console.log(`   邮箱: ${adminEmail}`);
  console.log(`   密码: ${adminPassword}`);
  console.log(`   角色: admin`);

  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ 种子脚本执行失败:', err);
  process.exit(1);
});
