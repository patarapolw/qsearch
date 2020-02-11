const { spawnSafe } = require('./utils')

;(async () => {
  await spawnSafe('git', [
    'add',
    '.'
  ], {
    cwd: `${__dirname}/../dist`
  })

  await spawnSafe('git', [
    'commit',
    '--allow-empty',
    '-m',
    'Push to Heroku'
  ], {
    cwd: `${__dirname}/../dist`
  })

  await spawnSafe('git', [
    'push',
    '-f',
    'heroku',
    'heroku:master'
  ])
})().catch(console.error)
