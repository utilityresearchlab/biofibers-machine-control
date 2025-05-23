import * as React from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';

import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import InfoIcon from '@mui/icons-material/Info';
import SendIcon from '@mui/icons-material/Send';
import UsbIcon from '@mui/icons-material/Usb';
import UsbOffIcon from '@mui/icons-material/UsbOff';

import {ConsoleDataItem, ConsoleDataType} from './lib/console-data';

import * as APP_SETTINGS from './app-settings';

import Console from './component/console';
import SetupParamSubmitter from './component/setup-param-submitter'
import StatusBar from './component/status-bar';

import TextFieldSubmitter from './component/text-field-submitter'
import TestingParamSubmitter from './component/testing-param-submitter'

import imgMachineLogoSrc from '../assets/img/machine-render-logo.png'
import imgUtilityLabLogoSrc from '../assets/img/utility-research-web-logo-500x75.png'

import * as BF_CONSTANTS from './lib/biofibers-machine/biofibers-machine-constants'
import {BiofibersMachineState} from './lib/biofibers-machine/biofibers-machine-state'

import * as LOGGER from './lib/logger-util';

import { GcodeBuilder } from './lib/machine-control/gcode-builder';
import * as GCODE_CONSTANTS from './lib/machine-control/gcode-constants'
import MiscUtil from './lib/machine-control/misc-util'
import * as MachineResponseParser from './lib/machine-control/machine-response-parser';

import MaterialHelper from './lib/material-util/material-helper';
import SerialPortHelper from './lib/serial-util/serial-port-helper';

const ScanPortsRefreshTimeInMs = 3000;

const MACHINE_STATE = new BiofibersMachineState();

class BaseMachineControlApp extends React.Component {

  constructor(props) {
		super(props);
		// https://reactjs.org/docs/composition-vs-inheritance.html
		this.state = {
			selectedSerialPort: this.props.serialCommunication.serialPortPath,
			baudRate: this.props.serialCommunication.baudRate,
			consoleData: [],
			availableSerialPorts: [SerialPortHelper.nonePort()],
			machineState: MACHINE_STATE,
			selectedMaterial: MaterialHelper.availableMaterials()[0]
		};

		// init serialport listening
		this.refreshSerialPortsInterval = null;

		// Bind events to use "this" in callback
		this.handleOnSelectSerialPort = this.handleOnSelectSerialPort.bind(this);
		this.handleOnSelectBaudRate = this.handleOnSelectBaudRate.bind(this);
		this.handleConnectClick = this.handleConnectClick.bind(this);
		this.handleSendCommandClick = this.handleSendCommandClick.bind(this);
		this.handleDisconnectClick = this.handleDisconnectClick.bind(this);
		this.handleOnReceivedSerialData = this.handleOnReceivedSerialData.bind(this);

		this.handleOnChangeHeatingState = this.handleOnChangeHeatingState.bind(this);
		this.handleOnChangeSpinningState = this.handleOnChangeSpinningState.bind(this);
		this.handleOnChangePullDownState = this.handleOnChangePullDownState.bind(this);
		
		this.handleOnSendMultipleSpinningCommands = this.handleOnSendMultipleSpinningCommands.bind(this);

		this.handleEmergencyStop = this.handleEmergencyStop.bind(this);
	}

	_getMachineState() {
		return MACHINE_STATE;
	}

	// Note that the `callback` here receives "prevState" as an input from the
	// setState call
	_setMachineState(state, callback=null) {
		this.setState({
			machineState: state
		}, callback);

		// If we were disconnected or emergency stopped kill any send intervals
		if (state.isMachineDisconnected() || state.isMachineEmergencyStopped()) {
			// clear interval for pull-down or spinning
			if (this.state.nIntervalId) {
				clearInterval(this.state.nIntervalId);
			};
			this.setState({
				nIntervalId: null,
			});
		}
	}

	componentDidMount() {
		this.listenForAvailableSerialPorts();
		// Check if this is the first load by seeing if our object exists in local storage
		if (localStorage.getItem('firstLoadDone') === null) {
			// If it's the first load, set the flag in local storage to true and reload the page
			localStorage.setItem('firstLoadDone', 1);
			LOGGER.logD('This is the initial load'); 
		  } else {
			LOGGER.logD('This is a page refresh');
		  } 
	}

