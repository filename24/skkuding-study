import 'dotenv/config';
import { PrismaClient, ChickenType, OrderStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Prisma 시드 데이터 생성 시작...');

  // 기존 데이터 초기화 (외래키 제약조건 고려하여 역순 삭제)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.chicken.deleteMany();

  // 1. 치킨 데이터 생성
  const chickens = [
    {
      name: '성대통닭 율전본점',
      type: ChickenType.FRIED,
      price: 18000,
      address: '경기 수원시 장안구 율전로108번길 11',
      phone: '031-290-0001',
      stock: 15,
      version: 0,
      spicyLevel: 0,
    },
    {
      name: '황금올리브 율전역점',
      type: ChickenType.SEASONED,
      price: 20000,
      address: '경기 수원시 장안구 서부로 2100',
      phone: '031-290-0002',
      stock: 10,
      version: 0,
      spicyLevel: 2,
    },
    {
      name: '마늘치킨 성균관대점',
      type: ChickenType.GARLIC,
      price: 21000,
      address: '경기 수원시 장안구 일월로 77',
      phone: '031-290-0003',
      stock: 8,
      version: 0,
      spicyLevel: 1,
    },
    {
      name: '율전간장치킨 화서점',
      type: ChickenType.SOY,
      price: 19000,
      address: '경기 수원시 팔달구 수성로 150',
      phone: '031-290-0004',
      stock: 5,
      version: 0,
      spicyLevel: 0,
    },
    {
      name: '허니콤보 정자점',
      type: ChickenType.HONEY,
      price: 22000,
      address: '경기 수원시 장안구 정자로 55',
      phone: '031-290-0005',
      stock: 12,
      version: 0,
      spicyLevel: 0,
    },
  ];

  const createdChickens = [];
  for (const chicken of chickens) {
    const created = await prisma.chicken.create({ data: chicken });
    createdChickens.push(created);
  }
  console.log(`✅ 치킨 ${createdChickens.length}곳 등록 완료`);

  // 2. 주문 및 주문 항목 데이터 생성 (페이지네이션 및 관계 조회 테스트용 15건)
  for (let i = 1; i <= 15; i++) {
    const selectedChicken = createdChickens[(i - 1) % createdChickens.length];
    const quantity = (i % 3) + 1;
    const totalPrice = selectedChicken.price * quantity;

    await prisma.order.create({
      data: {
        customerId: `customer-${i}`,
        status: i % 4 === 0 ? OrderStatus.PENDING : OrderStatus.COMPLETED,
        totalPrice,
        items: {
          create: [
            {
              chickenId: selectedChicken.id,
              quantity,
              price: selectedChicken.price,
            },
          ],
        },
      },
    });
  }

  console.log(`✅ 주문 15건 및 주문 상품 등록 완료`);
  console.log('🌱 Prisma 시드 데이터 생성 완료!');
}

main()
  .catch((e) => {
    console.error('❌ 시드 생성 중 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
