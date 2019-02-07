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
        theme_color: '#F68043',
        start_url: '/',
        icons: [
          {
            src: path.resolve('src/assets/logo.png'),
            sizes: [96, 128, 256, 384, 512],
            destination: path.join('img', 'icons')
          }
        ]
      })
    ]
  },
  chainWebpack: config => {
    config
      .plugin('preload-index')
      .tap(args => {
        args[0].include.entries.push('group-app');
        return args;
      });
    config
      .plugin('preload-admin')
      .tap(args => {
        args[0].include.entries.push('group-admin');
        return args;
      })
  },
  pages: {
    index: {
      entry: 'src/main.ts',
      template: 'public/index.html',
      filename: 'index.html',
    },
    admin: {
      entry: 'src/admin.ts',
      template: 'public/index.html',
      filename: 'admin/index.html',
    }
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
  },

  publicPath: undefined,
  outputDir: undefined,
  assetsDir: undefined,
  runtimeCompiler: undefined,
  productionSourceMap: false,
  parallel: undefined,
  css: undefined
}
