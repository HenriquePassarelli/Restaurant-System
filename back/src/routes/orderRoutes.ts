import express, { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { isValidObjectId } from 'mongoose'
import { Roles } from '../constants/roles'
import { validateUser, validateRole } from '../middleware/authorizations'

const routes = express.Router()

routes.get('/', validateUser(), async (req: Request, res: Response) => {
  const data = await prisma.order.findMany({})
  return res.send(data)
})

routes.get('/:id', validateUser(), async (req: Request, res: Response) => {
  const paramParse = z.object({
    id: z.string(),
  })
  const { id } = paramParse.parse(req.params)
  if (!isValidObjectId(id)) return res.status(400).send('Id is not a valid')
  try {
    const data = await prisma.order.findUniqueOrThrow({ where: { id } })
    return res.send(data)
  } catch (error) {
    return res.status(500).send('order not found')
  }
})

routes.post('/', validateUser(), async (req: Request, res: Response) => {
  const bodyParse = z.object({
    items: z.string().array().nonempty(),
    tableId: z.string(),
  })

  const { items, tableId } = bodyParse.parse(req.body)
  const user = res.locals.user as { id: string; roles: string[] }

  if (!items.every((i) => isValidObjectId(i)) || !isValidObjectId(tableId)) return res.status(404).send('Invalid ids')

  try {
    const table = await prisma.table.findUniqueOrThrow({ where: { id: tableId } })
    const data = await prisma.order.create({
      data: { items, tableId },
    })

    table.ordersId = [...new Set([...table.ordersId, data.id])]

    console.log(table.ordersId)

    await prisma.table.update({
      where: { id: table.id },
      data: { ordersId: table.ordersId, userId: user.id, updatedAt: new Date() },
    })

    return res.send(data)
  } catch (error) {
    return res.status(500).send('error creating order')
  }
})

routes.delete('/:id', validateRole(Roles.ADMIN), async (req: Request, res: Response) => {
  const paramParse = z.object({
    id: z.string(),
  })
  const { id } = paramParse.parse(req.params)

  if (!isValidObjectId(id)) return res.status(400).send('Id is not a valid')

  try {
    const data = await prisma.order.delete({ where: { id } })

    const table = await prisma.table.findFirstOrThrow({ where: { id: data.tableId } })
    table.ordersId = table.ordersId.filter((o) => o != data.id)

    await prisma.table.update({
      where: { id: table.id },
      data: {
        ordersId: table.ordersId,
      },
    })

    return res.status(200).send('Order deleted successfully')
  } catch (error) {
    return res.status(500).send(error)
  }
})

export default routes
