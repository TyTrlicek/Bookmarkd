const redis = require('../lib/redis');

(async () => {
  try {
    console.log('→ pinging Redis...');
    const pong = await redis.ping();
    console.log('PING ->', pong);

    await redis.set('test:key', 'hello-redis');
    const value = await redis.get('test:key');
    console.log('GET test:key ->', value);

    process.exit(0);
  } catch (err) {
    console.error('Redis test failed:', err);
    process.exit(1);
  }
})();
