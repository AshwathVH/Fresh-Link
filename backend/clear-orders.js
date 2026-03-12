const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearOrders() {
  try {
    const result = await prisma.order.deleteMany({});
    console.log(`✅ Successfully deleted ${result.count} orders from the database`);
  } catch (error) {
    console.error('❌ Error deleting orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearOrders();