	componentWillUnmount() {
		this.props.serialCommunication.disconnect();
		if (this.refreshSerialPortsInterval) {
			clearTimeout(this.refreshSerialPortsInterval);
		}
	}

	listenForAvailableSerialPorts() {
		const that = this;
		if (this.refreshSerialPortsInterval) {
			clearInterval(this.refreshSerialPortsInterval);
		}
		// updates serial ports
		const triggerUpdateSerialPortsList = () => {
			SerialPortHelper.listSerialPorts().then((result) => {
				that.handleUpdateAvailableSerialPorts(result.ports, result.err);
			});
		}
		// Run immediately
		triggerUpdateSerialPortsList();

		// Then set interval
		this.refreshSerialPortsInterval = setInterval(() => {
			triggerUpdateSerialPortsList();
		}, ScanPortsRefreshTimeInMs);
	}

	// Sends the start g-code for our machine and updates machine state
	initMachineConnection() {
		// Update machine state variable to connected
		let currentState = this._getMachineState();
		currentState.setMachineConnected();
		this._setMachineState(currentState);

		// Send start g-code
		const that = this;
		setTimeout(() => {
			if (that._getMachineState().isMachineDisconnected()) {
				// if we've disconnected, stop sending commands
				LOGGER.logD("Cancelling start gcode timeout (Disconnected).");
				return;
			}

			if (that._getMachineState().isMachineEmergencyStopped()) {
				// if we have an E-stop exit immediately
				LOGGER.logD("Cancelling start gcode timeout (EMERGENCY STOPPED).");
				return;
			}
			const initMachineGcodeLines = new GcodeBuilder()
			.comment('Machine Init G-Code')
			.reportTemperaturesImmediately()
			.reportTemperaturesInterval()
			.useRelativeCoordinates()
			.useRelativeExtrusionDistances()
			.resetExtrusionDistance()
			.toGcode();
			that._sendGcodeLines(initMachineGcodeLines);
		}, APP_SETTINGS.MACHINE_INIT_TIMEOUT);
		
	}
	
	_sendGcodeLines(gcodeLines, shouldSendImmediately=false) {
		if (!gcodeLines || gcodeLines.length == 0) {
			return;
		}
		gcodeLines.forEach((line, index) => {
			this.handleSendCommandClick(line, shouldSendImmediately);
		});

	}

	handleUpdateAvailableSerialPorts(updatedPortsInfo, err) {
		if (err) {
			LOGGER.logE(err);
			// todo show port info in console?
		}
		const updatedPorts = (err || !updatedPortsInfo || updatedPortsInfo.length == 0)
			? [SerialPortHelper.nonePort()]
			: updatedPortsInfo;
		this.setState({availableSerialPorts: updatedPorts});
		LOGGER.log("Serial Ports - ", updatedPorts);

		// If our serial port disappears, we have a forced disconnect
		let isPortStillActive = false;
		updatedPorts.forEach((port, index) => {
			isPortStillActive ||= (port.path == this.state.selectedSerialPort);
		});
		if (!isPortStillActive) {
			// Port is no longer active, so process disconnect to reset machine state
			this.handleLostSerialPortConnection();
		}
	}

	handleOnSelectSerialPort(event) {
		const serialPortName = String(event.target.value);
		this.setState({selectedSerialPort: serialPortName});
	}

	handleOnSelectBaudRate(event) {
		const baudRate = Number(event.target.value);
		this.setState({baudRate: baudRate});
	}

