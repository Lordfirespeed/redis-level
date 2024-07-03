import { AbstractLevel, type AbstractOpenOptions } from 'abstract-level'
import { createClient } from 'redis'

import type {
  BatchOperation,
  ClearOptions,
  IteratorOptions,
  RedisClientType,
  RedisLevelOptions,
} from "@/types";
import { queryFromOptions, isRedisClient } from "@/utils";
import { RedisIterator } from "@/iterator";


export class RedisLevel<KDefault = string, VDefault = string> extends AbstractLevel<string, KDefault, VDefault> {
  public readonly redis: RedisClientType
  public readonly hKey: string
  public readonly zKey: string
  private readonly debug: boolean

  constructor({ redis, namespace: _namespace, debug, ...options }: RedisLevelOptions<KDefault, VDefault>) {
    super({ encodings: { utf8: true }, snapshots: false }, options)
    this.redis = isRedisClient(redis)
      ? redis
      : createClient(redis)
    const namespace = _namespace ?? 'level'
    this.hKey = `${namespace}:h`
    this.zKey = `${namespace}:z`
    this.debug = debug ?? false
  }

  async _open(options: AbstractOpenOptions) {
    if (this.debug) {
      console.log('RedisLevel#_open')
    }
    await this.redis.connect()
  }

  async _close() {
    if (this.debug) {
      console.log('RedisLevel#_close')
    }
    await this.redis.disconnect()
  }

  async _get(key: string, options: { keyEncoding: 'utf8', valueEncoding: 'utf8' }) {
    if (this.debug) {
      console.log('RedisLevel#_get', key)
    }
    return await this.redis.hGet(this.hKey, key) ?? undefined
  }

  async _getMany(keys: string[], options: { keyEncoding: 'utf8', valueEncoding: 'utf8 '}) {
    if (this.debug) {
      console.log('RedisLevel#_getMany', keys)
    }
    const results = await this.redis.hmGet(this.hKey, keys)
    return results.map(value => value ?? undefined)
  }

  async _put(key: string, value: string, options: { keyEncoding: 'utf8', valueEncoding: 'utf8'}) {
    if (this.debug) {
      console.log('RedisLevel#_put', key, value)
    }
    await this.redis.multi()
      .hSet(this.hKey, { [key]: value })
      .zAdd(this.zKey, { score: 0, value: key })
      .exec()
  }

  async _del(key: Buffer, options: any) {
    if (this.debug) {
      console.log('RedisLevel#_del', key)
    }
    await this.redis.multi()
      .hDel(this.hKey, key)
      .zRem(this.zKey, key)
      .exec()
  }

  async _batch(batch: BatchOperation[], options: any): Promise<void> {
    if (this.debug) {
      console.log('RedisLevel#_batch', batch)
    }
    if (batch.length === 0) return

    const transaction = this.redis.multi()
    for (const op of batch) {
      if (op.type === 'put') {
        transaction.hSet(this.hKey, { [op.key]: op.value })
        transaction.zAdd(this.zKey, { score: 0, value: op.key })
      } else if (op.type === 'del') {
        transaction.hDel(this.hKey, op.key)
        transaction.zRem(this.zKey, op.key)
      }
    }
    await transaction.exec()
  }

  async _clear(options: ClearOptions<KDefault>): Promise<void> {
    if (this.debug) {
      console.log('RedisLevel#_clear', options)
    }
    const entriesToClearCount = options.limit !== Infinity && options.limit >= 0 ? options.limit : Infinity
    let fetchOffset = 0
    const fetchLimit = 100
    let totalEntriesClearedCount = 0
    while (totalEntriesClearedCount < entriesToClearCount) {
      const query = queryFromOptions(this.zKey, {debug: false, keys: true, values: false, ...options, offset: fetchOffset, limit: fetchLimit })
      let keys = await this.redis.zRange(...query)

      if (!keys || keys.length === 0) {
        break
      }

      if (keys.length + totalEntriesClearedCount > entriesToClearCount) {
        keys = keys.slice(0, entriesToClearCount - totalEntriesClearedCount)
      }

      await this.redis.multi()
        .hDel(this.hKey, keys)
        .zRem(this.zKey, keys)
        .exec()

      fetchOffset += fetchLimit
      totalEntriesClearedCount += keys.length
    }
  }

  _iterator(
    options: IteratorOptions<KDefault>
  ): RedisIterator<KDefault, VDefault> {
    return new RedisIterator<KDefault, VDefault>(this, { ...options, debug: this.debug })
  }
}