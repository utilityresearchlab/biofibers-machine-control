// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
// Import the necessary Electron modules

// const contextBridge = require('electron').contextBridge;
// const ipcRenderer = require('electron').ipcRenderer;


// Note that preload will have the same context as the Renderer
// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
	// for (const versionType of['chrome', 'electron', 'node']) {
	// 		document.getElementById(`${versionType}-version`).innerText = process.versions[versionType]
	// }
	//console.log("SerialPort version:" + require('serialport/package').version);
});

// https://stackoverflow.com/questions/71562748/sending-message-from-main-to-renderer
// // White-listed channels.
// const ipc = {
//     'render': { 
//         // From render to main.
//         'send': [],
//         // From main to render.
//         'receive': [
//             'app:will-quit' // Here is your channel name
//         ],
//         // From render to main and back again.
//         'sendReceive': []
//     }
// };

// // Exposed protected methods in the render process.
// contextBridge.exposeInMainWorld(
//     // Allowed 'ipcRenderer' methods.
//     'ipcRender', {
//         // From render to main.
//         send: (channel, args) => {
//             let validChannels = ipc.render.send;
//             if (validChannels.includes(channel)) {
//                 ipcRenderer.send(channel, args);
//             }
//         },
//         // From main to render.
//         receive: (channel, listener) => {
//             let validChannels = ipc.render.receive;
//             if (validChannels.includes(channel)) {
//                 // Deliberately strip event as it includes `sender`.
//                 ipcRenderer.on(channel, (event, ...args) => listener(...args));
//             }
//         },
//         // From render to main and back again.
//         invoke: (channel, args) => {
//             let validChannels = ipc.render.sendReceive;
//             if (validChannels.includes(channel)) {
//                 return ipcRenderer.invoke(channel, args);
//             }
//         }
//     }
// );