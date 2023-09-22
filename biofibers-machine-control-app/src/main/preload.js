// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
	// for (const versionType of['chrome', 'electron', 'node']) {
	// 		document.getElementById(`${versionType}-version`).innerText = process.versions[versionType]
	// }

	//console.log("SerialPort version:" + require('serialport/package').version);

});
