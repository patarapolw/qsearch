import express from 'express'
import morgan from 'morgan'
import history from 'connect-history-api-fallback'

import apiRouter from './api'
import './shared'

const app = express()
const port = process.env.PORT || '3001'

app.use(morgan('dev'))

app.use(history())
app.use(express.static('./public'))

app.use('/assets', express.static('./assets'))
app.use('/api', apiRouter)

app.listen(port, () => {
  console.info(`Server is running at http://localhost:${port}`)
})
