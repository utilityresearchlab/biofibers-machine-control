import * as React from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { Stack, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import { CMD_HOME_AXES } from './../lib/machine-control/gcode_constants';
import { GcodeBuilder } from '../lib/machine-control/gcode_builder';

class SetupParamSubmitter extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            nozzleTemperature: 60,
            wrapperTemperature: 60,
            collectorSpeed: 60,
            collectorDirection: 'clockwise', 
            pullDownInProgress: false,
            nIntervalId: null,
        }
        this.handleSubmitCommand = this.handleSubmitCommand.bind(this);
        this.handleHomeAllClick = this.handleHomeAllClick.bind(this);
        this.handleOnChange = this.handleOnChange.bind(this);
        this.handleOnDirectionChange = this.handleOnDirectionChange.bind(this);
        this.handleStartPullDownClick = this.handleStartPullDownClick.bind(this);
        this.handleStopPullDownClick = this.handleStopPullDownClick.bind(this);
        this.handleOnKeyUp = this.handleOnKeyUp.bind(this);
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

    handleHomeAllClick(event) {
        var gcodeBuilder = new GcodeBuilder();
        gcodeBuilder.homeAll();
		this.handleSubmitCommand(event, gcodeBuilder.toGcodeString());
	}

    handleStartPullDownClick(event) {
        var gcodeBuilder = new GcodeBuilder();
        gcodeBuilder
            .userRelativeCoordinates()
            .useRelativeExtrusionDistances()
            .resetExtrusionDistance();

        this.handleSubmitCommand(event, gcodeBuilder.toGcodeString());

        // keep sending command to extrude until pull-down is stopped
        // todo: check buffer
        var intervalId = setInterval(() => {
            var pullDownGcodeBuilder = new GcodeBuilder();
            pullDownGcodeBuilder
                .extrudeWhileMoveX(0.1, 4, 0.141, 'extrude and move X'); // value from experiments
            this.handleSubmitCommand(event, pullDownGcodeBuilder.toGcodeString())
        }, 1000)
        this.setState({
            nIntervalId: intervalId,
            pullDownInProgress: true
        })
    }

    handleStopPullDownClick(event) {
        this.setState({
            pullDownInProgress: false
        })
        clearInterval(this.state.nIntervalId)
    }

    submitPullDownCommand() {
        
    }

    handleOnChange(event) {
        const {name, value} = event.target;
        this.setState({
            ...this.state,
            [name]: value
        });
    }

    handleOnDirectionChange( event, newDirection ) {
        this.setState({
            collectorDirection: newDirection
        });
    }

    // Trigger submmit command if we press enter in the textbox
	handleOnKeyUp(event) {
        console.log("key up");
		event.preventDefault();
        var gcodeBuilder = new GcodeBuilder();
		if (event.charCode == 13
			|| event.keyCode == 13
			|| event.key === 'Enter') {
			// Enter pressed so trigger submit
			const {name, value} = event.target;
            if (name == 'nozzleTemperature'){
                gcodeBuilder.setTemperature(this.state.nozzleTemperature);
            } 
            // TODO: look up gcode for set wrapper temperature
            // else if (name == 'wrapperTemperature') {
                // command = 'M109 ' + this.state.wrapperTemperature.toString() + '\n';
            // } 
            else if (name == 'collectorSpeed') {
                if (this.state.collectorDirection == 'clockwise') {
                    gcodeBuilder.setSpindleSpeed(this.state.collectorSpeed, true)
                } else {
                    gcodeBuilder.setSpindleSpeed(this.state.collectorSpeed, false)
                }
            } 
            this.handleSubmitCommand(event, gcodeBuilder.toGcodeString())
		}
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
                <p><b>Setup</b></p>
                <Button
                    size="medium"
                    variant="outlined"
                    onClick={this.handleHomeAllClick} > 
                    Home All
                </Button>
                <Stack
                    direction="row"
                    justifyContent="center"
                    alignItems="center"
                    spacing={1}
                >
                    <p>Extruder: </p>
                    <TextField
						label="Temperature"
                        name="nozzleTemperature"
                        type="number"
						size="small"
						color="primary"
						margin="dense"
						value={this.state.nozzleTemperature}
						disabled={!this.props.isEnabled}
                        onChange={this.handleOnChange}
                        onKeyUp={this.handleOnKeyUp}
						/> 
                    <p>Wrapper: </p>
                    <TextField
						label="Temperature"
                        name="wrapperTemperature"
                        type="number"
						size="small"
						color="primary"
						margin="dense"
						value={this.state.wrapperTemperature}
						disabled={!this.props.isEnabled}
                        onChange={this.handleOnChange}
                        onKeyUp={this.handleOnKeyUp}
						/>                 
                </Stack>
                <Stack
                    direction="row"
                    justifyContent="center"
                    alignItems="center"
                    spacing={1}>
                    <p>Collector: </p>
                    <TextField
                        name="collectorSpeed"
						label="Speed"
						size="small"
                        type="number"
						color="primary"
						margin="dense"
						value={this.state.collectorSpeed}
						disabled={!this.props.isEnabled}
                        onChange={this.handleOnChange}
                        onKeyUp={this.handleOnKeyUp}
						/>  
                    <ToggleButtonGroup
                        name="collectorDirection"
                        label="Direction"
                        value={this.state.collectorDirection}
                        color="primary"
                        onChange={this.handleOnDirectionChange}
                        exclusive>
                        <ToggleButton value="clockwise">
                            <RotateRightIcon />
                        </ToggleButton>
                        <ToggleButton value="counterclockwise">
                            <RotateLeftIcon />
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Stack>
                <Button
                    variant="outlined"
                    size="medium"
                    disabled={!this.props.isEnabled}
                    color={(this.state.pullDownInProgress) ? "error" : "success"}
                    onClick={(this.state.pullDownInProgress)
                        ? this.handleStopPullDownClick
                        : this.handleStartPullDownClick} > 
                    {this.state.pullDownInProgress
                        ? 'Stop pull-down'
                        : 'Start pull-down'}
                </Button>
                
                
            </Box>
        )
    }
}

export default SetupParamSubmitter;