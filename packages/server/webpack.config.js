const fs = require('fs')
const path = require('path')
const glob = require('glob')
const nodeExternals = require('webpack-node-externals')

if (!fs.existsSync('../dist/assets')) {
  fs.mkdirSync('../dist/assets')
}

glob.sync('**/*', {
  cwd: './assets'
}).map((f) => {
  fs.copyFileSync(`./assets/${f}`, `../dist/assets/${f}`)
})

const pkg = require('./package.json')

delete pkg.devDependencies
delete pkg.scripts

fs.writeFileSync('../dist/package.json', JSON.stringify(pkg, null, 2))

module.exports = {
  mode: 'production',
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'server.js'
  },
  target: 'node',
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader'
      }
    ]
  },
  externals: [nodeExternals()]
}
