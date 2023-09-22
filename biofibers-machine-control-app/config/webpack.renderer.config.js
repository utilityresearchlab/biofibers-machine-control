const rules = require('./webpack.rules');

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

module.exports = {
  // Put your normal webpack config below here
  module: {
    rules,
  },
	externals: {
		serialport: "commonjs2 serialport", // Ref: https://copyprogramming.com/howto/electron-and-serial-ports
	}, //See: https://lightrun.com/answers/serialport-node-serialport-no-native-build-was-found-for-platform-when-using-electron-forge--webpack

	resolve: {
    extensions: ['.js', '.jsx']
  }
};
