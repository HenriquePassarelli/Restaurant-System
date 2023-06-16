import express, { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { Roles } from '../constants/roles'
import { validateUser, validateRole } from '../middleware/authorizations'

const routes = express.Router()

routes.get('/', validateUser, async (req: Request, res: Response) => {
  const data = await prisma.product.findMany()

  return res.send(data)
})

routes.post('/', validateRole(Roles.ADMIN), async (req: Request, res: Response) => {
  const bodyParse = z.object({
    name: z.string(),
    price: z.number(),
    description: z.string().optional(),
  })
  const data = bodyParse.parse(req.body)

  try {
    const product = await prisma.product.create({ data: data })
    return res.send(product)
  } catch (error) {
    return res.status(400).send(error)
  }
})

routes.put('/', validateRole(Roles.ADMIN), async (req: Request, res: Response) => {
  const bodyParse = z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    description: z.string().optional(),
  })
  const { id, ...data } = bodyParse.parse(req.body)
  try {
    const product = await prisma.product.update({ where: { id }, data: data })
    return res.send(product)
  } catch (error) {
    return res.status(400).send(error)
  }
})

routes.delete('/:id', validateRole(Roles.ADMIN), async (req: Request, res: Response) => {
  const paramParse = z.object({
    id: z.string(),
  })
  const { id } = paramParse.parse(req.params)
  try {
    await prisma.product.delete({ where: { id } })
  } catch (error) {
    return res.status(400).send(error)
  }

  return res.send()
})

export default routes
