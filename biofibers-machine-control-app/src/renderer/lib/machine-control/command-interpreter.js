
/**
 * This class interprets commands parsed by the MachineParser and then calls the command
 * as a property on a provider handler object. If there is an err in interpreting a command,
 * it is passed to the errcallback.
 * Handler is an object where each property is a command:
 * handler = {};
 * handler[ALL_COMMANDS.SET_DELIVERY_SPEED] = (errCallback, cmd, cmdParams) => {
 *  // do somethinng
 * };
 * validCommands is an array containing all the valid commands for the machine
 */

class MachineCommandInterpreter {
	// Handler is an object where handle is 
	constructor(handler, validCommands, errCallback) {
		this.handler = handler;
		this.validCommands = (validCommands) ? validCommands : [];
		this.errCallback = errCallback;
	};

	isValidCommand(cmdLetter) {
		const initialValue = false;
		return this.validCommands.reduce((prevValue, currentValue) => {
				return (prevValue || currentValue == cmdLetter);
		}, initialValue);
	}

	interpretCommand(cmd) {
		// check if valid command
		const cmdLetter = cmd && cmd.length >= 0 ? cmd[0] : null;
		const cmdParams = cmd && cmd.length > 1 ? cmd.splice(1) : [];

		let errMessage;
		const that = this;
		const errWrapper = (cmd, err) => {
			if (that.errCallback) {
				that.errCallback(cmd, err.toString());
			}
		};

		// if there is no command
		if (!cmd) {
			errMessage = "Command is null";
			errWrapper(cmd, errMessage);
			return;
		}

		// if an invalid command
		if (!this.isValidCommand(cmdLetter)) {
			errMessage = "Command is invalid or undefined in handler";
			errWrapper(cmd, errMessage);
			return;
		}
		const handlerFxn = this.handler ? this.handler[cmd] : null;
		if (!handlerFxn) {
			errMessage = "Handler function is undefined for command";
			errWrapper(cmd, errMessage);
			return;
		}
		// Run the handler function
		handlerFxn(cmd, cmdParams, errWrapper);
		console.log(`Handled command: ${cmd.toString()}`);
	}

	interpetCommandArray(cmds) {
		for (let i = 0; i < cmds.length; i++) {
			// interpet the code
			const cmd = cmds[i];
			this.interpretCommand(cmd);
		}
	}
}

export {MachineCommandInterpreter};
