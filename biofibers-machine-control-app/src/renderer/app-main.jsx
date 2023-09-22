import * as React from 'react';
import * as ReactDOM from 'react-dom/client';

import BaseMachineControlApp from './app';

import applyTheme from './style/theme'

import {SerialCommunication, defaultBaudRate, defaultSerialPort} from './lib/serial-util/serial-communication';

const serialComm = new SerialCommunication(defaultSerialPort, defaultBaudRate);

let appStarted = false;
// Set-up react app here; see: https://reactjs.org/docs/hello-world.html
function initApp() {
	console.log("InitApp");
	if (appStarted) {
		return;
	}
	const root = ReactDOM.createRoot(document.getElementById('root'));
	const renderApp = () => {
		return (<BaseMachineControlApp serialCommunication={serialComm} />);
	}
	root.render(
		<React.StrictMode>
			{applyTheme(renderApp())}
		</React.StrictMode>
		);
	appStarted = true;
}

// Start react app

initApp();

