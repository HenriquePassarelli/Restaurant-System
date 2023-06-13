import express, { Request, Response } from 'express'
import { z } from 'zod'
import { exclude } from '../utils'
import { prisma } from '../lib/prisma'
import { Encrypt } from '../lib/encrypt'
import { isValidObjectId } from 'mongoose'
import jwt from 'jsonwebtoken'

const routes = express.Router()

routes.get('/', async (req: Request, res: Response) => {
  const data = await prisma.user.findMany()

  data.forEach((user) => {
    exclude(user, ['password'])
  })

  return res.send(data)
})

routes.post('/', async (req: Request, res: Response) => {
  const bodyParse = z.object({
    userName: z.string(),
    password: z.string(),
    name: z.string(),
    roles: z.string().array(),
  })

  const { userName, name, password, roles } = bodyParse.parse(req.body)

  // validate roles

  let checkRoles = []
  try {
    checkRoles = await prisma.role.findMany({
      where: {
        id: {
          in: roles ?? [],
        },
      },
    })

    if (checkRoles.length <= 0) return res.status(400).send('No roles found')
  } catch (error) {
    return res.send(error).status(400)
  }

  const cryptPassword = await Encrypt.cryptPassword(password)

  try {
    const data = await prisma.user.create({
      data: { userName, password: cryptPassword, name, rolesId: checkRoles.map((r) => r.id) },
    })
    return res.send(exclude(data, ['password']))
  } catch (error) {
    return res.send(error).status(400)
  }
})

routes.post('/login', async (req: Request, res: Response) => {
  const bodyParse = z.object({
    userName: z.string(),
    password: z.string(),
  })
  const { userName, password } = bodyParse.parse(req.body)

  const user = await prisma.user.findUniqueOrThrow({
    where: {
      userName,
    },
  })

  const isValid = await Encrypt.comparePassword(password, user.password)

  if (!isValid) return res.status(401).send()

  const privateKey = process.env.PRIVATE_KEY || 'privatekey'

  const noPasswordUser = exclude(user, ['password'])

  jwt.sign(noPasswordUser, privateKey, (err, token) => {
    if (err) return res.status(500).json({ message: 'Error creating JWT' })

    return res.set('x-access-token', token).status(200).send(noPasswordUser)
  })
})

routes.delete('/:id', async (req: Request, res: Response) => {
  const paramParse = z.object({
    id: z.string(),
  })
  const { id } = paramParse.parse(req.params)

  const isIDValid = isValidObjectId(id)
  if (!isIDValid) return res.status(400).send({ message: `Invalid ID provided` })

  try {
    await prisma.user.findFirstOrThrow({ where: { id } })
  } catch (err) {
    return res.status(404).send({ message: (err as Error)?.message })
  }

  try {
    await prisma.user.delete({
      where: {
        id,
      },
    })
  } catch (err) {
    return res.status(404).send({ message: (err as Error)?.message })
  }

  return res.send({ message: 'deleted user' })
})

export default routes
