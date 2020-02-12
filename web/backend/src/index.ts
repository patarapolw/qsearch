import express from 'express'
import morgan from 'morgan'

import apiRouter from './api'
import './shared'

const app = express()
const port = process.env.PORT || '3001'

app.use(morgan('dev'))

app.use(express.static('./public'))
app.use('/api', apiRouter)

app.listen(port, () => {
  console.info(`Server is running at http://localhost:${port}`)
})
