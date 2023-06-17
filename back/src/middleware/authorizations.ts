import { Request, Response, NextFunction } from 'express'
import jwt, { JsonWebTokenError, NotBeforeError, TokenExpiredError } from 'jsonwebtoken'
// import { Roles } from '../constants/roles'
import { privateKey } from '../constants/auth'
import { Role, User } from '@prisma/client'
import { Roles } from '../constants/roles'

interface UserInfo extends User {
  roles: Array<Role['name']>
}

export const validateRole = (role: Roles) => {
  return (req: Request<{ userInfo: string }>, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (token == null) return res.sendStatus(401)

    jwt.verify(token, privateKey, (err, userInfo) => {
      if (err instanceof TokenExpiredError) {
        return res.status(401).send({ message: 'Unauthorized! Access Token was expired!' })
      }
      if (err instanceof NotBeforeError) {
        return res.status(401).send({ message: 'jwt not active' })
      }
      if (err instanceof JsonWebTokenError) {
        return res.status(401).send({ message: 'jwt malformed' })
      }
      if (err || !(userInfo as UserInfo)?.roles?.includes(role)) return res.sendStatus(403)

      next()
    })
  }
}

export const validateUser = () => {
  return (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (token == null) return res.sendStatus(401)

    jwt.verify(token, privateKey, (err, userInfo) => {
      if (err instanceof TokenExpiredError) {
        return res.status(401).send({ message: 'Unauthorized! Access Token was expired!' })
      }
      if (err instanceof NotBeforeError) {
        return res.status(401).send({ message: 'jwt not active' })
      }
      if (err instanceof JsonWebTokenError) {
        return res.status(401).send({ message: 'jwt malformed' })
      }
      if (err) return res.sendStatus(403)

      res.locals.user = userInfo
      next()
    })
  }
}
