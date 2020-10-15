// vue.js 3 webpack config utils
// https://github.com/sa5gap/vue3-webpack-boilerplate
// inspired by https://github.com/starkovsky/vue3-webpack-boilerplate

// * imports {{{
const { join, resolve } = require('path')
const { DefinePlugin, HashedModuleIdsPlugin } = require('webpack')
const { VueLoaderPlugin } = require('vue-loader')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const OptimizeCssnanoPlugin = require('@intervolga/optimize-cssnano-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const WebpackBar = require('webpackbar')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin
// }}}

const paths = (context) => {
  const res = (...args) => resolve(context || __dirname, ...args)
  const src = (...args) => res('src', ...args)
  const dist = (...args) => res('dist', ...args)
  const pub = (...args) => res('public', ...args)
  return { res, src, dist, pub }
}

const pluginFactory = (confValue, defaultValue) => {
  if (confValue === false) return []
  if (confValue === undefined || confValue === true) {
    if (typeof defaultValue == 'function') defaultValue = defaultValue()
    if (!Array.isArray(defaultValue)) defaultValue = [defaultValue]
    return defaultValue
  }
  if (!Array.isArray(confValue)) confValue = [confValue]
  return confValue
}

module.exports.default = (
  env,
  { mode },
  {
    context,
    entry,
    output,
    optimization,
    plugins = {},
    rules = { images: {} },
    alias = { vue: null, extra: {} },
    devServer = {},
    typescript = true,
  } = {}
) => {
  const isProd = mode == 'production'
  const { res, src, dist, pub } = paths(context)

  const config = {
    context: context || __dirname,

    mode,

    devtool: isProd ? 'source-map' : 'inline-source-map',

    entry: entry || {
      app: src('main.js'),
    },

    output: output || {
      path: dist(),
      publicPath: '',
      filename: isProd ? 'js/[name].[contenthash:8].js' : 'js/[name].js',
      chunkFilename: isProd ? 'js/[name].[contenthash:8].js' : 'js/[name].js',
    },

    resolve: {
      alias: {
        // from: vue-router-next/playground
        // this isn't technically needed, since the default `vue` entry for bundlers
        // is a simple `export * from '@vue/runtime-dom`. However having this
        // extra re-export somehow causes webpack to always invalidate the module
        // on the first HMR update and causes the page to reload.
        // vue$: '@vue/runtime-dom',

        // from: vue cli
        vue$: alias.vue || 'vue/dist/vue.runtime.esm-bundler.js',
        '@': src(),
        ...alias.extra,
      },
      extensions: ['.ts', '.js', '.vue', '.json'],
    },

    module: {
      noParse: /^(vue|vue-router|vuex|vuex-router-sync)$/,
      rules: [
        // vue
        {
          test: /\.vue$/,
          use: 'vue-loader',
        },
        // js
        {
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: (file) =>
            /node_modules/.test(file) && !/\.vue\.js/.test(file),
          // exclude: /node_modules/,
          // exclude: [
          //   (filepath) => {
          //     // always transpile js in vue files
          //     // let ret
          //     // if (/\.vue\.jsx?$/.test(filepath)) {
          //     //   ret = false
          //     // }
          //     ret = /node_modules/.test(filepath)
          //     console.log('---> [%s]', ret ? '-' : '+', filepath)
          //     return ret
          //   },
          // ],
        },
        // ts
        typescript && {
          test: /\.ts$/,
          use: [
            {
              loader: 'babel-loader',
            },
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
                appendTsSuffixTo: ['\\.vue$'],
                happyPackMode: isProd,
              },
            },
          ],
        },
        // scss
        {
          test: /\.(scss|css)$/,
          oneOf: [
            // scss: vue-modules
            {
              resourceQuery: /module/,
              use: [
                isProd
                  ? {
                      loader: MiniCssExtractPlugin.loader,
                      options: {
                        hmr: false,
                        publicPath: '../',
                      },
                    }
                  : {
                      loader: 'vue-style-loader',
                      options: {
                        sourceMap: false,
                        shadowMode: false,
                      },
                    },
                {
                  loader: 'css-loader',
                  options: {
                    sourceMap: false,
                    importLoaders: 2,
                    modules: {
                      localIdentName: '[name]_[local]_[hash:base64:5]',
                    },
                    esModule: false,
                  },
                },
                {
                  loader: 'sass-loader',
                  options: {
                    sourceMap: false,
                  },
                },
              ],
            },
            // scss: normal
            {
              use: [
                isProd
                  ? {
                      loader: MiniCssExtractPlugin.loader,
                      options: {
                        hmr: false,
                        publicPath: '../',
                      },
                    }
                  : {
                      loader: 'vue-style-loader',
                      options: {
                        sourceMap: false,
                        shadowMode: false,
                      },
                    },
                {
                  loader: 'css-loader',
                  options: {
                    sourceMap: false,
                    importLoaders: 2,
                    esModule: false,
                  },
                },
                {
                  loader: 'sass-loader',
                  options: {
                    sourceMap: false,
                  },
                },
              ],
            },
          ],
        },
        // images
        {
          test: /\.(png|jpe?g|gif|webp)(\?.*)?$/,
          use: [
            {
              loader: 'url-loader',
              options: {
                limit: 4096,
                fallback: {
                  loader: 'file-loader',
                  options: {
                    publicPath: rules.images && rules.images.publicPath,
                    outputPath: rules.images && rules.images.outputPath,
                    name:
                      (rules.images && rules.images.name) ||
                      'img/[name].[hash:8].[ext]',
                  },
                },
              },
            },
          ],
        },
        // svg
        {
          test: /\.(svg)(\?.*)?$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: 'img/[name].[hash:8].[ext]',
              },
            },
          ],
        },
        // media
        {
          test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
          use: [
            {
              loader: 'url-loader',
              options: {
                limit: 4096,
                fallback: {
                  loader: 'file-loader',
                  options: {
                    name: 'media/[name].[hash:8].[ext]',
                  },
                },
              },
            },
          ],
        },
        // fonts
        {
          test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/i,
          use: [
            {
              loader: 'url-loader',
              options: {
                limit: 4096,
                fallback: {
                  loader: 'file-loader',
                  options: {
                    name: 'fonts/[name].[hash:8].[ext]',
                  },
                },
              },
            },
          ],
        },
        // pug
        {
          test: /\.pug$/,
          loader: 'vue-indent-pug-loader',
        },
      ].filter((rule) => rule),
    },

    optimization: optimization || {
      splitChunks: {
        cacheGroups: {
          vendors: {
            name: 'chunk-vendors',
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            chunks: 'initial',
          },
          common: {
            name: 'chunk-common',
            minChunks: 2,
            priority: -20,
            chunks: 'initial',
            reuseExistingChunk: true,
          },
        },
      },
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              arrows: false,
              collapse_vars: false,
              comparisons: false,
              computed_props: false,
              hoist_funs: false,
              hoist_props: false,
              hoist_vars: false,
              inline: false,
              loops: false,
              negate_iife: false,
              properties: false,
              reduce_funcs: false,
              reduce_vars: false,
              switches: false,
              toplevel: false,
              typeofs: false,
              booleans: true,
              if_return: true,
              sequences: true,
              unused: true,
              conditionals: true,
              dead_code: true,
              evaluate: true,
            },
            mangle: {
              safari10: true,
            },
          },
          sourceMap: true,
          cache: true,
          parallel: true,
          extractComments: false,
        }),
      ],
    },

    plugins: [
      new VueLoaderPlugin(),

      // ts type checker {{{
      typescript &&
        new ForkTsCheckerWebpackPlugin({
          typescript: {
            extensions: {
              vue: {
                enabled: true,
                compiler: '@vue/compiler-sfc',
              },
            },
            diagnosticOptions: {
              semantic: true,
              syntactic: isProd,
            },
          },
        }),
      // }}}

      // define {{{
      ...pluginFactory(plugins.define, () => [
        new DefinePlugin({
          __VUE_OPTIONS_API__: 'true',
          __VUE_PROD_DEVTOOLS__: 'false',
        }),
        new DefinePlugin({
          'process.env': {
            NODE_ENV: JSON.stringify(isProd ? 'production' : 'development'),
            VUE_APP_CLI_UI_URL: JSON.stringify(''),
            BASE_URL: JSON.stringify('/'),
            // from: vue-router-next/playground
            __BROWSER__: 'true',
          },
        }),
      ]),
      // }}}

      // clean {{{
      ...pluginFactory(plugins.clean, () => new CleanWebpackPlugin()),
      // }}}

      // html {{{
      ...pluginFactory(
        plugins.html,
        () =>
          new HtmlWebpackPlugin({
            templateParameters: {
              BASE_URL: '',
            },
            template: pub('index.html'),
            ...(isProd && {
              minify: {
                removeComments: true,
                collapseWhitespace: true,
                removeAttributeQuotes: true,
                collapseBooleanAttributes: true,
                removeScriptTypeAttributes: true,
              },
            }),
          })
      ),
      // }}}

      // copy {{{
      ...pluginFactory(
        plugins.copy,
        new CopyPlugin({
          patterns: [
            {
              from: pub(),
              to: dist(),
              toType: 'dir',
              globOptions: {
                ignore: ['.DS_Store', 'index.html'],
              },
            },
          ],
        })
      ),
      // }}}

      // production: css-extract {{{
      ...pluginFactory(
        isProd && plugins.cssExtract,
        () =>
          new MiniCssExtractPlugin({
            filename: 'css/[name].[contenthash:8].css',
            chunkFilename: 'css/[name].[contenthash:8].css',
          })
      ),
      // }}}

      // production: css-optimize {{{
      ...pluginFactory(
        isProd && plugins.cssOptimize,
        () =>
          new OptimizeCssnanoPlugin({
            sourceMap: false,
            cssnanoOptions: {
              preset: [
                'default',
                {
                  mergeLonghand: false,
                  cssDeclarationSorter: false,
                },
              ],
            },
          })
      ),
      // }}}

      // production: extra plugins {{{
      ...pluginFactory(
        isProd,
        () =>
          new HashedModuleIdsPlugin({
            hashDigest: 'hex',
          })
      ),
      /// }}}

      // production: analize {{{
      ...pluginFactory(
        isProd && plugins.analize,
        () =>
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
          })
      ),
      /// }}}

      // extra plugins {{{
      ...(plugins.extra || []),
      // }}}

      new WebpackBar(),
    ].filter((plugin) => plugin),

    devServer: devServer.all || {
      port: devServer.port,
      contentBase: dist(),
      historyApiFallback: true,
      hot: true,
      stats: 'minimal',
    },
  }

  // console.log(config)
  return config
}

module.exports.paths = paths
