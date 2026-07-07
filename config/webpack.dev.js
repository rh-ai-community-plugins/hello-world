const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'eval-source-map',
  devServer: {
    port: parseInt(process.env.PORT, 10) || 9112,
    historyApiFallback: true,
    hot: true,
    proxy: [
      {
        context: ['/hello-world'],
        target: 'http://localhost:8843',
        pathRewrite: { '^/hello-world': '/hello-world' },
      },
    ],
  },
  optimization: {
    runtimeChunk: false,
    splitChunks: false,
  },
});
