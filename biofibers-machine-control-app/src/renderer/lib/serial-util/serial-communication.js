import { ThreeSixty } from '@mui/icons-material';
import { SerialPort } from 'serialport';

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
			this.log("can't send command; serial port is closed");
			if (onSentCallback) {
				onSentCallback(cmd, "Serial port is not open.");
			}
			return false;
		}
		// todo: replace placeholder 5 with actual buffer size
		// if (this.nackline > 5) {
		// 	this.log("too many commands sent, wait and resend");
		// 	return false;
		// }
		this.serialPort.write(cmd + endOfCommand, (err) => {
			if (err) {
				this.log("Error on write: ", err.message);
			} else {
				this.nackline += 1;
				this.log("Command Sent: ", cmd);
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
			this.log("Can't receive data; serial port is closed.");
			return;
		}
		if (this.isReceiving) {
			this.log("already receiving data");
			return;
		}
		this.log("starting receiving");
		const that = this;
		const receivingCallback = dataReceivedCallback;
		this.serialPort.on('data', function (data) {
  		that.log('Received Data:', data.toString());
			const lastLine = data.toString().trim().split('\n').slice(-1)[0];
			that.log('last line ', lastLine);
			if (lastLine === 'ok') {
				that.nackline -= 1;
				that.log("Unack Lines ", that.nackline);
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
			this.log("disconnecting previous port");
			this.disconnect();
		}
		if (this.serialPortPath == noPortSelected) {
			this.log("error - can't connect with no port selected");
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
				console.log("SerialPort Error: ", err.message);
			}
			if (onConnectCallback) {
				onConnectCallback(err);
			}
		});
		this.log("connected to ", this.serialPortPath, " / rate:", this.baudRate);
		this.isReceiving = false;
	}

	disconnect(onDisconnectCallback) {
		if (!this.serialPort || !this.serialPort.isOpen) {
			this.log("Cannot disconnect - port is not open.");
			return true;
		}
		this.serialPort.close((err) => {
			if (err) {
				this.log("error - ", err.message);
			}
			if (onDisconnectCallback) {
				onDisconnectCallback(err);
			}
		});
		this.log("disconnected from:", this.serialPortPath);
		this.isReceiving = false;
		return true;
	}

	log(...info) {
		console.log("SerialCommunication: ", ...info);
	}
}

export {SerialCommunication, defaultSerialPort, defaultBaudRate};
