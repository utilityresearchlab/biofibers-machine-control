import * as React from 'react';
import * as ReactDOM from 'react-dom/client';

import applyTheme from './style/theme'

import * as APP_SETTINGS from './app-settings'
import BaseMachineControlApp from './app';
import * as LOGGER from './lib/logger-util'

import {SerialCommunication, defaultBaudRate, defaultSerialPort} from './lib/serial-util/serial-communication';

const { ipcRenderer } = require('electron');

const serialComm = new SerialCommunication(defaultSerialPort, defaultBaudRate);

const isAppDebugging = async () => {
	const isPackaged = await ipcRenderer.invoke('BFMAIN_isPackaged');
	if (!isPackaged) {
		LOGGER.logD("Is App Packaged:", isPackaged);
	}
	return !isPackaged;
};

const appWillQuitCallback = () => {
	if (serialComm && serialComm.isConnected) {
		serialComm.disconnect();
	}
};

// Disconnect Serial connection if the window is going to be closed
window.addEventListener('beforeunload', function(event) {
	appWillQuitCallback();
});

let appStarted = false;
// Set-up react app here; see: https://reactjs.org/docs/hello-world.html
function initApp(isDebugging=false) {
	LOGGER.logD("InitApp");
	if (appStarted) {
		return;
	}

	const root = ReactDOM.createRoot(document.getElementById('root'));
	const renderApp = () => {
		return (
			<BaseMachineControlApp 
				serialCommunication={serialComm}
				isDebugging={isDebugging} 
				/>
		);
	};

	root.render(
		<React.StrictMode>
			{applyTheme(renderApp())}
		</React.StrictMode>
		);
	appStarted = true;
}

// Start react app with debugging flag
initApp(await isAppDebugging());

