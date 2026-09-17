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
    log: [
      { level: 'error', emit: 'event' },
      { level: 'warn', emit: 'event' },
      { level: 'query', emit: 'event' }
    ],
    datasources: {
      db: {
        url: buildDatabaseUrl(),
      },
    },
  });

// Log Prisma errors
prisma.$on('error', (e) => {
  console.error('🔴 [Prisma] Error event:', e);
});

prisma.$on('warn', (e) => {
  console.warn('⚠️ [Prisma] Warning:', e.message);
});

// Log slow queries (>100ms)
prisma.$on('query', (e) => {
  if (e.duration > 100) {
    console.warn(`⏱️ [Prisma] Slow query (${e.duration}ms): ${e.query.substring(0, 100)}...`);
  }
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Monitor Prisma connection health
setInterval(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    // Health check failed silently
  }
}, 60000); // Every minute

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