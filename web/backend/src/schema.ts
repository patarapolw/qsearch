import { prop, Table } from 'liteorm'

@Table({ name: 'entry' })
export class DbEntry {
  @prop({ type: 'float', null: true }) frequency?: number | null
  @prop({ type: 'string', null: true }) name?: string | null
  @prop({ type: 'string', null: true }) description?: string | null
  @prop({ type: 'boolean', null: true }) isCool?: boolean | null
  @prop({ type: 'datetime', null: true }) date?: Date | null
  @prop({ type: 'JSON', null: true }) data?: { a?: string | null, b?: string | null } | null
  @prop() h!: string
}
