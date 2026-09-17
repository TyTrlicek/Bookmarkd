// No Redis in the Lambda architecture — every read is a miss, every
// write/delete is a no-op. Callers in cache.js/rankingCache.js/routes
// treat this exactly like an always-cold cache.
const redis = {
  get: async () => null,
  set: async () => 'OK',
  del: async () => 0,
  keys: async () => [],
  info: async () => '',
  ping: async () => 'PONG',
  on: () => {},
};

module.exports = redis;
