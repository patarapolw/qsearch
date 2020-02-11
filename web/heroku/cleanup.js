const path = require('path')
const { spawnSafe } = require('./utils')

;(async () => {
  await spawnSafe('git', [
    'worktree',
    'remove',
    '-f',
    path.resolve(__dirname, '../dist')
  ])

  await spawnSafe('git', [
    'branch',
    '-D',
    'heroku'
  ])
})().catch(console.error)
