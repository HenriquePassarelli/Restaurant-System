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

routes.get('/', validateUser, async (req: Request, res: Response) => {
  const data = await prisma.table.findMany()

  return res.send(data)
})

routes.post('/', validateUser, async (req: Request, res: Response) => {
  const data = await prisma.table.findMany()

  return res.send(data)
})

routes.delete('/:id', validateRole(Roles.ADMIN), async (req: Request, res: Response) => {
  const paramParse = z.object({
    id: z.string(),
  })
  const { id } = paramParse.parse(req.params)
  const data = await prisma.table.findMany()

  return res.send(data)
})
