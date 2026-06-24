const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;
const path = require('path');
const { name, version, moduleFederation } = require('../package.json');
const stylePaths = require('./stylePaths');

const remoteEntry = path.posix.join(moduleFederation.filename);

module.exports = {
  entry: './src/index.ts',
  output: {
    publicPath: 'auto',
    filename: '[name].[contenthash].js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
          },
        ],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|woff2?|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.jsx'],
    alias: {
      '~': path.resolve(__dirname, '../src'),
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '../src/index.html'),
    }),
    new ModuleFederationPlugin({
      name,
      filename: remoteEntry,
      exposes: {
        './extensions': './src/rhoai/extensions.ts',
        './Icon': './src/rhoai/HelloWorldNavIcon.tsx',
      },
      shared: {
        react: {
          singleton: true,
          requiredVersion: '^18',
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^18',
        },
        'react-router-dom': {
          singleton: true,
          requiredVersion: '^7',
        },
        '@patternfly/react-core': {
          singleton: true,
          requiredVersion: '^6',
        },
        '@openshift/dynamic-plugin-sdk': {
          singleton: true,
          requiredVersion: '^5',
        },
      },
    }),
  ],
};
