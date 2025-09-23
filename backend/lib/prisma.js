const { PrismaClient } = require('@prisma/client');

const globalForPrisma = global;

// Build DATABASE_URL with connection pool parameters
const buildDatabaseUrl = () => {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) return baseUrl;

  const url = new URL(baseUrl);

  // Add connection pool parameters as query parameters
  url.searchParams.set('connection_limit', process.env.DB_POOL_SIZE || '10');
  url.searchParams.set('connect_timeout', process.env.DB_CONNECTION_TIMEOUT || '10');
  url.searchParams.set('pool_timeout', process.env.DB_IDLE_TIMEOUT || '30');

  return url.toString();
};

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
    datasources: {
      db: {
        url: buildDatabaseUrl(),
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = prisma;