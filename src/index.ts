import shlex from 'shlex'
import escapeRegexp from 'escape-string-regexp'

export type ISchema = Record<string, {
  type?: 'string' | 'number'
  isAny?: boolean
}>

export interface IQSearchResult {
  cond: any
  nonSchema: string[]
}

export default class QSearch {
  constructor (
    public options: {
      schema?: Record<string, {
        type?: 'string' | 'number'
        isAny?: boolean
      }>
      nonSchemaKeys?: string[]
    } = {}
  ) {}

  get schema () {
    return this.options.schema || {} as ISchema
  }

  get nonSchemaKeys () {
    return new Set<string>(this.options.nonSchemaKeys || [])
  }

  parse (q: string): IQSearchResult {
    const cond = {
      $or: [] as any[]
    }

    const $and = [] as any[]
    const nonSchema = [] as string[]

    shlex.split(q).map((el) => {
      const [op] = /^[-+?]/.exec(el) || [] as string[]
      if (op) {
        el = el.substr(1)
      }

      const addOp = (k: string, opK: string, v: any) => {
        if (v && this.schema[k]) {
          if (this.schema[k].type === 'number') {
            v = parseFloat(v)
          }
        }

        if (op === '+') {
          return { [k]: v }
        } else if (op === '-') {
          if (typeof v === 'number' && opK === '>') {
            v = { [k]: { $lte: v } }
          } else if (typeof v === 'number' && opK === '<') {
            v = { [k]: { $gte: v } }
          } else {
            v = { $ne: v }
          }

          return { [k]: v }
        } else {
          if (typeof v === 'string') {
            v = { [k]: { $regex: new RegExp(escapeRegexp(v), 'i') } }
          } else if (typeof v === 'number' && opK === '>') {
            v = { [k]: { $gt: v } }
          } else if (typeof v === 'number' && opK === '<') {
            v = { [k]: { $lt: v } }
          } else {
            v = { [k]: v }
          }

          return v
        }
      }

      const [k, opK, v] = el.split(/([:><])(.+)/)
      if (this.nonSchemaKeys.has(k)) {
        nonSchema.push(el)
        return
      }

      let subCond: any = null

      if (v) {
        subCond = addOp(k, opK, v)
      } else if (this.schema) {
        subCond = {
          $or: Object.entries(this.schema)
            .filter(([_, v0]) => (!v0.type || v0.type === 'string') && v0.isAny !== false)
            .map(([k0, _]) => addOp(k0, opK, k))
            .filter((c) => c)
        }
      }

      if (subCond) {
        if (op === '?') {
          cond.$or.push(subCond)
        } else {
          $and.push(subCond)
        }
      }
    })

    if ($and.length > 0) {
      cond.$or.push({ $and })
    }

    return { cond, nonSchema }
  }
}
