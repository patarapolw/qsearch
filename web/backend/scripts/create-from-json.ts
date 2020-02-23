import fs from 'fs'

import { Db } from 'liteorm'
import { Serialize } from 'any-serialize'

import { dbEntry } from '../src/schema'

const ser = new Serialize()

/**
 * Populate 10,000 entries
 */
async function main () {
  const allEntries: any[] = ser.parse(fs.readFileSync('assets/db.json', 'utf8'))

  // ;(async () => {
  //   const db = NeDB.create({ filename: 'assets/db.nedb' })
  //   await db.insert(clone(allEntries))
  // })().catch(console.error)

  // ;(async () => {
  //   const db = new Loki('assets/db.loki')
  //   await new Promise((resolve, reject) => db.loadDatabase({}, (err) => err ? reject(err) : resolve()))
  //   const col = db.addCollection('q')
  //   col.insert(clone(allEntries))
  //   await new Promise((resolve, reject) => db.save((err) => err ? reject(err) : resolve()))
  //   await new Promise((resolve, reject) => db.close((err) => err ? reject(err) : resolve()))
  // })().catch(console.error)

  // ;(async () => {
  //   const client = await mongo.connect(process.env.MONGO_URI!, { useNewUrlParser: true, useUnifiedTopology: true })
  //   const col = client.db('search').collection('q')
  //   await col.insertMany(clone(allEntries))
  //   await client.close()
  // })().catch(console.error)

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
