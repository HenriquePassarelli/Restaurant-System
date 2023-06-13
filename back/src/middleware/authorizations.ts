import { Express, Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
// function authUser(req: Request, res: Response, next: NextFunction) {
//   if (req.user == null) {
//     res.status(403)
//     return res.send('You need to sign in')
//   }

//   next()
// }

export const validateRole = (role: string) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      res.status(401)
      return res.send('Not allowed')
    }

    next()
  }
}

const privateKey = process.env.PRIVATE_KEY || 'privatekey'

export const validateUser = (req: Request<{ userInfo: string }>, res: Response, next: NextFunction) => {
  console.log(req.headers)
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (token == null) return res.sendStatus(401)

  jwt.verify(token, privateKey, (err, userInfo) => {
    if (err) return res.sendStatus(403)

    req.userInfo = userInfo
    next()
  })
}
