
import { SerialPort } from 'serialport';


const SerialPortHelper = {};

SerialPortHelper.serialPortPathNone = () => { return ''};
SerialPortHelper.nonePort = {
	path: SerialPortHelper.serialPortPathNone()
};
SerialPortHelper.defaultBaudRate = () => { return 250000}
SerialPortHelper.availableBaudRates = () => {
	return [
		9600,
		19200,
		38400,
		57600,
		115200,
		250000];
}

	SerialPortHelper.listSerialPorts =
		async function() {
			// console.log("listing ports");
			return await SerialPort.list().then(
				(ports, err) => {
				if (err) {
						console.log(err.message);
						return {ports, err};
				}

				// console.log('ports', ports);

				if (ports.length === 0) {
					console.log("No ports discovered!");
				}

				return {
					ports,
					err
				};
			});
	}

	SerialPortHelper.listPorts = function() {
		SerialPortHelper.listSerialPorts();
		//setTimeout(SerialPortHelper.listPorts, 2000);
	};



export default SerialPortHelper;
