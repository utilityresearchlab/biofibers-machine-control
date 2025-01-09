import * as React from 'react';
import * as ReactDOM from 'react-dom/client';

import BaseMachineControlApp from './app';

import applyTheme from './style/theme'

import {SerialCommunication, defaultBaudRate, defaultSerialPort} from './lib/serial-util/serial-communication';
import * as APP_SETTINGS from './app-settings'

const serialComm = new SerialCommunication(defaultSerialPort, defaultBaudRate);
const isDebugging = APP_SETTINGS.DEBUG_MODE;


let appStarted = false;
// Set-up react app here; see: https://reactjs.org/docs/hello-world.html
function initApp() {
	console.log("InitApp");
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

// Start react app

initApp();

