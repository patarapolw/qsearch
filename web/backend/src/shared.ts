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
