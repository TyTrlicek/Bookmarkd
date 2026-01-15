const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    console.log(`[Redis] Retry attempt ${times}, waiting ${delay}ms`);
    return delay;
  },
  reconnectOnError(err) {
    console.error('[Redis] Reconnect on error:', err.message);
    return true;
  }
});

redis.on('connect', () => {
  console.log('✅ [Redis] Connected');
});

redis.on('ready', () => {
  console.log('✅ [Redis] Ready to accept commands');
});

redis.on('error', (err) => {
  console.error('🔴 [Redis] Error:', err.message);
  console.error('Error code:', err.code);
  console.error('Error syscall:', err.syscall);
});

redis.on('close', () => {
  console.warn('⚠️ [Redis] Connection closed');
});

redis.on('reconnecting', (delay) => {
  console.log(`🔄 [Redis] Reconnecting in ${delay}ms...`);
});

redis.on('end', () => {
  console.warn('⚠️ [Redis] Connection ended (no more reconnections)');
});

// Monitor Redis connection health
setInterval(async () => {
  try {
    const status = redis.status;
    const memInfo = await redis.info('memory');
    const usedMemory = memInfo.match(/used_memory_human:(.+)/)?.[1]?.trim();
    console.log(`[Redis] Status: ${status}, Memory: ${usedMemory || 'unknown'}`);
  } catch (err) {
    console.error('[Redis] Health check failed:', err.message);
  }
}, 60000); // Every minute

module.exports = redis;
