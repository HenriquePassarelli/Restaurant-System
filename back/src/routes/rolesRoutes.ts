import express, { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { validateUser } from '../middleware/authorizations'

const routes = express.Router()

routes.get('/', validateUser, async (req: Request, res: Response) => {
  console.log(req.userInfo)
  const data = await prisma.role.findMany()
  return res.send(data)
})

routes.post('/', async (req: Request, res: Response) => {
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
