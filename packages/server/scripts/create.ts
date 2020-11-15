import fs from 'fs'

import faker from 'faker'
import NeDB from 'nedb-promises'
import Loki from 'lokijs'
import mongo from 'mongodb'
import { Db } from 'liteorm'
import { Serialize } from 'any-serialize'
import dotenv from 'dotenv'

import { dbEntry } from '../src/schema'

dotenv.config()
const ser = new Serialize()

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
  const allEntries: (ReturnType<typeof getEntry> & { h: string })[] = []
  Array.from({ length: 9000 }).map(() => {
    const entry = getEntry()
    allEntries.push({ ...entry, h: ser.hash(entry) })
  })
  Array.from({ length: 1000 }).map(() => {
    allEntries.push(faker.random.arrayElement(allEntries))
  })

  fs.writeFileSync('assets/db.json', ser.stringify(allEntries))

  ;(async () => {
    const db = NeDB.create({ filename: 'assets/db.nedb' })
    await db.insert(ser.clone(allEntries))
  })().catch(console.error)

  ;(async () => {
    const db = new Loki('assets/db.loki')
    await new Promise((resolve, reject) => db.loadDatabase({}, (err) => err ? reject(err) : resolve()))
    const col = db.addCollection('q')
    col.insert(ser.clone(allEntries))
    await new Promise((resolve, reject) => db.save((err) => err ? reject(err) : resolve()))
    await new Promise((resolve, reject) => db.close((err) => err ? reject(err) : resolve()))
  })().catch(console.error)

  ;(async () => {
    const client = await mongo.connect(process.env.MONGO_URI!, { useNewUrlParser: true, useUnifiedTopology: true })
    const col = client.db('search').collection('q')
    await col.insertMany(ser.clone(allEntries))
    await client.close()
  })().catch(console.error)

  ;(async () => {
    const db = await Db.connect('assets/db.sqlite')
    await db.init([dbEntry])

    await Promise.all(ser.clone(allEntries).map(async (el) => {
      try {
        await db.create(dbEntry)(el)
      } catch (e) {
        console.error(e)
      }
    }))

    await db.close()
  })().catch(console.error)
}

if (require.main === module) {
  main().catch(console.error)
}
