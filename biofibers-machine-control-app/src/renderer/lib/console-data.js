
class ConsoleDataType {
	static ERROR = new ConsoleDataType('error');
	static INFO = new ConsoleDataType('info');
	static SENT = new ConsoleDataType('sent');
	static RECEIVED = new ConsoleDataType('received');
	static RECEIVED_STATUS = new ConsoleDataType('received_status');
	static UNDEFINED = new ConsoleDataType('undefinded');

	constructor(name) {
		this.name = name;
	}
}

class ConsoleDataItem {
	constructor(data, timestamp=Date.now(), dataType=ConsoleDataType.UNDEFINED) {
		// do nothing
		if (!(dataType instanceof ConsoleDataType)) {
			throw('dataType is invalid - must be of type: `ConsoleDataType`');
		}
		if (dataType == ConsoleDataType.UNDEFINED) {
			throw('dataType is undefined - you must specify a valid datatype in the constructor');
		}
		this.data = data;
		this.timestamp = timestamp;
		this.dataType = dataType;
	}
}


export {ConsoleDataItem, ConsoleDataType};
