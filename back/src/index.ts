import express, { Express } from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import bodyParser from 'body-parser'
import usersRoutes from './routes/usersRoutes'
import rolesRoutes from './routes/rolesRoutes'
import productsRoutes from './routes/productsRoutes'
import tableRoutes from './routes/tableRoutes'

dotenv.config()

const port = process.env.PORT || 3000

const server: Express = express()
server.use(cors())
server.use(express.urlencoded({ extended: true }))
server.use(express.json())
server.use(bodyParser.json())
server.use(morgan('dev'))

server.use('/user', usersRoutes)
server.use('/role', rolesRoutes)
server.use('/products', productsRoutes)
server.use('/table', tableRoutes)

server.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
