// eslint-disable-next-line
import { Knex } from 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    users: {
      id: string
      firstName: string
      lastName: string
      created_at: string
      session_id: string
    }
    meals: {
      id: string
      name: string
      description: string
      created_at: string
      eaten_at: string
      diet: boolean
      userId: string
    }
  }
}
