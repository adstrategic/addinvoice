/**
 * Redis connection options for BullMQ.
 * BullMQ uses its own ioredis; we pass options so it creates connections internally.
 */
export interface RedisConnectionOptions {
  host?: string;
  maxRetriesPerRequest: null | number;
  password?: string;
  port?: number;
  url?: string;
}

export function getProducerConnectionOptions(): RedisConnectionOptions {
  const url = process.env.REDIS_URL;
  if (url) {
    return { maxRetriesPerRequest: 20, url };
  }
  return {
    host: process.env.REDIS_HOST ?? "localhost",
    maxRetriesPerRequest: 20,
    password: process.env.REDIS_PASSWORD ?? undefined,
    port: Number(process.env.REDIS_PORT) || 6379,
  };
}

export function getWorkerConnectionOptions(): RedisConnectionOptions {
  const url = process.env.REDIS_URL;
  if (url) {
    return { maxRetriesPerRequest: null, url };
  }
  return {
    host: process.env.REDIS_HOST ?? "localhost",
    maxRetriesPerRequest: null,
    password: process.env.REDIS_PASSWORD ?? undefined,
    port: Number(process.env.REDIS_PORT) || 6379,
  };
}
