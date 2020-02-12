import fs from 'fs'

import { Router } from 'express'
import { String, Undefined, Record } from 'runtypes'
import Loki from 'lokijs'
import mongodb, { MongoClient } from 'mongodb'
import NeDB from 'nedb-promises'
import QSearch from '@patarapolw/qsearch'
import dotProp from 'dot-prop'
import serialize from 'serialize-javascript'

import { schema, deserialize } from './shared'

const apiRouter = Router()
if (process.env.NODE_ENV === 'development') {
  try {
    apiRouter.use(require('cors')())
  } catch (e) {
    console.info('CORS is disabled.')
  }
}

let loki: Loki
let mongoClient: MongoClient
let nedb: NeDB

const qSearch = new QSearch({
  schema,
  /**
   * allows `is:unique`
   */
  nonSchemaKeys: ['is']
})

apiRouter.get('/lokijs', async (req, res, next) => {
  try {
    if (!loki) {
      await new Promise(resolve => {
        loki = new Loki('assets/db.loki', {
          autoload: true,
          autoloadCallback: resolve
        })
      })
    }

    const col = loki.getCollection('q')

    const { offset, limit, sort, order, r } = parseQuery(req.query)

    if (r.nonSchema.includes('is:unique')) {
      const data = sortBy(Object.values(col.find(r.cond).reduce((acc, c) => {
        return acc[c.h] ? acc : { ...acc, [c.h]: c }
      }, {} as any)), sort || '$loki', order === 'desc')

      return res.json({
        data: data.slice(offset, offset + limit),
        count: data.length,
        cond: serialize(r.cond)
      })
    } else {
      const data = col.chain()
        .find(r.cond)
        .simplesort(sort || '$loki', { desc: order === 'desc' })
        .offset(offset)
        .limit(limit)
        .data()
      const count = col.count(r.cond)

      return res.json({ data, count, cond: serialize(r.cond) })
    }
  } catch (e) {
    return next(e)
  }
})

apiRouter.get('/nedb', async (req, res, next) => {
  try {
    if (!nedb) {
      nedb = NeDB.create({ filename: 'assets/db.nedb' })
    }
    const { offset, limit, sort, order, r } = parseQuery(req.query)

    if (r.nonSchema.includes('is:unique')) {
      const data = sortBy(Object.values((await nedb.find(r.cond)).reduce((acc, c: any) => {
        return acc[c.h] ? acc : { ...acc, [c.h]: c }
      }, {} as any)), sort || '_id', order === 'desc')

      return res.json({
        data: data.slice(offset, offset + limit),
        count: data.length,
        cond: serialize(r.cond)
      })
    } else {
      const data = await nedb.find(r.cond)
        .sort({ [sort || '_id']: order === 'desc' ? -1 : 1 })
        .skip(offset)
        .limit(limit)
      const count = await nedb.count(r.cond)

      return res.json({ data, count, cond: serialize(r.cond) })
    }
  } catch (e) {
    return next(e)
  }
})

apiRouter.get('/mongodb', async (req, res, next) => {
  try {
    if (!mongoClient) {
      mongoClient = await mongodb.connect(process.env.MONGO_URI!, { useNewUrlParser: true, useUnifiedTopology: true })
    }

    const col = mongoClient.db('search').collection('q')

    const { offset, limit, sort, order, r } = parseQuery(req.query)

    if (r.nonSchema.includes('is:unique')) {
      const ids = (await col.aggregate([
        { $match: r.cond },
        { $group: { _id: '$h', id: { $first: '$_id' } } },
        { $project: { _id: 0 } }
      ]).toArray()).map((el) => el.id)

      const data = await col.aggregate([
        { $match: { _id: { $in: ids } } },
        { $sort: { [sort || '_id']: order === 'desc' ? -1 : 1 } },
        { $skip: offset },
        { $limit: limit }
      ]).toArray()

      const count = (await col.aggregate([
        { $match: { _id: { $in: ids } } },
        { $count: 'count' }
      ]).toArray())[0].count

      return res.json({ data, count, cond: serialize(r.cond) })
    } else {
      const data = await col.find(r.cond)
        .sort({ [sort || '_id']: order === 'desc' ? -1 : 1 })
        .skip(offset)
        .limit(limit)
        .toArray()
      const count = await col.find(r.cond).count()

      return res.json({ data, count, cond: serialize(r.cond) })
    }
  } catch (e) {
    return next(e)
  }
})

apiRouter.get('/native', async (req, res, next) => {
  try {
    const col = deserialize(fs.readFileSync('assets/db.json', 'utf8')) as any[]
    const { q, offset, limit, sort, order, r } = parseQuery(req.query)

    let data = qSearch.filter(q, col)

    if (r.nonSchema.includes('is:unique')) {
      data = Object.values(data.reduce((acc, c: any) => {
        return acc[c.h] ? acc : { ...acc, [c.h]: c }
      }, {} as any))
    }

    return res.json({
      data: sortBy(data, sort || '_id', order === 'desc').slice(offset, offset + limit),
      count: data.length,
      cond: serialize(r.cond)
    })
  } catch (e) {
    return next(e)
  }
})

function parseQuery (query: any) {
  const { q = '', offset: offsetStr, limit: limitStr, sort, order } = Record({
    q: String.Or(Undefined),
    offset: String,
    limit: String.Or(Undefined),
    sort: String.Or(Undefined),
    order: String
  }).check(query)

  const offset = parseInt(offsetStr)
  const limit = parseInt(limitStr || '') || 5

  const r = qSearch.parse(q)
  console.dir(r.cond, { depth: null })

  return { q, offset, limit, sort, order, r }
}

function sortBy (arr: any[], key: string, desc?: boolean) {
  /**
   * https://docs.mongodb.com/manual/reference/method/cursor.sort/
   */
  const sortPriority = {
    unknown: -1,
    undefined: 0,
    null: 2,
    number: 3,
    string: 4,
    plainObject: 5,
    array: 6,
    boolean: 9,
    date: 10
  }

  function getType (a: any) {
    if (a === null) {
      return 'null'
    }

    const t = typeof a
    if (a) {
      if (Array.isArray(a)) {
        return 'array'
      } else if (t === 'object') {
        if (a instanceof Date) {
          return 'date'
        } else if (a.toString() === '[object Object]') {
          return 'plainObject'
        }
      }
    }

    if (Object.keys(sortPriority).includes(t)) {
      return t as keyof typeof sortPriority
    }

    return 'unknown'
  }

  arr = arr.sort((a, b) => {
    const m = dotProp.get<any>(a, key)
    const n = dotProp.get<any>(b, key)

    const tM = getType(m)
    const tN = getType(n)

    if (tM === tN) {
      if (tM === 'string') {
        return m.localeCompare(n)
      } else if (['date', 'number', 'boolean'].includes(tM)) {
        return m - n
      }
    }

    return sortPriority[tM] - sortPriority[tN]
  })

  return desc ? arr.reverse() : arr
}

export default apiRouter
