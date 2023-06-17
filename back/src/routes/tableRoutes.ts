import express, { Request, Response } from 'express'
import { z } from 'zod'
import { exclude } from '../utils'
import { prisma } from '../lib/prisma'
import { Encrypt } from '../lib/encrypt'
import { isValidObjectId } from 'mongoose'
import jwt from 'jsonwebtoken'
import { privateKey } from '../constants/auth'
import { Roles } from '../constants/roles'
import { validateUser, validateRole } from '../middleware/authorizations'

const routes = express.Router()

routes.get('/', validateUser(), async (req: Request, res: Response) => {
  try {
    const data = await prisma.table.findMany()

    return res.send(data)
  } catch (error) {
    return res.status(500).send(error)
  }
})

routes.post('/', validateUser(), async (req: Request, res: Response) => {
  const bodyParse = z.object({
    alias: z.string(),
  })

  const { alias } = bodyParse.parse(req.body)
  const user = res.locals.user as { id: string; roles: string[] }

  try {
    const data = await prisma.table.create({
      data: { alias, userId: user.id },
    })

    return res.send(data)
  } catch (error) {
    return res.status(500).send(error)
  }
})

routes.delete('/:id', validateRole(Roles.ADMIN), async (req: Request, res: Response) => {
  const paramParse = z.object({
    id: z.string(),
  })
  const { id } = paramParse.parse(req.params)
  const data = await prisma.table.findMany()

  return res.send(data)
})

export default routes
