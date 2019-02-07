const WebpackPwaManifest = require('webpack-pwa-manifest');
const path = require('path');
const MomentLocalesPlugin = require('moment-locales-webpack-plugin');

module.exports = {
  configureWebpack: {
    plugins: [
      new MomentLocalesPlugin(),
      new WebpackPwaManifest({
        name: 'KnK Schedule',
        fingerprints: false,
        inject: true,
        short_name: 'KnK',
        background_color: '#0E8DF1',
        themeColor: '#F68043',
        start_url: '/',
        icons: [
          {
            src: path.resolve('src/assets/logo.png'),
            sizes: [96, 128, 256, 384],
            destination: path.join('img', 'icons')
          }
        ]
      })
    ]
  },
  pwa: {
    workboxPluginMode: 'InjectManifest',
    name: 'KnK Sched',
    themeColor: '#F68043',
    msTileColor: '#0E8DF1',
    appleMobileWebAppCapable: 'yes',
    assetsVersion: '2',
    manifestPath: 'manifest.json',
    workboxOptions: {
      swSrc: 'src/service-worker.js',
      swDest: 'service-worker.js'
    },
    iconPaths: {
      appleTouchIcon: 'img/icons/apple-icon-152x152.png',
      msTileImage: 'img/icons/ms-icon-144x144.png'
    }
  }
}
