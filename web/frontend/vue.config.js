module.exports = {
  outputDir: '../dist/public',
  devServer: {
    proxy: {
      '^/api': {
        target: 'http://localhost:3001'
      }
    }
  }
}
