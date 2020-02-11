const { spawn } = require('child_process')

const onDeath = require('death')

;(async () => {
  const server = spawn('yarn', ['build', '--watch'], {
    cwd: `${__dirname}/../backend`,
    stdio: 'inherit'
  })

  const web = spawn('yarn', ['build', '--watch'], {
    cwd: `${__dirname}/../frontend`,
    stdio: 'inherit'
  })

  onDeath(() => {
    server.kill()
    web.kill()
  })
})().catch(console.error)
