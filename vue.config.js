const WebpackPwaManifest = require('webpack-pwa-manifest');
const path = require('path');
const MomentLocalesPlugin = require('moment-locales-webpack-plugin');
const PreloadPlugin = require('@vue/preload-webpack-plugin');

class CustomFilterPlugin {
  constructor({ exclude }) {
    this.exclude = exclude;
  }

  apply(compiler) {
    compiler.hooks.afterEmit.tap('CustomFilterPlugin', compilation => {
      compilation.warnings = compilation.warnings.filter(warning => !this.exclude.test(warning.message));
    });
  }
};

module.exports = {
  configureWebpack: {
    plugins: [
      new MomentLocalesPlugin(),
      new CustomFilterPlugin({
        exclude: /Conflicting order between:/
      })
    ]
  },
  chainWebpack: config => {
    config
      .plugin('pwa-manifest')
      .use(WebpackPwaManifest, [
        {
          name: 'KnK Schedule',
          fingerprints: false,
          inject: true,
          short_name: 'KnK',
          background_color: '#0E8DF1',
          theme_color: '#607D8B',
          start_url: '/',
          icons: [
            {
              src: path.resolve('src/assets/logo.png'),
              sizes: [96, 128, 256, 384, 512],
              destination: path.join('img', 'icons')
            }
          ]
        }
      ]);

    config
      .plugin('preload-app')
      .use(PreloadPlugin, [
        {
          rel: 'preload',
          includeHtmlNames: [
            'index.html'
          ],
          include: {
            chunks: [ 'group-app' ],
            entries: [
              'index'
            ]
          }
        }
      ]);

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
    themeColor: '#607D8B',
    msTileColor: '#0E8DF1',
    appleMobileWebAppCapable: 'yes',
    assetsVersion: '6',
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
  parallel: true,
  css: undefined
}
