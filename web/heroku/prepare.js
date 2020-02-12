const fs = require('fs')
const path = require('path')
const glob = require('glob')

const { spawnSafe } = require('./utils')

;(async () => {
  await spawnSafe('git', [
    'branch',
    'heroku'
  ])

  await spawnSafe('git', [
    'worktree',
    'add',
    path.resolve(__dirname, '../dist'),
    'heroku'
  ])

  await spawnSafe('git', ['rm', '-rf', '.'], {
    cwd: `${__dirname}/../dist`
  })

  glob.sync('**/*', {
    cwd: `${__dirname}/public`,
    dot: true
  }).map((f) => {
    fs.copyFileSync(`${__dirname}/public/${f}`, `${__dirname}/../dist/${f}`)
  })
})().catch(console.error)
