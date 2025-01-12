import { SerialPort } from 'serialport';
const { ReadlineParser } = require('@serialport/parser-readline')



import * as LOGGER from '../logger-util';

const noPortSelected = '';
const defaultSerialPort = noPortSelected;
const defaultBaudRate = 250000;
const defaultSendCommandIntervalTime = 100;

const endOfCommand = '\r\n';


class SerialCommunication {

	constructor(serialPortPath=defaultSerialPort, baudRate=defaultBaudRate, sendCommandIntervalTime=defaultSendCommandIntervalTime) {
		this.setSerialPort(serialPortPath, baudRate);
		this.isReceiving = false;
		this.nackline = 0; // number of lines that did not receive ok
		this.sendCommandIntervalTime = sendCommandIntervalTime;
		this.sendCommandQueue = [];
		this.sendCommandBufferIntervalId = null;		
		this.nextSendCommandId = 0;
	}

	_clearSendCommandInterval() {
		if (this.sendCommandBufferIntervalId) {
			clearInterval(this.sendCommandBufferIntervalId);
			this.sendCommandBufferIntervalId = null;
		}
	}

	_createSendCommand(cmd, callback) {
		let sendCommand = {
			'cmd': cmd,
			'callback': callback,
			'id': this.nextSendCommandId
		};
		this.nextSendCommandId += 1;
		return sendCommand;
	}

	// Initializes a periodic send command interval loop
	// Writes the command to the port, if it is successful, it removes it from the buffer
	_initSendCommandLoop() {
		// clear previous interval
		this._clearSendCommandInterval();
		
		const that = this;
		this.sendCommandBufferIntervalId = setInterval(() => {
			if (!this.isConnected()) {
				return;
			}
			let queue = that.sendCommandQueue;
			if (queue.length == 0) {
				return;
			}  
			const {cmd, callback, id} = queue.at(0);
			this.serialPort.write(cmd + endOfCommand, (err) => {
				if (err) {
					LOGGER.logE("Error on write: ", err.message);
				} else {
					const numCmd = cmd.split(endOfCommand).length;
					that.nackline += numCmd;
					LOGGER.log("Command Sent: ", cmd);

					const cmdIds = that.sendCommandQueue.map((value) => { 
						return value.id;
					});
					const itemIndex = cmdIds.indexOf(id);
					console.log(that.sendCommandQueue.splice(itemIndex, 1));
				}
				if (callback) {
					callback(cmd, err);
				}
			});
			
		}, this.sendCommandIntervalTime);
	}

	// Adds a command with an ID to the buffer for sending that gets processes by 
	// the sendCommandLoop interval with Id: `sendCommandBufferIntervalId`
	sendBufferedCommand(cmd, onSentCallback) {
		if (!this.serialPort || !this.serialPort.isOpen) {
			LOGGER.logD("can't send command; serial port is closed");
			if (onSentCallback) {
				onSentCallback(cmd, "Serial port is not open.");
			}
			return false;
		}

		if (!cmd || cmd.length == 0 || cmd.trim().length == 0) {
			return false;
		}

		let sendCmd = this._createSendCommand(cmd, onSentCallback);
		this.sendCommandQueue.push(sendCmd);
		return true;
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

	// startReceiving(dataReceivedCallback) {
	// 	// https://serialport.io/docs/7.x.x/guide-usage#reading-data
	// 	// this.serialPort.on('readable', function () {
	// 	// 	console.log('Data:', this.serialPort.read());
	// 	// })
	// 	// Switches the port into "flowing mode"
	// 	if (!this.serialPort || !this.serialPort.isOpen) {
	// 		LOGGER.logD("Can't receive data; serial port is closed.");
	// 		return;
	// 	}
	// 	if (this.isReceiving) {
	// 		LOGGER.logD("Already receiving serial data");
	// 		return;
	// 	}
	// 	LOGGER.logD("Starting receiving serial data");
	// 	const that = this;
	// 	const receivingCallback = dataReceivedCallback;
	// 	this.serialPort.on('data', function (data) {
	// 	LOGGER.logD('Received Data:', data.toString());
	// 		const receivedData = data.toString().trim().split('\n');
	// 		for (const line of receivedData) {
	// 			if (line === 'ok') {
	// 				that.nackline -= 1;
	// 				LOGGER.logD("Serial Unack Lines ", that.nackline);
	// 			}
	// 		}
	// 		if (receivingCallback) {
	// 			receivingCallback(data, Date.now());
	// 		}
	// 	});
	// 	this.isReceiving = true;
	// }

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
		// init parser
		this.parser = this.serialPort.pipe(new ReadlineParser({delimiter: '\n'}));
		this.parser.on('data', function (data) {
		LOGGER.logD('Received Data:', data.toString());
			LOGGER.log('parser', data.toString());
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
		this.parser = null;
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

		// Start the send command loop
		this._initSendCommandLoop();
	}
	
	// Returns true if the disconnect was handled, false if there was nothing to disconnect
	disconnect(onDisconnectCallback) {	
		// Clear the command loop interval 
		this._clearSendCommandInterval();

		// Clear port name
		const oldPortName = this.serialPortPath;
		this.serialPortPath = noPortSelected;

		if (!this.serialPort) {
			// can't disconnect if nothing is connected
			return false;
		}
			
		if (!this.serialPort.isOpen) {
			LOGGER.logW("Cannot disconnect - port is not open.");
			return false;
		}

		this.serialPort.close((err) => {
			if (err) {
				LOGGER.logE(err.message);
			}
			if (onDisconnectCallback) {
				onDisconnectCallback(err);
			}
		});
		LOGGER.log("Disconnected from:", oldPortName);
		this.isReceiving = false;
		return true;
	}
}

export {SerialCommunication, defaultSerialPort, defaultBaudRate};
