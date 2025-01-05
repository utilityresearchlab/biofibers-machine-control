const path = require("path");

module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   * The reference of this should be relative to the app folder 
   */
  entry: './biofibers-machine-control-app/src/main/main.js',
  output: {
    // this is how the file is output
    filename: 'bundle.js',
    path: path.resolve(__dirname, '../biofibers-machine-control-app/src/dist/')
  },
  // Put your normal webpack config below here
  module: {
    rules: [
      // Add support for native node modules
      {
        // We're specifying native_modules in the test because the asset relocator loader generates a
        // "fake" .node file which is really a cjs file.
        test: /native_modules\/.+\.node$/,
        use: 'node-loader',
      },
      {
        test: /\.(m?js|node)$/,
        parser: { amd: false },
        use: {
          loader: '@vercel/webpack-asset-relocator-loader',
          options: {
            outputAssetBase: 'native_modules',
          },
        },
      },
      // Put your webpack loader rules in this array.  This is where you would put
      // your ts-loader configuration for instance:
      /**
       * Typescript Example:
       *
       * {
       *   test: /\.tsx?$/,
       *   exclude: /(node_modules|.webpack)/,
       *   loaders: [{
       *     loader: 'ts-loader',
       *     options: {
       *       transpileOnly: true
       *     }
       *   }]
       * }
       */
       {
        test: /\.jsx?$/,
        use: {
          loader: 'babel-loader',
          options: {
            exclude: /node_modules/,
            presets: ['@babel/preset-react']
          }
        }
      },
      // Style sheets
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' }, 
          { loader: 'css-loader' }],
      },

      // Loads common image formats using Webpack 5 asset module: https://www.debugandrelease.com/how-to-load-images-in-electron-applications/
      // See also: https://www.linkedin.com/pulse/easy-to-understand-guide-asset-module-webpack-5-prasenjit-sutradhar/
      {
        test: /\.(svg|png|jpg|gif)$/,
        type: "asset/inline"
        }
    ] 
  },
	externals: {
		serialport: "commonjs2 serialport", // Ref: https://copyprogramming.com/howto/electron-and-serial-ports
	},
};
