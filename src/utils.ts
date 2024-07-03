import { RedisClientOptions } from "redis";

import type { IteratorOptions, RedisClientType } from "@/types";

export function queryFromOptions(key: string, options: IteratorOptions<any>): Parameters<RedisClientType["zRange"]> {
  let query: Parameters<RedisClientType["zRange"]> = [key, '-', '+', {
    BY: "LEX",
    REV: options.reverse ? true : undefined
  }]

  const lowerBound = options.gte !== undefined ? options.gte : options.gt !== undefined ? options.gt : '-'
  const exclusiveLowerBound = options.gte === undefined && options.gt !== undefined
  const upperBound = options.lte !== undefined ? options.lte : options.lt !== undefined ? options.lt : '+'
  const exclusiveUpperBound = options.lte === undefined && options.lt !== undefined
  const noLowerBound = lowerBound === '-' || lowerBound === '+'
  const noUpperBound = upperBound === '-' || upperBound === '+'
  if (options.reverse) {
    query[1] = noUpperBound ? upperBound : exclusiveUpperBound ? `(${upperBound}` : `[${upperBound}`
    query[2] = noLowerBound ? lowerBound : exclusiveLowerBound ? `(${lowerBound}` : `[${lowerBound}`
  } else {
    query[1] = noLowerBound ? lowerBound : exclusiveLowerBound ? `(${lowerBound}` : `[${lowerBound}`
    query[2] = noUpperBound ? upperBound : exclusiveUpperBound ? `(${upperBound}` : `[${upperBound}`
  }

  query[3] = {
    BY: "LEX",
    REV: options.reverse ? true : undefined
  }

  if (options.limit !== Infinity) {
    query[3] = {
      ...(query[3]),
      LIMIT: {
        offset: options.offset,
        count: options.limit,
      },
    }
  }

  return query
}

export function isRedisClient(redis: RedisClientOptions | RedisClientType): redis is RedisClientType {
  if (typeof redis !== 'object') return false;
  if (!('hmget' in redis)) return false;
  if (typeof redis.hmget !== 'function') return false;
  return true;
}