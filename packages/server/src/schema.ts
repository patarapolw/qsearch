import { prop, Table, Entity } from 'liteorm'

@Entity({ name: 'entry' })
class DbEntry {
  @prop({ type: 'float', null: true }) frequency?: number
  @prop({ null: true }) name?: string
  @prop({ null: true }) description?: string
  @prop({ null: true }) isCool?: boolean
  @prop({ null: true }) date?: Date
  @prop({ null: true }) data?: { a?: string, b?: string }
  @prop() h!: string
}

export const dbEntry = new Table(DbEntry)
