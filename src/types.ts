import {
  AbstractDatabaseOptions,
} from 'abstract-level'
import {
  type RedisClientType as _RedisClientType,
  type RedisClientOptions,
  type RedisModules,
  type RedisFunctions,
  type RedisScripts,
} from 'redis'

export type RedisClientType = _RedisClientType<RedisModules, RedisFunctions, RedisScripts>

export type RedisLevelOptions<K, V> = {
  redis: RedisClientOptions | RedisClientType
  debug?: boolean
  namespace?: string
} & AbstractDatabaseOptions<K, V>

export type BatchOperation = BatchPutOperation | BatchDelOperation

/**
 * A _put_ operation to be committed by a {@link RedisLevel}.
 */
export type BatchPutOperation = {
  /**
   * Type of operation.
   */
  type: 'put'

  /**
   * Key of the entry to be added to the database.
   */
  key: string

  /**
   * Value of the entry to be added to the database.
   */
  value: string
}

/**
 * A _del_ operation to be committed by a {@link RedisLevel}.
 */
export type BatchDelOperation = {
  /**
   * Type of operation.
   */
  type: 'del'

  /**
   * Key of the entry to be deleted from the database.
   */
  key: string
}

export type ClearOptions<KDefault> = {
  gt?: KDefault
  gte?: KDefault
  lt?: KDefault
  lte?: KDefault
  limit: number
  reverse: boolean
  keyEncoding: string
  valueEncoding: string
}

export type IteratorOptions<KDefault> = {
  offset: number
  limit: number
  keyEncoding: string
  valueEncoding: string
  reverse: boolean
  keys: boolean
  values: boolean
  gt?: KDefault
  gte?: KDefault
  lt?: KDefault
  lte?: KDefault
  debug: boolean
}
