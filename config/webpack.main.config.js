module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './biofibers-machine-control-app/src/main/main.js',
  // Put your normal webpack config below here
  module: {
    rules: require('./webpack.rules'),
  },
	externals: {
		serialport: "commonjs2 serialport", // Ref: https://copyprogramming.com/howto/electron-and-serial-ports
	},
};
