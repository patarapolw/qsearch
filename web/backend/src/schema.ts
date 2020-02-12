import fs from 'fs'

import faker from 'faker'
import NeDB from 'nedb-promises'
import Loki from 'lokijs'
import mongo from 'mongodb'
import stringify from 'fast-json-stable-stringify'
import SparkMD5 from 'spark-md5'

import './shared'

/**
 * Types to check are -- Number (whole, decimal), String, Boolean, Date, Null, Undefined
 */
function getEntry () {
  return {
    frequency: faker.random.number(500) === 0
      ? faker.random.arrayElement([null, undefined])
      : faker.random.number(1e6) / 1e5,
    name: faker.random.number(500) === 0
      ? faker.random.arrayElement([null, undefined])
      : faker.name.findName(),
    description: faker.random.number(500) === 0
      ? faker.random.arrayElement([null, undefined])
      : faker.lorem.paragraph(),
    isCool: faker.random.number(10) === 0
      ? faker.random.arrayElement([null, undefined])
      : faker.random.arrayElement([true, false]),
    date: faker.random.number(500) === 0
      ? faker.random.arrayElement([null, undefined])
      : faker.date.between(new Date(2000, 1), new Date(2030, 12)),
    data: faker.random.number(500) === 0
      ? faker.random.arrayElement([null, undefined])
      : {
        a: faker.random.number(500) === 0
          ? faker.random.arrayElement([null, undefined])
          : faker.name.findName(),
        b: faker.random.number(500) === 0
          ? faker.random.arrayElement([null, undefined])
          : faker.name.findName()
      }
  }
}

/**
 * Populate 10,000 entries
 */
async function main () {
  const allEntries: any[] = []
  Array.from({ length: 9000 }).map(() => {
    const entry = getEntry()
    allEntries.push({ ...entry, h: hash(entry) })
  })
  Array.from({ length: 1000 }).map(() => {
    allEntries.push(faker.random.arrayElement(allEntries))
  })

  fs.writeFileSync('assets/db.json', serialize(allEntries))

  ;(async () => {
    const db = NeDB.create({ filename: 'assets/db.nedb' })
    await db.insert(clone(allEntries))
  })().catch(console.error)

  ;(async () => {
    const db = new Loki('assets/db.loki')
    await new Promise((resolve, reject) => db.loadDatabase({}, (err) => err ? reject(err) : resolve()))
    const col = db.addCollection('q')
    col.insert(clone(allEntries))
    await new Promise((resolve, reject) => db.save((err) => err ? reject(err) : resolve()))
    await new Promise((resolve, reject) => db.close((err) => err ? reject(err) : resolve()))
  })().catch(console.error)

  ;(async () => {
    const client = await mongo.connect(process.env.MONGO_URI!, { useNewUrlParser: true, useUnifiedTopology: true })
    const col = client.db('search').collection('q')
    await col.insertMany(clone(allEntries))
    await client.close()
  })().catch(console.error)
}

function serialize (obj: any) {
  return JSON.stringify(
    obj,
    function (k, v) {
      if (this[k] instanceof Date) {
        return ['__date__', +this[k]]
      }
      return v
    }
  )
}

function deserialize (s: string) {
  return JSON.parse(
    s,
    (_, v) => (Array.isArray(v) && v[0] === '__date__') ? new Date(v[1]) : v
  )
}

function clone<T> (obj: T): T {
  return deserialize(serialize(obj))
}

function hash (obj: any) {
  return SparkMD5.hash(stringify(obj))
}

if (require.main === module) {
  main().catch(console.error)
}