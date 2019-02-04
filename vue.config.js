module.exports = {
  pwa: {
    workboxPluginMode: 'InjectManifest',
    name: 'KnK Schedule',
    themeColor: '#F68043',
    assetsVersion: '1',
    workboxOptions: {
      swSrc: 'src/service-worker.js',
      swDest: 'service-worker.js'
    }
  }
}
