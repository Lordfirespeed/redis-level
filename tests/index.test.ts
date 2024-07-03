import test from "tape";
import type { AbstractDatabaseOptions } from "abstract-level"
// @ts-ignore
import suite from "abstract-level/test"

import { RedisLevel } from "@/index";


suite({
  test,
  factory(options: AbstractDatabaseOptions<string, string>) {
    return new RedisLevel({
      ...options,
      redis: {
        url: "redis://localhost:6379"
      },
      namespace: crypto.randomUUID()
    })
  }
})
