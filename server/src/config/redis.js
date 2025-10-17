const Redis = require('ioredis');
const config = require('./index');

let redisClient = null;

const createRedisConnection = () => {
  if (redisClient) {
    return redisClient;
  }

  console.log('🔗 Connecting to Redis Cloud...');

  redisClient = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    enableReadyCheck: true,
    maxLoadingTimeout: 10000, // Increased for cloud connection
    lazyConnect: true,
    connectTimeout: 10000,    // 10 seconds timeout for initial connection
    commandTimeout: 5000,     // 5 seconds timeout for commands
    // Optimize for limited storage
    keyPrefix: 'ta-jobs:',    // Namespace to avoid conflicts
    compression: 'gzip',      // Compress data to save space
  });

  redisClient.on('connect', () => {
    console.log('✅ Redis Cloud connected successfully');
  });

  redisClient.on('ready', () => {
    console.log('✅ Redis Cloud is ready to accept commands');
  });

  redisClient.on('error', (err) => {
    console.error('❌ Redis Cloud connection error:', err.message);
    if (err.message.includes('ENOTFOUND') || err.message.includes('ECONNREFUSED')) {
      console.error('💡 Please check your REDIS_URL environment variable');
    }
  });

  redisClient.on('close', () => {
    console.log('📴 Redis Cloud connection closed');
  });

  redisClient.on('reconnecting', () => {
    console.log('🔄 Redis Cloud reconnecting...');
  });

  return redisClient;
};

const getRedisClient = () => {
  if (!redisClient) {
    return createRedisConnection();
  }
  return redisClient;
};

const closeRedisConnection = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('🔴 Redis connection closed gracefully');
  }
};

module.exports = {
  createRedisConnection,
  getRedisClient,
  closeRedisConnection,
};