/**
 * Redis connection options for BullMQ.
 * BullMQ uses its own ioredis; we pass options so it creates connections internally.
 */
export type RedisConnectionOptions = {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  maxRetriesPerRequest: number | null;
};

export function getProducerConnectionOptions(): RedisConnectionOptions {
  const url = process.env.REDIS_URL;
  if (url) {
    return { url, maxRetriesPerRequest: 20 };
  }
  return {
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 20,
  };
}

export function getWorkerConnectionOptions(): RedisConnectionOptions {
  const url = process.env.REDIS_URL;
  if (url) {
    return { url, maxRetriesPerRequest: null };
  }
  return {
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
  };
}
