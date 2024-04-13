import * as React from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { Stack, TextField } from '@mui/material';

import { GcodeBuilder } from '../lib/machine-control/gcode-builder';

class TestingParamSubmitter extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            eValue:0.1, 
            eFeedrate: 0.2,
            xValue:4, 
            spinningInProgress: false, 
            numCommands: 5,
            nIntervalId: null
        };
        this.handleSubmitCommand = this.handleSubmitCommand.bind(this);
        this.handleOnChange = this.handleOnChange.bind(this);
        this.handleStartSpinningClick = this.handleStartSpinningClick.bind(this);
        this.handleStopSpinningClick = this.handleStopSpinningClick.bind(this);
        this.handleSendMultipleCommands = this.handleSendMultipleCommands.bind(this);
    }

    handleOnChange(event) {
        const {name, value} = event.target;
        console.log(name);
        this.setState({
            ...this.state,
            [name]: Number(value)
        });
    }

    handleSubmitCommand(event, command) {
        // prevent page refresh on submit
		if (event) {
			event.preventDefault();
		}

        const onSubmitCallback = this.props.onSubmitCallback;
		// get param and send in call back
		if (onSubmitCallback) {
			onSubmitCallback(command);
		}
    }

    handleStartSpinningClick(event) {
        // keep sending command to extrude until spinning is stopped
        // TODO: Determine proper interval timing instead of hard-coding 1000 ms
        let intervalId = setInterval(() => {
            let gcodeBuilder = new GcodeBuilder();
            gcodeBuilder
                .extrudeWhileMoveX(
                    this.state.eValue, 
                    this.state.xValue,
                    this.getCompositeFeedrate(),
                    'extrude and move X'); 
            this.handleSubmitCommand(event, gcodeBuilder.toGcodeString());
        }, 1000);
        this.setState({
            nIntervalId: intervalId,
            spinningInProgress: true
        });
    }

     handleStopSpinningClick(event) {
        let intervalId = this.state.nIntervalId;
        this.setState({
            spinningInProgress: false,
            nIntervalId: null
        });
        clearInterval(intervalId);
        let gcodeBuilder = new GcodeBuilder();
        gcodeBuilder.setSpindleSpeed(0, true);
        this.handleSubmitCommand(event, gcodeBuilder.toGcodeString());
    }

    handleSendMultipleCommands(event) {
        for (let i = 0; i < this.state.numCommands; i ++) {
            let gcodeBuilder = new GcodeBuilder();
            gcodeBuilder
                .extrudeWhileMoveX(
                    this.state.eValue, 
                    this.state.xValue,
                    this.getCompositeFeedrate(),
                    'extrude and move X'); 
            this.handleSubmitCommand(event, gcodeBuilder.toGcodeString());
        }
    }

    getCompositeFeedrate() {
        return Math.sqrt(
            Math.pow(this.state.eFeedrate, 2)+Math.pow(this.calculateXFeedrate(), 2));
    }

    calculateXFeedrate() {
        return this.state.eFeedrate * (this.state.xValue / this.state.eValue);
    }

    render() {
        return (
            <Box
            component="form"
            sx={{
                '& .MuiTextField-root': {m: 0, width: '100%' },
            }}
            noValidate
            autoComplete="off"
            > 
                <p><b>Testing</b></p>
                <Stack
                    direction="row"
                    justifyContent="center"
                    alignItems="center"
                    spacing={1}
                >
                    <p>Extrusion Amount [mm]</p>  
                    <TextField
                        name="eValue"
						label="extrusion amount"
                        type="number"
						size="small"
						color="primary"
						margin="dense"
                        value={this.state.eValue}
						disabled={!this.props.isEnabled}
                        onChange={this.handleOnChange}
						/> 
                    <p>Extrusion Feed Rate [mm/min]</p>
                    <TextField
                        name="eFeedrate"
						label="extrusion feedrate"
                        type="number"
						size="small"
						color="primary"
						margin="dense"
                        value={this.state.eFeedrate}
						disabled={!this.props.isEnabled}
                        onChange={this.handleOnChange}
						/>  
                </Stack>
                <Stack
                    direction="row"
                    justifyContent="center"
                    alignItems="center"
                    spacing={1}
                >
                    <p>X Axis Movement [mm]</p>
                    <TextField
                        name="xValue"
						label="x axis movement"
                        type="number"
						size="small"
						color="primary"
						margin="dense"
                        value={this.state.xValue}
						disabled={!this.props.isEnabled}
                        onChange={this.handleOnChange}
						/>   
                    <p>X Axis Feed Rate [mm/min]: {this.calculateXFeedrate()} </p>
                </Stack>
                <Stack
                    direction="row"
                    justifyContent="right"
                    alignItems="centxer"
                    spacing={1}
                ><p>Composite Feed Rate [mm/min]: {this.getCompositeFeedrate().toFixed(4)} </p></Stack>
                <TextField
                        name="numCommands"
						label="number of commands to send"
                        type="number"
						size="small"
						color="primary"
                        value={this.state.numCommands}
						disabled={!this.props.isEnabled}
                        onChange={this.handleOnChange}
						/> 
                {/* <Button
                    variant="outlined"
                    size="medium"
                    disabled={!this.props.isEnabled}
                    color={(this.state.spinningInProgress) ? "error" : "success"}
                    onClick={(this.state.spinningInProgress)
                        ? this.handleStopSpinningClick
                        : this.handleStartSpinningClick} > 
                    {this.state.spinningInProgress
                        ? 'Stop spinning'
                        : 'Start spinning'}
                </Button> */}
                <Button
                    variant="outlined"
                    size="medium"
                    disabled={!this.props.isEnabled}
                    color="success"
                    onClick={this.handleSendMultipleCommands} > 
                    Send Commands
                </Button>
            </Box>
        );
    }
}

export default TestingParamSubmitter;