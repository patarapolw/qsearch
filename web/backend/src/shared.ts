try {
  const env = require('dotenv').config({
    path: '../backend/.env'
  })
  console.info(Object.keys(env.parsed))
} catch (e) {
  console.info('Not using dotenv')
}
