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
import SerialPortHelper from './lib/serial-util/serial-port-helper';

import {MachineCommandInterpreter} from './lib/machine-control/command-interpreter';
import {parseLine} from './lib/machine-control/command-parser';
import {MACHINE_COMMANDS, MACHINE_ERROR_CODES} from './lib/machine-control/machine-protocol';

import * as APP_SETTINGS from './app-settings';
import Console from './component/console';
import TextFieldSubmitter from './component/text-field-submitter'
import SetupParamSubmitter from './component/setup-param-submitter'
import TestingParamSubmitter from './component/testing-param-submitter'

import imgMachineLogoSrc from '../assets/img/machine-render-logo.png'
import imgUtilityLabLogoSrc from '../assets/img/utility-research-web-logo-500x75.png'

import * as LOGGER from './lib/logger-util';


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
		};

		// init serialport listening
		this.refreshSerialPortsTimeout = null;

		// Bind events to use "this" in callback
		this.handleOnSelectSerialPort = this.handleOnSelectSerialPort.bind(this);
		this.handleOnSelectBaudRate = this.handleOnSelectBaudRate.bind(this);
		this.handleConnectClick = this.handleConnectClick.bind(this);
		this.handleSendCommandClick = this.handleSendCommandClick.bind(this);
		this.handleDisconnectClick = this.handleDisconnectClick.bind(this);
		this.handleOnReceivedConsoleData = this.handleOnReceivedConsoleData.bind(this);

		// set-up machine protocol handler for commands
		this.commandInterpreter = new MachineCommandInterpreter(
			this.createCommandResponseHandler(),
			MACHINE_COMMANDS.ALL_COMMANDS,
			this.createCommandInterpreterErrorCallback());
	}

	createCommandResponseHandler() {
		const that = this;
		const handler = {};
		handler[MACHINE_COMMANDS.RUN] = (cmd, cmdParams, errCallback) => {
			that.addConsoleData("Machine is running.", ConsoleDataType.RECEIVED);
		};

		handler[MACHINE_COMMANDS.STOP] = (cmd, cmdParams, errCallback) => {
			that.addConsoleData("Machine is stopped.", ConsoleDataType.RECEIVED);
		};

		handler[MACHINE_COMMANDS.SET_DELIVERY_SPEED] = (cmd, cmdParams, errCallback) => {
			that.addConsoleData("Delivery speed updated.", ConsoleDataType.RECEIVED);
		};

		handler[MACHINE_COMMANDS.SET_SPINDLE_SPEED] = (cmd, cmdParams, errCallback) => {
			that.addConsoleData("Spindle speed updated.", ConsoleDataType.RECEIVED);
		};

		handler[MACHINE_COMMANDS.PING] = (cmd, cmdParams, errCallback) => {
			that.addConsoleData("Ping Response - Machine is connected and responding.", ConsoleDataType.RECEIVED);
		};

		handler[MACHINE_COMMANDS.RESET_ELEVATOR] = (cmd, cmdParams, errCallback) => {
			that.addConsoleData("Machine elevator is resetting.", ConsoleDataType.RECEIVED);
		};

		handler[MACHINE_COMMANDS.RESET_ELEVATOR] = (cmd, cmdParams, errCallback) => {
			that.addConsoleData("Machine elevator is resetting.", ConsoleDataType.RECEIVED);
		};

		handler[MACHINE_COMMANDS.DEBUG] = (cmd, cmdParams, errCallback) => {
			that.addConsoleData(`Debug Info / ${cmdParams.toString()} `, ConsoleDataType.INFO);
		};

		handler[MACHINE_COMMANDS.SUCCESS] = (cmd, cmdParams, errCallback) => {
			that.addConsoleData("Previous command succeeded.", ConsoleDataType.RECEIVED);
		}

		handler[MACHINE_COMMANDS.ERROR] = (cmd, cmdParams, errCallback) => {
			const errorCode = cmdParams && cmdParams.length >= 1 ? cmdParams[0] : MACHINE_ERROR_CODES.UNDEFINED;
			let errMessage = '';
			switch (errorCode) {
				case MACHINE_ERROR_CODES.BUFFER_FULL:
					// buffer is full
					errMessage = "Buffer is full";
					break;
				case MACHINE_ERROR_CODES.BEGIN_MISSING:
					// no begin delimiter
					errMessage = "Command is missing begin delimiter '['";
					break;
				case MACHINE_ERROR_CODES.END_MISSING:
					// no end delimiter
					errMessage = "Command is missing end delimiter ']'";
					break;
				case MACHINE_ERROR_CODES.DATA_SIZE:
					// command is too small (less than 3 bytes)
					errMessage = "Command is incomplete";
					break;
				case MACHINE_ERROR_CODES.ERR_DELIM:
					// unknown delimiter/character
					errMessage = "Unknown character for delimiter";
					break;
				case MACHINE_ERROR_CODES.ERR_UNKNOWN_CMD:
					// invalid command
					errMessage = "Unknown command";
					break;
				case MACHINE_ERROR_CODES.ERR_PARAM_COUNT:
					// wrong number of parameters
					errMessage = "Command has wrong number of parameters";
					break;
				case MACHINE_ERROR_CODES.ERR_VALUE_SPEED:
					// speed value invalid or speed value pair inconsistent
					errMessage = "Speed value is invalid or inconsistent";
					break;
				case MACHINE_ERROR_CODES.ERR_BUSY:
					// machine is busy (spinning or resetting)
					errMessage = "Machine is busy - either spinning or resetting";
					break;
				case MACHINE_ERROR_CODES.ERR_NO_DEBUG:
					// firmware isn't debug-able
					errMessage = "Debug mode is disabled";
					break;
				case MACHINE_ERROR_CODES.UNDEFINED:
					errMessage = "Error code is undefined";
					errCallback(cmd, errMessage);
					break;
				default:
					errMessage = `Error code ${errorCode} is unknown`;
					errCallback(cmd, errMessage);
					break;
			}
			//Create console data
			that.addConsoleData( "Error: " + errMessage, ConsoleDataType.ERROR);
		}

		return handler;
	}

	createCommandInterpreterErrorCallback() {
		const that = this;
		const errCallback = (cmd, err) => {
			LOGGER.logE(`${err.toString()}: ${cmd}`);
		};
		return errCallback;
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
		if (this.refreshSerialPortsTimeout) {
			clearTimeout(this.refreshSerialPortsTimeout);
		}
	}

	listenForAvailableSerialPorts() {
		const that = this;
		this.refreshSerialPortsTimeout = setTimeout(() => {
			// Get the updated ports
			SerialPortHelper.listSerialPorts().then((result) => {
				that.handleUpdateAvailableSerialPorts(result.ports, result.err);
				that.listenForAvailableSerialPorts();
			});
		}, ScanPortsRefreshTimeInMs);
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
				const dataReceivedCallback = that.handleOnReceivedConsoleData;
				that.props.serialCommunication.startReceiving(that.handleOnReceivedConsoleData);
				// Prep connected console message
				consoleMessage = `Connected to '${portPath}' (Baud: ${baudRate}).`;
				messageDataType = ConsoleDataType.INFO;
			}
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
		this.props.serialCommunication.sendCommand(cmdText, onSentCallback);
	}

	handleOnReceivedConsoleData(data, timestamp) {
		// TODO use parser on serial data to figure out if it is a response, or error etc
		const dataString = data.toString();
		const parsedResult = parseLine(dataString);
		const cmds = parsedResult && parsedResult.words ? parsedResult.words : [];
		this.commandInterpreter.interpetCommandArray(cmds);
		// const newData = new ConsoleDataItem(dataString, timestamp, ConsoleDataType.RECEIVED);
		// this.setState(prevState => ({
		// 	consoleData: [...prevState.consoleData, newData]
		// }));
		// LOGGER.logD("Received data:", newData, " // new state: ", this.state.consoleData);
	}

	addConsoleData(data, dataType=ConsoleDataType.INFO, timestamp=Date.now()) {
		const dataString = data.toString();
		const newData = new ConsoleDataItem(dataString, timestamp, dataType);
		this.setState(prevState => ({
			consoleData: [...prevState.consoleData, newData]
		}));
	}

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
		const consoleData = this.state.consoleData;
		const renderedSerialPortsItems = this.getRenderedSerialPortItems();
		const renderedBaudRateItems = this.getRenderedBaudRateItems();
		const selectedPortName = this.state.serialPort;
		const serialCommIsConnected = (this.props.serialCommunication) ? this.props.serialCommunication.isConnected() : false;
		const serialCommIsDisconnected = !serialCommIsConnected;
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
							</Stack>
					</Box>

					<Divider sx={{marginTop: 4, marginBottom: 2}} />

					<Box variant="div">
						<Typography gutterBottom variant="h6" component="div">
                    		Setup
                		</Typography>         
						<SetupParamSubmitter
							disabled={isInputDisabled}
							onSubmitCallback={this.handleSendCommandClick} />
					</Box>

					<Divider sx={{marginTop: 4, marginBottom: 2}} />

					<Box variant="div">
						<Typography gutterBottom variant="h6" component="div">
                   			Spinning
                		</Typography>

						<TestingParamSubmitter
							disabled={isInputDisabled}
							onSubmitCallback={this.handleSendCommandClick} />
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
