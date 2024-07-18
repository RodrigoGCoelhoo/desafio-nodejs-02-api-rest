import { FastifyInstance } from 'fastify'
import { boolean, z } from 'zod'
import { randomUUID } from 'node:crypto'
import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function mealsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (request) => {
    console.log(`[${request.method}] ${request.url}`)
  })

  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const { sessionId } = request.cookies

      const meals = await knex('meals')
        .join('users', 'meals.userId', 'users.id')
        .where('users.session_id', sessionId)
        .select('meals.*')

      return { meals }
    },
  )

  app.post(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const createMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        eaten_at: z.string(),
        diet: boolean(),
      })

      const {
        name,
        description,
        eaten_at: eatenAt,
        diet,
      } = createMealBodySchema.parse(request.body)

      const { sessionId } = request.cookies

      const [user] = await knex('users')
        .select('id')
        .where('session_id', sessionId)

      await knex('meals').insert({
        id: randomUUID(),
        name,
        description,
        eaten_at: eatenAt,
        diet,
        userId: user.id,
      })

      return reply.status(201).send()
    },
  )

  app.put(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const updateMealBodySchema = z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        eaten_at: z.string().optional(),
        diet: boolean().optional(),
      })
      const updateMealBodyParams = z.object({
        id: z.string(),
      })

      const { sessionId } = request.cookies

      const { id } = updateMealBodyParams.parse(request.params)

      const {
        name,
        description,
        eaten_at: eatenAt,
        diet,
      } = updateMealBodySchema.parse(request.body)

      const meal = await knex('meals').where('id', id).select('*')

      const [user] = await knex('users')
        .select('id')
        .where('session_id', sessionId)

      if (meal[0].userId !== user.id) {
        return reply.status(403).send()
      }

      await knex('meals').where('id', id).update({
        name,
        description,
        eaten_at: eatenAt,
        diet,
      })

      return reply.status(200).send()
    },
  )

  app.delete(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const updateMealBodyParams = z.object({
        id: z.string(),
      })

      const { sessionId } = request.cookies

      const { id } = updateMealBodyParams.parse(request.params)

      const [user] = await knex('users')
        .select('id')
        .where('session_id', sessionId)

      const meal = await knex('meals').where('id', id).select('*')

      if (meal[0].userId !== user.id) {
        return reply.status(403).send()
      }

      await knex('meals').where('id', id).delete()

      return reply.status(200).send()
    },
  )

  app.get(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const updateMealBodyParams = z.object({
        id: z.string(),
      })

      const { sessionId } = request.cookies

      const { id } = updateMealBodyParams.parse(request.params)

      const [user] = await knex('users')
        .select('id')
        .where('session_id', sessionId)

      const meal = await knex('meals').where('id', id).select('*')

      if (meal[0].userId !== user.id) {
        return reply.status(403).send()
      }

      return reply.status(200).send({ meal })
    },
  )

  app.get(
    '/summary',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const { sessionId } = request.cookies

      const [user] = await knex('users')
        .select('id')
        .where('session_id', sessionId)

      const meals = await knex('meals').where('userId', user.id).select('*')

      const bodyResponse = {
        totalMeals: meals.length,
        totalMealsOnDiet: meals.filter((meal) => meal.diet).length,
        totalMealsNotOnDiet: meals.filter((meal) => !meal.diet).length,
        dietStreak: 0,
      }

      return reply.status(200).send({ summary: bodyResponse })
    },
  )
}
