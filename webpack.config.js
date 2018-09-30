const path = require('path');

const config = {
  entry: './src/qni.ts',
  devtool: 'source-map',
  target: 'web',
  output: {
    path: path.resolve(__dirname, 'public/dist'),
    filename: 'bundle.js'
  },
  module: {
    rules: [{
        test: /\.css$/,
        use: 'css-loader'
      },
      {
        test: /\.ts$/,
        use: 'awesome-typescript-loader'
      },
      {
        enforce: "pre",
        test: /\.js$/,
        loader: "source-map-loader"
      },
      {
        enforce: 'pre',
        test: /\.ts$/,
        loader: 'tslint-loader'
      }
    ]
  },
  resolve: {
    extensions: [".ts", ".js", ".json"]
  }
};

module.exports = config;