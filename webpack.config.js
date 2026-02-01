const path = require('path');
const webpack = require('webpack');

module.exports = {
  target: 'node', // Important : on tourne dans l'environnement Node de VS Code
  mode: 'none', 
  entry: {
    extension: './src/extension.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'commonjs',
    devtoolModuleFilenameTemplate: '../../[resource-path]'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [{ loader: 'ts-loader' }]
      }
    ]
  },
  externals: {
    vscode: 'commonjs vscode' // Ne pas inclure l'API VS Code dans le bundle
  },
  devtool: 'source-map'
};