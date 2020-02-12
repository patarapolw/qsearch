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

  fs.mkdirSync(`${__dirname}/../dist/assets`)

  glob.sync('**/*', {
    cwd: `${__dirname}/../backend/assets`
  }).map((f) => {
    fs.copyFileSync(`${__dirname}/../backend/assets/${f}`, `${__dirname}/../dist/assets/${f}`)
  })

  const pkg = require(`${__dirname}/../backend/package.json`)

  delete pkg.dependencies
  delete pkg.devDependencies
  delete pkg.scripts.build

  fs.writeFileSync(`${__dirname}/../dist/package.json`, JSON.stringify(pkg, null, 2))
  await spawnSafe('yarn', [], {
    cwd: `${__dirname}/../dist`
  })
})().catch(console.error)