	handleConnectClick() {
		const that = this;
		const onConnectCallback = (err) => {
			const portPath = that.props.serialCommunication.getSerialPortPath();
			const baudRate = that.props.serialCommunication.getBaudRate();
			let consoleMessage;
			let messageDataType;
			if (err) {
				// Prep error on connecting console Message
				consoleMessage = `Error connecting to '${portPath}' (Baud: ${baudRate}): ${err.toString()}`;
				messageDataType  = ConsoleDataType.ERROR;
			} else {
				// set-up data receiving after connection
				that.props.serialCommunication.startReceiving(that.handleOnReceivedSerialData);
				// Prep connected console message
				consoleMessage = `Connected to '${portPath}' (Baud: ${baudRate}).`;
				messageDataType = ConsoleDataType.INFO;
				that.initMachineConnection();

				// Update machine state to connected
				let machineState = that._getMachineState();
				machineState.setMachineConnected();
				that._setMachineState(machineState);
			}

			// Update app
			that.addConsoleData(consoleMessage, messageDataType);
			that.forceUpdate();
		};
		// Disconnect from previous serial, if necessary
		if (this.props.serialCommunication.isConnected()) {
			this.props.serialCommunication.disconnect();
		}
		// Set current port and baud
		this.props.serialCommunication.setSerialPort(this.state.selectedSerialPort, this.state.baudRate);
		this.props.serialCommunication.connect(onConnectCallback);
	}

	handleLostSerialPortConnection() {
		// Build Lost Connection Message
		const portPath = this.props.serialCommunication.getSerialPortPath();
		const baudRate = this.props.serialCommunication.getBaudRate();
		let consoleMessage = `Connection Lost to '${portPath}' (Baud: ${baudRate}).`;
		let messageDataType = ConsoleDataType.ERROR;
		
		// Update console log
		this.addConsoleData(consoleMessage, messageDataType);
		this.forceUpdate();


		// Start Disconnect;
		this.props.serialCommunication.disconnect();

		// Update machine state
		let machineState = this._getMachineState();
		machineState.setMachineDisconnected();
		this._setMachineState(machineState);

		// Deselect name of serial port
		this.setState({selectedSerialPort: SerialPortHelper.serialPortPathNone()});
	}

	handleDisconnectClick() {
		// Build Disconnect callback
		const that = this;
		const onDisconnectCallback = (err) => {
			const portPath = that.props.serialCommunication.getSerialPortPath();
			const baudRate = that.props.serialCommunication.getBaudRate();
			let consoleMessage;
			let messageDataType;
			if (err) {
				// Prep error on disconnect console Message
				consoleMessage = `Error disconnecting from '${portPath}' (Baud: ${baudRate}): ${err.toString()}`;
				messageDataType  = ConsoleDataType.ERROR;
			} else {
				// Prep disconnect console message
				consoleMessage = `Disconnected from '${portPath}' (Baud: ${baudRate}).`;
				messageDataType = ConsoleDataType.INFO;
			}
			// Update console log
			that.addConsoleData(consoleMessage, messageDataType);
			that.forceUpdate();
		};
		// Start Disconnect;
		this.props.serialCommunication.disconnect(onDisconnectCallback);

		// Update machine state
		let machineState = that._getMachineState();
		machineState.setMachineDisconnected();
		that._setMachineState(machineState);
	}

	handleSendCommandClick(cmdText, shouldSendImmediately=false) {
		if (!cmdText || cmdText.length == 0) {
			return;
		}
		// Prep send command callback
		const that = this;
		const onSentCallback = (cmd, err) => {
			let consoleMessage;
			let messageDataType;
			if (err) {
				// Prep error on disconnect console Message
				consoleMessage = `Error sending command '${cmd}': ${err.toString()}`;
				messageDataType  = ConsoleDataType.ERROR;
			} else {
				// Prep disconnect console message
				consoleMessage = cmdText.toString();
				messageDataType = ConsoleDataType.SENT;
			}
			// Update console log
			that.addConsoleData(consoleMessage, messageDataType);
		};
		// Trigger sending command
		this.props.serialCommunication.sendBufferedCommand(cmdText, onSentCallback, shouldSendImmediately);
	}

