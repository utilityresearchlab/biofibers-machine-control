import { SerialPort } from 'serialport';

import * as LOGGER from '../logger-util';

const noPortSelected = '';
const defaultSerialPort = noPortSelected;
const defaultBaudRate = 250000;

const endOfCommand = '\r\n';

class SerialCommunication {

	constructor(serialPortPath=defaultSerialPort, baudRate=defaultBaudRate) {
		this.setSerialPort(serialPortPath, baudRate);
		this.isReceiving = false;
		this.nackline = 0; // number of lines that did not receive ok
	}

	sendCommand(cmd, onSentCallback) {
		if (!cmd || cmd.length == 0 || cmd.trim().length == 0) {
			return false;
		}
		if (!this.serialPort || !this.serialPort.isOpen) {
			LOGGER.logD("can't send command; serial port is closed");
			if (onSentCallback) {
				onSentCallback(cmd, "Serial port is not open.");
			}
			return false;
		}
		// todo: replace placeholder 5 with actual buffer size
		// if (this.nackline > 5) {
		// 	LOGGER.logE("too many commands sent, wait and resend");
		// 	return false;
		// }
		this.serialPort.write(cmd + endOfCommand, (err) => {
			if (err) {
				LOGGER.logE("Error on write: ", err.message);
			} else {
				const numCmd = cmd.split(endOfCommand).length;
				this.nackline += numCmd;
				LOGGER.log("Command Sent: ", cmd);
			}
			if (onSentCallback) {
				onSentCallback(cmd, err);
			}
		});
		return true;
	}

	startReceiving(dataReceivedCallback) {
		// https://serialport.io/docs/7.x.x/guide-usage#reading-data
		// this.serialPort.on('readable', function () {
		// 	console.log('Data:', this.serialPort.read());
		// })
		// Switches the port into "flowing mode"
		if (!this.serialPort || !this.serialPort.isOpen) {
			LOGGER.logD("Can't receive data; serial port is closed.");
			return;
		}
		if (this.isReceiving) {
			LOGGER.logD("Already receiving serial data");
			return;
		}
		LOGGER.logD("Starting receiving serial data");
		const that = this;
		const receivingCallback = dataReceivedCallback;
		this.serialPort.on('data', function (data) {
		LOGGER.logD('Received Data:', data.toString());
			const receivedData = data.toString().trim().split('\n');
			for (const line of receivedData) {
				if (line === 'ok') {
					that.nackline -= 1;
					LOGGER.logD("Serial Unack Lines ", that.nackline);
				}
			}
			if (receivingCallback) {
				receivingCallback(data, Date.now());
			}
		});
		this.isReceiving = true;
	}

	isConnected() {
		return (this.serialPort) ? this.serialPort.isOpen : false;
	}

	setSerialPort(portPath=defaultSerialPort, baudRate=defaultBaudRate) {
		this.baudRate = baudRate;
		this.serialPortPath = portPath;
		this.serialPort = null;
	}

	getSerialPortPath() {
		return this.serialPortPath;
	}

	getBaudRate() {
		return this.baudRate;
	}

	// Opens the port / connects
	connect(onConnectCallback) {
		// Disconnect old port
		if (this.serialPort && this.isConnected()) {
			LOGGER.logD("Disconnecting from previous serial port");
			this.disconnect();
		}
		if (this.serialPortPath == noPortSelected) {
			LOGGER.logE("Can't connect to serial with no port selected");
			if (onConnectCallback) {
				onConnectCallback("No port selected!");
			}
			return;
		}
		// First parameter are the port options; second parameter is the opencallback
		this.serialPort = new SerialPort({
			path: this.serialPortPath,	// ex: '/dev/tty-usbserial1',
			baudRate: this.baudRate,
			//autoOpen: false,
		}, (err) => {
			if (err) {
				LOGGER.logE(`SerialPort`, err.message);
			}
			if (onConnectCallback) {
				onConnectCallback(err);
			}
		});
		LOGGER.log("Connected to ", this.serialPortPath, "/", "rate:", this.baudRate);
		this.isReceiving = false;
	}

	disconnect(onDisconnectCallback) {
		if (!this.serialPort) {
			// can't disconnect if nothing is connected
			return true;
		}
			
		if (!this.serialPort.isOpen) {
			LOGGER.logW("Cannot disconnect - port is not open.");
			return true;
		}
		this.serialPort.close((err) => {
			if (err) {
				LOGGER.logE(err.message);
			}
			if (onDisconnectCallback) {
				onDisconnectCallback(err);
			}
		});
		LOGGER.log("Disconnected from:", this.serialPortPath);
		this.isReceiving = false;
		return true;
	}
}

export {SerialCommunication, defaultSerialPort, defaultBaudRate};
