module.exports = {
  outputDir: '../dist/web',
  devServer: {
    proxy: {
      '^/api': {
        target: 'http://localhost:3001'
      }
    }
  }
}
