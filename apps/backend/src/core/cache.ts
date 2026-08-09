/**
 * Shared Redis cache client for non-BullMQ uses (e.g. document preview pages).
 */

import { Redis } from "ioredis";

import { getProducerConnectionOptions } from "../queue/connection.js";

let cacheClient: Redis | null = null;

function createRedisFromOptions(): Redis {
  const options = getProducerConnectionOptions();
  if (options.url) {
    return new Redis(options.url, {
      maxRetriesPerRequest: options.maxRetriesPerRequest,
    });
  }
  return new Redis({
    host: options.host,
    maxRetriesPerRequest: options.maxRetriesPerRequest,
    password: options.password,
    port: options.port,
  });
}

/**
 * Lazy singleton Redis client for application caching.
 */
export function getCache(): Redis {
  if (!cacheClient) {
    cacheClient = createRedisFromOptions();
  }
  return cacheClient;
}
