const path = require('path');
const webpack = require('webpack');

module.exports = {
  target: 'node', // Important : l'extension tourne dans l'environnement Node.js de VS Code
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
    vscode: 'commonjs vscode',    // Ne pas inclure l'API VS Code dans le bundle final
    bufferutil: 'bufferutil',      // Dépendance optionnelle souvent requise par 'ws'
    'utf-8-validate': 'utf-8-validate' // Dépendance optionnelle souvent requise par 'ws'
  },
  devtool: 'source-map'
};