import express, { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { validateRole } from '../middleware/authorizations'
import { Roles } from '../constants/roles'

const routes = express.Router()

routes.get('/', validateRole(Roles.ADMIN), async (req: Request, res: Response) => {
  const data = await prisma.role.findMany()
  return res.send(data)
})

routes.post('/', validateRole(Roles.ADMIN), async (req: Request, res: Response) => {
  const bodyParse = z.object({
    name: z.string(),
  })

  const { name } = bodyParse.parse(req.body)

  try {
    const data = await prisma.role.create({ data: { name } })
    return res.send(data)
  } catch (error) {
    return res.send(error).status(400)
  }
})

export default routes
