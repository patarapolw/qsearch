const { spawn } = require('child_process')

async function spawnSafe (cmd, args, options) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, {
      stdio: 'inherit',
      ...options
    })
    p.on('exit', (err) => err ? reject(err) : resolve())
  })
}

module.exports = {
  spawnSafe
}
