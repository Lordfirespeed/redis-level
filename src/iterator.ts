import { AbstractIterator } from "abstract-level";

import { RedisLevel } from "@/index";
import { IteratorOptions, type RedisClientType } from "@/types";
import { queryFromOptions } from "@/utils"

const DEFAULT_LIMIT = 50

export class RedisIterator<KDefault, VDefault> extends AbstractIterator<
  RedisLevel<KDefault, VDefault>,
  KDefault,
  VDefault
> {
  private readonly debug: boolean
  private readonly options: IteratorOptions<KDefault>

  private redis: RedisClientType
  private offset: number
  private readonly resultLimit: number
  private results: any[]
  private finished: boolean

  constructor(db: RedisLevel<KDefault, VDefault>, options: IteratorOptions<KDefault>) {
    super(db, options)
    this.redis = db.redis
    this.options = options
    this.resultLimit = options.limit !== Infinity && options.limit >= 0 ? options.limit : DEFAULT_LIMIT
    this.offset = options.offset || 0
    this.results = []
    this.finished = false
    this.debug = options.debug || false
  }

  async _next() {
    if (this.finished) {
      return undefined
    }

    const getResult = () => {
      const result = this.results.shift()
      if (this.debug) {
        console.log('result', result)
      }
      return result
    }

    if (this.results.length > 0) {
      return getResult()
    }

    const getKeys = this.options.keys
    const getValues = this.options.values
    const query = queryFromOptions(this.db.zKey, { ...this.options, offset: this.offset, limit: this.resultLimit })
    if (this.debug) {
      console.log('query', query)
    }
    const keys = await this.redis.zRange(...query)
    if (this.debug) {
      console.log('keys', keys)
    }
    if (!keys || keys.length === 0) {
      this.finished = true
      return undefined;
    }
    const values = getValues ? await this.redis.hmGet(this.db.hKey, keys) : null
    for (const [entryIndex, key] of keys.entries()) {
      const result = [
        getKeys ? key : undefined,
        getValues && values && values[entryIndex] !== undefined ? values[entryIndex] : undefined,
      ]
      this.results.push(result)
    }
    this.offset += this.resultLimit

    return getResult()
  }
}