	// Triggered from the enable heating button
	handleOnChangeHeatingState(setPointHeaterWrapTemp, setPointNozzleTemp) {
		let machineState = this._getMachineState();

		let gcodeBuilder = new GcodeBuilder();
		//gcodeBuilder.retract(this.state.adjustPumpDistance, this.state.adjustPumpFeedRate);
		if (machineState.isHeatingOn()) {
			// Turn heaters off
			gcodeBuilder.setTemperature(0, false, BF_CONSTANTS.HEATER_NOZZLE_TOOL_ID);
			gcodeBuilder.setTemperature(0, false, BF_CONSTANTS.HEATER_SYRINGE_WRAP_TOOL_ID);
		} else {
			// Turn heaters on
			gcodeBuilder.setTemperature(setPointNozzleTemp, false, BF_CONSTANTS.HEATER_NOZZLE_TOOL_ID);
			gcodeBuilder.setTemperature(setPointHeaterWrapTemp, false, BF_CONSTANTS.HEATER_SYRINGE_WRAP_TOOL_ID);
		}
		const gcodeLines = gcodeBuilder.toGcode();
		this._sendGcodeLines(gcodeLines);
		// Update state 		
		machineState.setHeaterWrapTempSetPoint(setPointHeaterWrapTemp);
		machineState.setNozzleTempSetPoint(setPointNozzleTemp);
		this._setMachineState(machineState);
	}

	handleOnChangeSpinningState(isOn) {
		// TODO cancel pulldown if running, the handle isOn state
		//if 
		// todo
	}


	handleOnChangePullDownState(isOn) {
		// TODO handle machine state and clean up vars
		if (this._getMachineState().isMachinePullingDown() && isOn) {
			// If we're already pulling down, then no need to restart
			// just exit early 
			return;
		}
		// Handle on or off for pull down
		if (isOn) {
			let gcodeBuilder = new GcodeBuilder();
			const gcodeLines = gcodeBuilder
				.comment('start pull down')
				.useRelativeCoordinates()
				.useRelativeExtrusionDistances()
				.resetExtrusionDistance()
				.toGcode();
			this._sendGcodeLines(gcodeLines);
			
			// Prepare time tracking
			// We use a min interval time of 50 ms to avoid overloading/blocking ui
			// For normal printing this would be smaller, but with fibers it can be fairly large as
			// the movements take a while
			const minIntervalTimeMs = 100;
			let timeKeeper = {
				lastSendCommandTime: 0,
				nextIntervalTimeMs: minIntervalTimeMs
			};
			// Set up interval for pull down
			let isInitialRun = true;
			const that = this;
			let intervalId = setInterval(() => {
				if (that._getMachineState().isMachineDisconnected()) {
					// if we've disconnected, stop sending commands
					LOGGER.logD("Cancelling sending pull down command interval (Disconnected).");
					return;
				}

				if (that._getMachineState().isMachineEmergencyStopped()) {
					// if we have an E-stop exit immediately
					LOGGER.logD("Cancelling sending pull down command interval (EMERGENCY STOPPED).");
					return;
				}

				const defaultParams = MaterialHelper.defaultParams()[this.state.selectedMaterial];

				// TODO (mrivera): replace with E, X, F for pull-down inputs in interface
				let paramE = defaultParams[GCODE_CONSTANTS.PARAM_E];
				let paramX = defaultParams[GCODE_CONSTANTS.PARAM_X];
				let paramF = defaultParams[GCODE_CONSTANTS.PARAM_F];
				if (isInitialRun) {
					timeKeeper.nextIntervalTimeMs = MiscUtil.calculateCommandTimeInMilliSec(paramE, paramX, paramF);
					isInitialRun = false;
				}


				const timeDelta = Date.now() - timeKeeper.lastSendCommandTime;
				let minCommandTime = Math.max(minIntervalTimeMs, timeKeeper.nextIntervalTimeMs - minIntervalTimeMs);
				// Check if ready to send command
				if (timeDelta >= minCommandTime) {
					let pullDownGcodeBuilder = new GcodeBuilder();
					const pulldownGcodeLines = 
						pullDownGcodeBuilder.move({
								[GCODE_CONSTANTS.PARAM_E]: paramE,
								[GCODE_CONSTANTS.PARAM_X]: paramX,
								[GCODE_CONSTANTS.PARAM_F]: paramF,
							}, 
							'extrude and move X')
							.toGcode(); // value from experiments
					that._sendGcodeLines(pulldownGcodeLines);

					// Update time keeping
					timeKeeper.nextIntervalTimeMs = MiscUtil.calculateCommandTimeInMilliSec(paramE, paramX, paramF);
					timeKeeper.lastSendCommandTime = Date.now();
					
					LOGGER.logD(`Sending command: ${pulldownGcodeLines} with interval time ${timeKeeper.nextIntervalTimeMs}`);
				} else {
					LOGGER.logD("Pull Down: Next command not ready.");
				}
			}, minIntervalTimeMs);
			this.setState({
				nIntervalId: intervalId,
			});
		} else {
			if (this.state.nIntervalId) {
				clearInterval(this.state.nIntervalId);
			}
			// stop pull down
			this.setState({
				nIntervalId: null
			});
			//let gcodeBuilder = new GcodeBuilder();
			// gcodeBuilder.setSpindleSpeed(0, true);
			//this._sendGcodeLines(gcodeBuilder.toGcode());
		}
		// Update machine state
		const machineState = this._getMachineState();
		machineState.setMachineIsPullingDown(isOn);
		this._setMachineState(machineState);
	}

