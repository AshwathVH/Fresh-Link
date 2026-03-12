const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearProducts() {
  try {
    const result = await prisma.product.deleteMany({});
    console.log(`✅ Successfully deleted ${result.count} products from the database`);
  } catch (error) {
    console.error('❌ Error deleting products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearProducts();
