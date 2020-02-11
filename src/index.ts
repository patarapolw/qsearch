import shlex from 'shlex'
import escapeRegexp from 'escape-string-regexp'

export type ISchema = Record<string, {
  type?: 'string' | 'number' | 'date' | 'boolean'
  isAny?: boolean
}>

export interface IQSearchResult {
  cond: any
  nonSchema: string[]
}

export default class QSearch {
  constructor (
    public options: {
      schema?: ISchema
      nonSchemaKeys?: string[]
      /**
       * Default to
       * 
       * ```js
       * (d: any) => d ? new Date(d) : null
       * ```
       * 
       * Set to `false` to set `(d: any) => d`, or non-conversion
       * or create your own, perhaps using moment.js
       */
      normalizeDates?: boolean | ((d: any) => Date | string | null)
    } = {}
  ) {}

  get schema () {
    return this.options.schema || {} as ISchema
  }

  get nonSchemaKeys () {
    return new Set<string>(this.options.nonSchemaKeys || [])
  }

  normalizeDates (d: any): Date |  string | null {
    const fn = this.options.normalizeDates instanceof Function
      ? this.options.normalizeDates
      : this.options.normalizeDates === false
        ? (d: any) => d
        : ((d: any) => d ? new Date(d) : null)
    return fn(d)
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
        let isDate = false

        if (v && this.schema[k]) {
          if (this.schema[k].type === 'number') {
            v = parseFloat(v)
          } else if (this.schema[k].type === 'date') {
            if (v === 'NOW') {
              v = new Date()
            } else {
              const vMillisec = (() => {
                const [_, p1, p2] = /^([+-]?\d+(?:\.\d+))([yMwdhm])$/i.exec(v) || []
                const v0 = +new Date()
                if (p2 === 'y') {
                  return v0 + parseFloat(p1) * 365 * 24 * 60 * 60 * 1000  // 365d 24h 60m 60s 1000ms
                } else if (p2 === 'M') {
                  return v0 + parseFloat(p1) * 30 * 24 * 60 * 60 * 1000  // 30d 24h 60m 60s 1000ms
                } else if (p2 === 'w') {
                  return v0 + parseFloat(p1) * 7 * 24 * 60 * 60 * 1000  // 7d 24h 60m 60s 1000ms
                } else if (p2 === 'd') {
                  return v0 + parseFloat(p1) * 24 * 60 * 60 * 1000  // 24h 60m 60s 1000ms
                } else if (p2 === 'h') {
                  return v0 + parseFloat(p1) * 60 * 60 * 1000  // 60m 60s 1000ms
                } else if (p2 === 'm') {
                  return v0 + parseFloat(p1) * 60 * 1000  // 60s 1000ms
                }
                return null
              })()

              v = vMillisec ? new Date(vMillisec) : v
            }

            v = this.normalizeDates(v)
            isDate = true
          }
        }

        if (op === '+') {
          return { [k]: v }
        } else if (op === '-') {
          if (opK === '>' && (typeof v === 'number' || isDate)) {
            v = { [k]: { $lte: v } }
          } else if (opK === '<' && (typeof v === 'number' || isDate)) {
            v = { [k]: { $gte: v } }
          } else {
            v = { $ne: v }
          }

          return { [k]: v }
        } else {
          if (typeof v === 'string' && !isDate) {
            v = { [k]: { $regex: new RegExp(escapeRegexp(v), 'i') } }
          } else if (opK === '>' && (typeof v === 'number' || isDate)) {
            v = { [k]: { $gt: v } }
          } else if (opK === '<' && (typeof v === 'number' || isDate)) {
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