	// Handles sending multiple spinning commands from the testing param submitter
	handleOnSendMultipleSpinningCommands(spinningCommand, numCommands, timePerCommandMs) {
		// If no commands, exit early
		if (numCommands <= 0) {
			return;
		}

		if (this._getMachineState().isMachinePullingDown()) {
			// If we're pulling down, we cancel the pull-down to send spinning commands
		 	this.handleOnChangePullDownState(false);
		}
	
		
		// Handle initial setup
		const gcodeBuilder = new GcodeBuilder();
		const gcodeLines = gcodeBuilder
			.comment('start pull down')
			.useRelativeCoordinates()
			.useRelativeExtrusionDistances()
			.resetExtrusionDistance()
			.toGcode();

		// Send initial setup lines
		this._sendGcodeLines(gcodeLines);
		
		// Prepare a timeout function to send the commands at the proper timeout interval
		// We set a timeout that is slightly less than our finished command time, otherwise the min timeout
		const minTimeoutTimeMs = 10;
		const timeoutOffset = 100;
		const timeoutTimeMs = Math.max(timePerCommandMs - timeoutOffset, minTimeoutTimeMs);
		
		// Send the first command immediately with comment to console
		let commandComment = gcodeBuilder
			.reset()
			.comment(`spinning command ${1} of ${numCommands}`)
			.toGcodeString(); 
		this._sendGcodeLines([commandComment, spinningCommand]);
		LOGGER.logD(`Spinning command sent ${1} of ${numCommands}: ${spinningCommand} with interval time ${timeoutTimeMs}`);

		// If only 1 command, we exit early
		if (numCommands == 1) {
			return;
		}

		// Now schedule timeout for additional commands
		const that = this;
		const sendMultipleCommandsTimeout = (cmd, currentCommandCount, originalNumCommands) => {
			setTimeout(() => {
				if (that._getMachineState().isMachineDisconnected()) {
					// if we've disconnected, stop sending commands
					LOGGER.logD("Cancelling sending spinning command in timeout (Disconnected).");
					return;
				}
				if (that._getMachineState().isMachineEmergencyStopped()) {
					// if we have an E-stop exit immediately
					LOGGER.logD("Cancelling sending spinning command in timeout (EMERGENCY STOPPED).");
					return;
				}
				// Send the command
				let comment = gcodeBuilder
					.reset()
					.comment(`spinning command ${currentCommandCount + 1} of ${originalNumCommands}`)
					.toGcodeString();
				that._sendGcodeLines([comment, cmd]);

				// Increment our cmdCount after sending
				currentCommandCount += 1;
				LOGGER.logD(`Spinning command sent ${currentCommandCount} of ${originalNumCommands}: ${cmd} with interval time ${timeoutTimeMs}`);


				// If we have commands left, schedule the next timeout
				if (currentCommandCount < originalNumCommands) {
					sendMultipleCommandsTimeout(cmd, currentCommandCount, originalNumCommands);
				}
		}, timeoutTimeMs);
		}
		// Execute the timeout function
		let cmdCount = 1;
		sendMultipleCommandsTimeout(spinningCommand, cmdCount, numCommands);
	}

