import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary()
    table.text('firstName').notNullable()
    table.text('lastName').notNullable()
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.uuid('session_id').after('id').index()
  })

  await knex.schema.createTable('meals', (table) => {
    table.uuid('id').primary()
    table.text('name').notNullable()
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('eaten_at').notNullable()
    table.boolean('diet').notNullable()
    table.uuid('userId').references('id').inTable('users').notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('users')
  await knex.schema.dropTable('meals')
}
