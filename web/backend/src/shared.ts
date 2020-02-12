import { ISchema } from '@patarapolw/qsearch'

try {
  const env = require('dotenv').config({
    path: '../backend/.env'
  })
  console.info(Object.keys(env.parsed))
} catch (e) {
  console.info('Not using dotenv')
}

export const schema: ISchema = {
  frequency: { type: 'number' },
  name: {},
  description: {},
  isCool: { type: 'boolean' },
  date: { type: 'date' },
  'data.a': { isAny: false },
  'data.b': { isAny: false },
  h: { isAny: false }
}

export function serialize (obj: any) {
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

export function deserialize (s: string) {
  return JSON.parse(
    s,
    (_, v) => (Array.isArray(v) && v[0] === '__date__') ? new Date(v[1]) : v
  )
}

export function clone<T> (obj: T): T {
  return deserialize(serialize(obj))
}