	// Fired when an emergency stop is triggered
	handleEmergencyStop() {
		const gcodeBuilder = new GcodeBuilder();
		const gcodeLines = gcodeBuilder
			.fullShutdown()
			.toGcode();
		this._sendGcodeLines(gcodeLines);

		// Cancel all commands and time outs 
	}

	// Console Data //
	handleOnReceivedSerialData(data, timestamp) {
		// TODO use parser on serial data to figure out if it is a response, or error etc
		const dataString = data.toString();
		const parsedResult = MachineResponseParser.parseResponse(dataString);
		let consoleDataType = ConsoleDataType.RECEIVED;
		switch (parsedResult.responseType) {
			case MachineResponseParser.RESPONSE_TYPE.TEMPERATURE_STATUS:
				// update temps
				consoleDataType = ConsoleDataType.RECEIVED_STATUS;
				let machineState = this._getMachineState();
				const tempData = parsedResult.parsedData;  
				for (let i = 0; i < tempData.length; i += 1) {
					const item = tempData[i];
					const tool = item.tool;
					let toolId = parseInt(tool.substring(1));
					if (isNaN(toolId)) {
						// No Id means it is the "active" temp with key "T"
						continue;
					}
					const currentTemp = parseFloat(item.currentTemp);
					const setPointTemp = parseFloat(item.setPointTemp);
					switch(toolId) {
						case BF_CONSTANTS.HEATER_SYRINGE_WRAP_TOOL_ID:
							machineState.setCurrentHeaterWrapTemp(currentTemp, setPointTemp);
							break;
						case BF_CONSTANTS.HEATER_NOZZLE_TOOL_ID:
							machineState.setCurrentNozzleTemp(currentTemp, setPointTemp);
							break;
						default:
							LOGGER.logE(`Temperature status not defined for tool:,${toolId}`);
					}
				};
				// Update state
				this._setMachineState(machineState);
				break;
			case MachineResponseParser.RESPONSE_TYPE.ERROR:
				// handle error
				break;
			case MachineResponseParser.RESPONSE_TYPE.UNKNOWN:
			default: 
				// todo: throw warning in console with response as message
				break;
		}

		// const cmds = parsedResult && parsedResult.words ? parsedResult.words : [];
		// this.commandInterpreter.interpetCommandArray(cmds);
		// originally dataString for data item
		const newData = new ConsoleDataItem(parsedResult.line, timestamp, consoleDataType);
		this.setState(prevState => ({
			consoleData: [...prevState.consoleData, newData]
		}));
		LOGGER.logD("Received data:", newData);
	}

	addConsoleData(data, dataType=ConsoleDataType.INFO, timestamp=Date.now()) {
		const dataString = data.toString();
		const newData = new ConsoleDataItem(dataString, timestamp, dataType);
		this.setState((prevState, props) => ({
			consoleData: [...prevState.consoleData, newData]
		}));
	}

	// Rendering //
	getRenderedSerialPortItems() {
		const availableSerialPorts = this.state.availableSerialPorts;
		let renderedSerialPortsItems = availableSerialPorts.map((item, index) => {
			const portPath = item.path;
			const portName = item.path == SerialPortHelper.serialPortPathNone() 
				? 'None' 
				: item.path;
			return (
				<MenuItem
					key={"item-menu-serial-port-" + portName}
					value={portPath}>{portName}</MenuItem>
			);
		});
		return renderedSerialPortsItems;
	}

	getRenderedBaudRateItems() {
		const availableBaudRates = SerialPortHelper.availableBaudRates();
		let renderedBaudRateItems = availableBaudRates.map((item, index) => {
			const value = item.toString();
			return (
				<MenuItem
					key={"item-baud-" + value}
					value={value}>{value}</MenuItem>
			);
		});
		return renderedBaudRateItems;
	}

