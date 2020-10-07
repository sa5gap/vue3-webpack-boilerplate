'use strict'

// * imports {{{
const fs = require('fs')
const path = require('path')
const { default: webpackConfig, paths } = require('../webpack.config.js')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

// }}}

// * functions {{{
function walkDir(dir, entries = {}, templates = []) {
  let map = {}
  fs.readdirSync(dir).forEach((child) => {
    const p = path.join(dir, child)
    if (fs.statSync(p).isDirectory()) {
      const relPath = path.relative(src(), p)
      const entryPath = path.join(p, 'main.js')
      if (fs.existsSync(entryPath)) {
        // entry detected
        entries[relPath] = map[child] = entryPath
        templates.push(
          new HtmlWebpackPlugin({
            inject: true,
            filename: dist(relPath, 'index.html'),
            chunks: [relPath],
            templateContent: htmlTemplate(
              `${relPath} - Chibi UI Examples`,
              `<a href="/">&larr; Examples index</a>`,
              relPath
            ),
          })
        )
      } else {
        const { map: _map } = walkDir(p, entries, templates)
        map[child] = _map
      }
    }
  })
  return { entries, map, templates }
}

function htmlTemplate(title, back, header, body = '<div id="app"></div>') {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <link rel="stylesheet" href="/global.css" />
        <title>${title}</title>
      </head>
      <body>
        ${back}
        <h1 class='chi-fsd-3'>${header}</h1>
        <hr/>
        ${body}
      </body>
    </html>`
}

function htmlMap(m, path = '') {
  let s = ''
  for (let v of Object.keys(m)) {
    const p = path + v + '/'
    const z = typeof m[v] === 'object' ? htmlMap(m[v], p) : ''
    s += `<li><a href="${p}">${v}</a>${z}</li>`
  }
  return `<ul>${s}</ul>`
}
// }}}

const { res, src, dist, pub } = paths(__dirname)

module.exports = (env, options) => {
  const isProd = options.mode == 'production'
  const { map, entries, templates } = walkDir(src())
  const config = webpackConfig(env, options, {
    context: __dirname,
    entry: entries,
    output: {
      path: dist(),
      filename: isProd ? '[name]/app.[contenthash:8].js' : '[name]/app.js',
      chunkFilename: isProd ? '[name].[contenthash:8].js' : '[name].js',
      publicPath: '',
    },
    rules: {
      images: {
        publicPath: '../..',
        name: (resourcePath, resourceQuery) => {
          let d = path.relative(
            src(),
            path.resolve(path.dirname(resourcePath), '..')
          )
          return d + '/[name].[hash:8].[ext]'
        },
      },
    },
    optimization: {
      splitChunks: {
        cacheGroups: {
          shared: {
            name: 'shared',
            chunks: 'initial',
            minChunks: 2,
          },
        },
      },
    },
    plugins: {
      html: [
        ...templates,
        new HtmlWebpackPlugin({
          inject: true,
          filename: dist('index.html'),
          chunks: [false],
          templateContent: htmlTemplate(
            `Chibi UI Examples`,
            ``,
            `Chibi UI Examples`,
            htmlMap(map)
          ),
        }),
      ],
      copy: [],
      cssExtract: [
        new MiniCssExtractPlugin({
          filename: '[name]/[contenthash:8].css',
        }),
      ],
    },
  })

  // console.log(config)
  // process.exit()
  return config
}