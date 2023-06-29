import express, { Request, Response } from 'express'
import { z } from 'zod'
import { exclude } from '../utils'
import { prisma } from '../lib/prisma'
import { Encrypt } from '../lib/encrypt'
import { isValidObjectId } from 'mongoose'
import jwt from 'jsonwebtoken'
import { privateKey } from '../constants/auth'
import { Roles } from '../constants/roles'
import { validateRole } from '../middleware/authorizations'

const routes = express.Router()

routes.get('/', validateRole(Roles.ADMIN), async (req: Request, res: Response) => {
  let data
  try {
    data = await prisma.user.findMany()
  } catch (error) {
    return res.status(500).send(error)
  }

  data.forEach((user) => {
    exclude(user, ['password'])
  })

  return res.send(data)
})

routes.post('/', validateRole(Roles.ADMIN), async (req: Request, res: Response) => {
  const bodyParse = z.object({
    userName: z.string(),
    password: z.string(),
    name: z.string(),
    roles: z.string().array(),
  })

  const { userName, name, password, roles } = bodyParse.parse(req.body)

  let checkRoles = []
  try {
    checkRoles = await prisma.role.findMany({
      where: {
        id: {
          in: roles ?? [],
        },
      },
    })

    if (checkRoles.length <= 0 || roles.length != checkRoles.length) return res.status(400).send('No roles found')
  } catch (error) {
    return res.send(error).status(400)
  }

  const cryptPassword = await Encrypt.cryptPassword(password)

  try {
    const data = await prisma.user.create({
      data: { userName, password: cryptPassword, name, rolesId: checkRoles.map((r) => r.id) },
    })

    await prisma.role.updateMany({ where: { id: { in: roles } }, data: { usersId: data.id } })

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

  let user

  try {
    user = await prisma.user.findUniqueOrThrow({
      where: {
        userName,
      },
    })
  } catch (error) {
    return res.status(400).send({ message: 'User not found' })
  }

  const isValid = await Encrypt.comparePassword(password, user.password)

  if (!isValid) return res.status(401).send()

  const roles = await prisma.role.findMany({ where: { id: { in: user.rolesId } } })

  const replacedUser = exclude(user, ['password', 'rolesId'])

  const userInfo = { ...replacedUser, roles: roles.map((r) => r.name) }

  jwt.sign(
    { id: userInfo.id, roles: userInfo.roles },
    privateKey,
    {
      expiresIn: '1d',
    },
    (err, token) => {
      if (err) return res.status(500).json({ message: 'Error creating JWT' })

      return res.set('x-access-token', token).status(200).send(userInfo)
    }
  )
})

routes.delete('/:id', validateRole(Roles.ADMIN), async (req: Request, res: Response) => {
  const paramParse = z.object({
    id: z.string(),
  })
  const { id } = paramParse.parse(req.params)

  const isIDValid = isValidObjectId(id)
  if (!isIDValid) return res.status(400).send({ message: `Invalid ID provided` })

  try {
    const user = await prisma.user.findFirstOrThrow({ where: { id } })

    // const roles = await prisma.role.findMany({ where: { id: { in: user.rolesId } } })
    // Promise.all([user.rolesId.map((id) => prisma.role.update({ where: { id }, data: { usersId: { set } } }))])
    // await prisma.role.updateMany({ where: { id: { in: user.rolesId } }, data: { usersId: { set } } })
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