	render() {
		// Machine state
		const machineState = this._getMachineState();
		const isConnected = machineState.isMachineConnected();
		const isDisconnected = machineState.isMachineDisconnected();
		const isSpinning = machineState.isMachineSpinning();
		const isPullingDown = machineState.isMachinePullingDown();
		const isHeatingOn = machineState.isHeatingOn();

		const currentNozzleTemp = machineState.getCurrentNozzleTemp();
		const setPointNozzleTemp = machineState.getSetpointNozzleTemp();

		const currentHeaterWrapTemp = machineState.getCurrentHeaterWrapTemp();
		const setPointHeaterWrapTemp = machineState.getSetpointHeaterWrapTemp();

		const consoleData = this.state.consoleData;
		const renderedSerialPortsItems = this.getRenderedSerialPortItems();
		const renderedBaudRateItems = this.getRenderedBaudRateItems();
		const selectedPortName = this.state.serialPort;
		const serialCommIsConnected = isConnected;
		const serialCommIsDisconnected = !serialCommIsConnected;
		// const serialCommIsConnected = (this.props.serialCommunication) ? this.props.serialCommunication.isConnected() : false;
		// const serialCommIsDisconnected = !serialCommIsConnected;
		//const isInputDisabled = serialCommIsDisconnected && !this.props.isDebugging;
		const isInputDisabled = serialCommIsDisconnected && !this.props.isDebugging;
		const githubUrl = APP_SETTINGS.BIOFIBERS_GITHUB_URL;
		const currentYear = new Date().getFullYear();
		return (
			<Box component="div" className="App center-page" sx={{paddingTop: 2, paddingBottom: 4}}>
				<Box component="header">
					<Stack
						direction="row"
						justifyContent="left"
						alignItems="center"
						spacing={2}
						p={1}>
						<img className={"app-logo"} src={imgMachineLogoSrc} alt="Biofibers Machine Logo" />
						<Stack
							direction="column"
							justifyContent="left"
							alignItems="left">
							<Typography gutterBottom variant="h4" style={{marginBottom: 0}}>
								Biofibers Machine Control 
							</Typography>
							<Typography  variant="h5">
								v0.1.0-beta
							</Typography>
							<Typography  variant="body1">
									<a style={{textColor: 'gray', textDecoration: 'none'}} href={githubUrl} target='_blank'>{githubUrl}</a>
							</Typography>
						</Stack>
					</Stack>
					<Divider sx={{marginTop: 2}}/>

					<Box component="div">
					<List sx={{listStyleType: 'disc'}} >
						<ListItem sx={{fontWeight: "600"}}> 
							<ListItemIcon 
								sx={{minWidth: 40}}>
								<InfoIcon color="warning" />
							</ListItemIcon>
							This app is in beta testing and likely has bugs!
						</ListItem>
						<ListItem>
							<Box variant="div">
							If you run into issues, please reach out with your version number in 
							<span sx={{fontWeight: "600"}}>
							&nbsp;<em>#software-control</em>&nbsp;
							</span> on Discord.
							</Box>
						</ListItem>
					</List>
					</Box>

				</Box>
				<Divider sx={{width: "100%", margin: "0 auto"}} />
				<Box variant="div">
					<Box variant="div">
							<Typography gutterBottom variant="h6" component="div" sx={{paddingTop: '1em'}} >
								Connect
							</Typography>
							<Stack
								direction="row"
								justifyContent="left"
								alignItems="left"
								spacing={1}
								p={1}>
									<FormControl size="small" sx={{minWidth: 350 }}>
										<InputLabel id="available-serial-ports-label">Serial Port</InputLabel>
										<Select
											labelId="available-serial-ports"
											id="available-serial-ports-select"
											label="Serial Port"
											value={this.state.selectedSerialPort}
											onChange={this.handleOnSelectSerialPort}
											MenuProps={{
												disableScrollLock: true, // stops scroll bar from popping
											  }}>
											{renderedSerialPortsItems}
										</Select>
									</FormControl>
									<FormControl size="small" sx={{mb: 1, minWidth: 120 }} >
										<InputLabel id="available-serial-baud-rates-label">Baud Rate</InputLabel>
										<Select
											labelId="serial-port-baud-rate"
											id="serial-port-baud-rate-select"
											label="Baud Rate"
											value={this.state.baudRate}
											onChange={this.handleOnSelectBaudRate}
											MenuProps={{
												disableScrollLock: true, // stops scroll bar from popping
											  }}>
											{renderedBaudRateItems}
										</Select>
									</FormControl>
                    				<Box variant="div" sx={{display: 'flex'}}>
										<Button
											size="medium"
											variant="outlined"
											color={(serialCommIsDisconnected) ? "success" : "error"}
											startIcon={(serialCommIsDisconnected)
												? <UsbIcon/>
												: <UsbOffIcon />}
											onClick={(serialCommIsDisconnected)
												? this.handleConnectClick
												: this.handleDisconnectClick} >
													{(!serialCommIsConnected)
														? "Connect"
														: "Disconnect"}
										</Button>
									</Box>
							</Stack>
					</Box>

					<Divider sx={{marginTop: 4, marginBottom: 2}} />

					<Box variant="div">
						<Typography gutterBottom variant="h6" component="div">
                    		Setup
                		</Typography>         
						<SetupParamSubmitter
							disabled={isInputDisabled}
							machineState={machineState}
							onChangePullDownState={this.handleOnChangePullDownState}
							onChangeHeatingState={this.handleOnChangeHeatingState}
							onSubmitCallback={this.handleSendCommandClick} />
					</Box>

					<Divider sx={{marginTop: 4, marginBottom: 2}} />

					<Box variant="div">
						<Typography gutterBottom variant="h6" component="div">
                   			Spinning
                		</Typography>

						<TestingParamSubmitter
							disabled={isInputDisabled}
							onSubmitCallback={this.handleSendCommandClick}
							onChangeSpinningState={this.handleOnChangeSpinningState}
							onSendMultipleSpinningCommands={this.handleOnSendMultipleSpinningCommands} />
					</Box>

					<Divider sx={{marginTop: 4, marginBottom: 2}}/>
					
					<Box variant="div">
						<Typography gutterBottom variant="h6" component="div">
								Command Console
						</Typography>
						<Box 
							variant="div"
							sx={{minWidth: 700, maxWidth: 700}}
							p={1}>
							<TextFieldSubmitter	
								fieldLabel="Send Command"
								buttonLabel="Send"
								buttonIcon={<SendIcon />}
								disabled={isInputDisabled}
								onSubmitCallback={this.handleSendCommandClick} />
                    		<Box
								variant="div" 
								sx={{paddingTop: 1}}>
								<Console data={consoleData} />
							</Box>
						</Box>
					</Box>
				</Box>
				<Divider sx={{marginTop: 4, marginBottom: 4}} />
				<Box component="footer">
					<Box variant="div">
						{/* footer */}
						<Stack
							direction="row"
							justifyContent="center"
							alignItems="center"
							spacing={2}
							p={1}>
							<Stack
								direction="column"
								justifyContent="center"
								alignItems="center"
								spacing={1}
								p={1}
								>
									<a href={APP_SETTINGS.UTILITY_RESEARCH_LAB_URL} target="_blank">
										<img width={310} src={imgUtilityLabLogoSrc} alt="Utility Research Lab Logo" />
									</a>
									<Typography color="gray"> © 2021-{currentYear}, Utility Research Lab. 
										All rights reserved.
									</Typography> 
								</Stack>
						</Stack>
					</Box>
				</Box>
				<Box 
					display="flex"
					alignItems="center"
					justifyContent="center">
					<Stack
						direction="row"
						justifyContent="center"
						alignContent="center"
						spacing={1}
						position={"relative"}
						zIndex={1000}
						height={40}
						style={{
							position: 'fixed', 
							bottom: 0, //right: 10 originally 
							justifyContent: 'space-around'}}>
							<Box 
								variant="div" 
								style={{
									backgroundColor: "#f4f4f4",
									border: "1px solid lightGray",
									borderTopLeftRadius: 5,
									borderTopRightRadius: 5, 
								}}
								paddingTop={0.5}
								paddingBottom={0.5}
								paddingLeft={1}
								paddingRight={1}
								>
								<StatusBar
									display="flex"
									justifyContent="center"
									alignItems="center"
									machineState={machineState}
									onEmergencyStopClicked={this.handleEmergencyStop} /> 
							</Box>
					</Stack>
				</Box>
			</Box>
		);
	}
}

export default BaseMachineControlApp;
