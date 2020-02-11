const { spawnSafe } = require('./utils')

;(async () => {
  await spawnSafe('yarn', ['build'], {
    cwd: `${__dirname}/../backend`
  })

  await spawnSafe('yarn', ['build'], {
    cwd: `${__dirname}/../frontend`
  })
})().catch(console.error)
