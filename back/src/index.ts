import express, { Express } from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import usersRoutes from './routes/usersRoutes'
import rolesRoutes from './routes/rolesRoutes'
import bodyParser from 'body-parser'

dotenv.config()

const port = process.env.PORT || 3000

const server: Express = express()
server.use(cors())
server.use(express.urlencoded({ extended: true }))
server.use(express.json())
server.use(bodyParser.json())
server.use(morgan('dev'))

// server.use('/', (_, res) => {
//   return res.send('Working').end()
// })

server.use('/user', usersRoutes)
server.use('/role', rolesRoutes)

server.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
