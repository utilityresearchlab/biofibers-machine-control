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
import TextFieldSubmitter from './component/text-field-submitter'
import SetupParamSubmitter from './component/setup-param-submitter'
import TestingParamSubmitter from './component/testing-param-submitter'

import imgMachineLogoSrc from '../assets/img/machine-render-logo.png'
import imgUtilityLabLogoSrc from '../assets/img/utility-research-web-logo-500x75.png'

import * as BF_CONSTANTS from './lib/biofibers-machine/biofibers-machine-constants'
import {BiofibersMachineState} from './lib/biofibers-machine/biofibers-machine-state'

import * as LOGGER from './lib/logger-util';

import { GcodeBuilder } from './lib/machine-control/gcode-builder';
import * as GCODE_CONSTANTS from './lib/machine-control/gcode-constants'
import * as MachineResponseParser from './lib/machine-control/machine-response-parser';

import MaterialHelper from './lib/material-util/material-helper';

import SerialPortHelper from './lib/serial-util/serial-port-helper';


const ScanPortsRefreshTimeInMs = 3000;

class BaseMachineControlApp extends React.Component {

  constructor(props) {
		super(props);
		// https://reactjs.org/docs/composition-vs-inheritance.html
		this.state = {
			selectedSerialPort: this.props.serialCommunication.serialPortPath,
			baudRate: this.props.serialCommunication.baudRate,
			consoleData: [],
			availableSerialPorts: [SerialPortHelper.nonePort()],
			machineState: new BiofibersMachineState(),
			currentNozzleTemperature: BF_CONSTANTS.EXTRUDER_TEMPERATURE_MIN,
			currentSyringeWrapTemperature: BF_CONSTANTS.HEATER_WRAP_TEMPERATURE_MIN,
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

		this.handleOnChangeSpinningState = this.handleOnChangeSpinningState.bind(this);
		this.handleOnChangePullDownState = this.handleOnChangePullDownState.bind(this);
	}

	_getMachineState() {
		return this.state.machineState;
	}

	_setMachineState(state) {
		this.setState({
			machineState: state
		});
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

	_sendGcodeLines(gcodeLines) {
		if (!gcodeLines || gcodeLines.length == 0) {
			return;
		}
		gcodeLines.forEach((line, index) => {
			this.handleSendCommandClick(line);
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

	handleSendCommandClick(cmdText) {
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
		this.props.serialCommunication.sendBufferedCommand(cmdText, onSentCallback);
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
			// keep sending command to extrude until pull-down is stopped
			// TODO: Determine proper interval timing instead of hard-coding 5000 ms
			// const commandTime = MiscUtil.calculateCommandTimeInMilliSec(params['E'], params['X'], params['F']);
			// TODO (mrivera) - fix timeout interval 
			const that = this;
			let intervalId = setInterval(() => {
				let pullDownGcodeBuilder = new GcodeBuilder();
				const defaultParams = MaterialHelper.defaultParams()[this.state.selectedMaterial];
				console.log(MaterialHelper.defaultParams['E'], "hello");
				const pulldownGcodeLines = 
					pullDownGcodeBuilder.move({
							[GCODE_CONSTANTS.PARAM_E]: defaultParams[GCODE_CONSTANTS.PARAM_E],
							[GCODE_CONSTANTS.PARAM_X]: defaultParams[GCODE_CONSTANTS.PARAM_X],
							[GCODE_CONSTANTS.PARAM_F]: defaultParams[GCODE_CONSTANTS.PARAM_F],
						}, 
						'extrude and move X')
						.toGcode(); // value from experiments
				that._sendGcodeLines(pulldownGcodeLines);
			}, 100);
			this.setState({
				nIntervalId: intervalId,
				pullDownInProgress: true
			});
		} else {
			if (this.state.nIntervalId) {
				clearInterval(this.state.nIntervalId);
			}
			// stop pull down
			this.setState({
				pullDownInProgress: false,
				nIntervalId: null
			});
			//let gcodeBuilder = new GcodeBuilder();
			// gcodeBuilder.setSpindleSpeed(0, true);
			//this._sendGcodeLines(gcodeBuilder.toGcode());
		}
		// Update machine state
		let machineState = this._getMachineState();
		machineState.setMachineIsPullingDown(isOn);
		this._setMachineState(machineState);
	}


	// Console Data //
	handleOnReceivedSerialData(data, timestamp) {
		// TODO use parser on serial data to figure out if it is a response, or error etc
		const dataString = data.toString();
		const parsedResult = MachineResponseParser.parseResponse(dataString);
		switch (parsedResult.responseType) {
			case MachineResponseParser.RESPONSE_TYPE.TEMPERATURE_STATUS:
				// update temps
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
		const newData = new ConsoleDataItem(parsedResult.line, timestamp, ConsoleDataType.RECEIVED);
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
		const currentState = this._getMachineState();
		const isConnected = currentState.isMachineConnected();
		const isDisconnected = currentState.isMachineDisconnected();
		const isSpinning = currentState.isMachineSpinning();
		const isPullingDown = currentState.isMachinePullingDown();
		const isHeatingOn = currentState.isHeatingOn();

		const currentNozzleTemp = currentState.getCurrentNozzleTemp();
		const setPointNozzleTemp = currentState.getSetpointNozzleTemp();

		const currentHeaterWrapTemp = currentState.getCurrentHeaterWrapTemp();
		const setPointHeaterWrapTemp = currentState.getSetpointHeaterWrapTemp();

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
			<Box component="div" className="App center-page" sx={{paddingTop: 2, paddingBottom: 2}}>
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
											onChange={this.handleOnSelectSerialPort}>
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
											onChange={this.handleOnSelectBaudRate}>
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
							currentNozzleTemp={currentNozzleTemp}
							currentSyringeWrapTemp={currentHeaterWrapTemp}
							setPointNozzleTemp={setPointNozzleTemp}
							setPointHeaterWrapTemp={setPointHeaterWrapTemp}
							isHeatingOn={isHeatingOn}
							isMachinePullingDown={isPullingDown}
							onChangePullDownState={this.handleOnChangePullDownState}
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
							onChangeSpinningState={this.handleOnChangeSpinningState} />
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
			</Box>
		);
	}
}

export default BaseMachineControlApp;
