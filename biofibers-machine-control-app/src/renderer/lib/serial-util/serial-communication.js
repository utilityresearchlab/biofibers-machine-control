import { SerialPort } from 'serialport';
const { ReadlineParser } = require('@serialport/parser-readline')

import { v4 as uuidv4 } from 'uuid';

import { SafeCounter } from '../concurrency-util';
import * as LOGGER from '../logger-util';

const noPortSelected = '';
const defaultSerialPort = noPortSelected;
const defaultBaudRate = 250000;
const defaultSendCommandIntervalTimeMs = 10; // 3/21/2025 orig: 100

const responseSerialStart = 'start';
const responseSerialUnknownCommand = 'echo:Unknown command:';
const responseSerialBusyProcessing = 'echo:busy: processing';
const responseSerialOk = 'ok';

const endOfCommand = '\r\n';


class SerialCommunication {

	constructor(serialPortPath=defaultSerialPort, baudRate=defaultBaudRate, sendCommandIntervalTime=defaultSendCommandIntervalTimeMs) {
		this.setSerialPort(serialPortPath, baudRate);
		this.isReceiving = false;
		this.sendCommandIntervalTime = sendCommandIntervalTime;
		this.sendCommandBufferIntervalId = null;
		this.sendCommandQueue = [];	
		this.pendingCommandQueue = [];	
		this.nackLineCounter = new SafeCounter(); // number of lines that did not receive ok
	}

	_clearSendCommandInterval() {
		if (this.sendCommandBufferIntervalId) {
			clearInterval(this.sendCommandBufferIntervalId);
			this.sendCommandBufferIntervalId = null;
		}
	}

	_resetSendCommandQueues() {
		this.sendCommandQueue = [];	
		this.pendingCommandQueue = [];	
		this.nackLineCounter = new SafeCounter(); // number of lines that did not receive ok
	}

	_createSendCommand(cmd, callback) {
		let sendCommand = {
			'cmd': cmd,
			'callback': callback,
			'id': uuidv4(), 
			'timestamp': Date.now() 
		};
		return sendCommand;
	}

	// Initializes a periodic send command interval loop
	// Writes the command to the port, if it is successful, it removes it from the buffer
	_initSendCommandLoop() {
		// clear previous interval and queues
		this._clearSendCommandInterval();
		this._resetSendCommandQueues();
		
		const that = this;
		this.sendCommandBufferIntervalId = setInterval(() => {
			if (!this.isConnected()) {
				return;
			}
			let queue = that.sendCommandQueue;
			if (queue.length == 0) {
				return;
			}  

			// if (this.nackLineCounter.value > 5) {
			// 	LOGGER.logE("too many commands sent, wait and resend");
			// 	//return false;
			// }

			const {cmd, callback, id, timestamp} = queue.at(0);
			this.serialPort.write(cmd + endOfCommand, (err) => {
				if (err) {
					LOGGER.logE("Error on write: ", err.message);
				} else {
					//const numCmd = cmd.split(endOfCommand).length;
					that.nackLineCounter.increment();
					LOGGER.log("Command Sent: ", cmd);

					const cmdIds = that.sendCommandQueue.map((value) => { 
						return value.id;
					});
					const itemIndex = cmdIds.indexOf(id);
					const currentCommandObject = that.sendCommandQueue[itemIndex];
					// Remove from the send command queue
					that.sendCommandQueue.splice(itemIndex, 1);

					// Add to the pending command queue
					if (currentCommandObject) {
						that.pendingCommandQueue.push(currentCommandObject);
						LOGGER.logD("Sent command from send queue and put in pending:", currentCommandObject);
					}
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
			// TODO: here is where we see a busy processing line, use this to determine when to add back to the queue
			// and to wait.
			// Line:
			// 	"echo:busy: processing"
			LOGGER.logD('Received Serial Data:', data.toString());
			const trimmedData = data.toString().trim();
			//LOGGER.logD('Trimmed received Data:', trimmedData);

			const receivedData = trimmedData.split(/(ok)|\n/);
			// Sometimes the received data can actually be two responses (e.g., OK + temp response)
			for (const line of receivedData) {
				if (!line) {
					continue;
				}
				let trimmedLine = line.trim();
				if (line === '') {
					continue;
				}

				LOGGER.logD(`Serial Response Line: ${trimmedLine}`);
				let item = null;	

				// If Acknowledged and we have pending commands, then we update the nackline 
				if (trimmedLine == responseSerialOk 
					|| trimmedLine.includes(responseSerialUnknownCommand)
					|| trimmedLine.includes(responseSerialBusyProcessing)) {			
					// Sometimes we may receive an 'ok' event if we didn't send a command
					// for example, on printer startup. This can lead to negative NACK line values
					// to avoid this, we simple ignore any acks that come in beyond what we send.
					if (that.nackLineCounter.value > 0) {	
						that.nackLineCounter.decrement();
					}
				}

				// Depending on the response, we handle the command
				if (trimmedLine === responseSerialOk || trimmedLine.includes(responseSerialUnknownCommand)) {
					// Response is OK or unknown command
					// So remove from pending queue and remove nackline
					if (that.pendingCommandQueue.length > 0) {
						item = that.pendingCommandQueue.shift();
						LOGGER.logD("Removed command from pending queue", item);	
					}
				} else if (trimmedLine.includes(responseSerialBusyProcessing)) {
					// If the command was received AND the buffer is full / busy processing
					// We remove from pending queue at put back at the front of the send queue
					// then it will be resent in the next send command loop interval
					if (that.pendingCommandQueue.length > 0) {
						const item = that.pendingCommandQueue.shift();
						// Make sure we don't have undefined commands
						if (item) { 
							LOGGER.logD("Moving command from Pending to Send Queue", item);
							// Put item back onto the send queue at the front
							that.sendCommandQueue.unshift(item);
						}
					}
				} 
				// Below is for debugging serial responses
				else {
				// 	// Unhandled line response from the machine
					LOGGER.logD(`Unhandled serial line from machine: ${trimmedLine}`);
				}		
				if (receivingCallback) {
					receivingCallback(line, Date.now());
				}						
			}
			LOGGER.logD("Updated Serial Unack Lines ", that.nackLineCounter.value);


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
		// Clear the command loop interval and queues
		this._clearSendCommandInterval();
		this._resetSendCommandQueues();

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
