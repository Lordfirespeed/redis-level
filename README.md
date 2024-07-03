# redis-level

**An [`abstract-level`](https://github.com/Level/abstract-level) database backed by [Redis](https://npmjs.com/package/redis).**

> :pushpin: What is `abstract-level`? Head over to the [FAQ](https://github.com/Level/community#faq).

[![level badge](https://leveljs.org/img/badge.svg)](https://github.com/Level/awesome)
[![npm](https://img.shields.io/npm/v/redis-level.svg)](https://www.npmjs.com/package/redis-level)
[![Node version](https://img.shields.io/node/v/redis-level.svg)](https://www.npmjs.com/package/classic-level)
[![Biome](https://img.shields.io/badge/Biome-informational?logo=biome\&logoColor=fff)]([https://standardjs.com](https://biomejs.dev/))

## Usage

```js
const { RedisLevel } = require('redis-level')

// Create a database
const db = new RedisLevel({
  redis: {
    url: "redis://localhost:6379"
  }
})

// Add an entry with key 'a' and value 'foo'
await db.put('a', 'foo')

// Add multiple entries
await db.batch([{ type: 'put', key: 'b', value: 'bar' }])

// Get value of key 'a': 'foo'
const value = await db.get('a')

// Iterate entries with keys that are greater than 'a'
for await (const [key, value] of db.iterator({ gt: 'a' })) {
  console.log(value) // bar
}
```

All asynchronous methods also support callbacks.

<details><summary>Callback example</summary>

```js
db.put('example', { hello: 'world' }, (err) => {
  if (err) throw err

  db.get('example', (err, value) => {
    if (err) throw err
    console.log(value) // { hello: 'world' }
  })
})
```

</details>
