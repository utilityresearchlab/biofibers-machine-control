import * as React from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { Stack, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import { getHomeAllCommand } from './../lib/machine-control/command-builder';

class SetupParamSubmitter extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            nozzleTemperature: 60,
            wrapperTemperature: 60,
            collectorSpeed: 60,
            collectorDirection: 'clockwise'
        }
        this.handleSubmitCommand = this.handleSubmitCommand.bind(this);
        this.handleHomeAllClick = this.handleHomeAllClick.bind(this);
        this.handleOnSubmit = this.handleOnSubmit.bind(this);
        this.handleOnChange = this.handleOnChange.bind(this);
        this.handleOnDirectionChange = this.handleOnDirectionChange.bind(this);
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
		const command = getHomeAllCommand();
		this.handleSubmitCommand(event, command);
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

    // TODO: replace hardcoded gcode 
    handleOnSubmit(event) {
        const command = 'G91\nM83\nG92 E0\n'
		this.handleSubmitCommand(event, command);
	}

    // Trigger submit if we press enter in the textbox
    // TODO: replace hardcoded gcode 
    // TODO: see if we could call onkeyup without triggering onsubmit
	handleOnKeyUp(event) {
		event.preventDefault();
        var command;
		if (event.charCode == 13
			|| event.keyCode == 13
			|| event.key === 'Enter') {
			// Enter pressed so trigger submit
			const {name, value} = event.target;
            if (name == 'nozzleTemperature'){
                command = 'M109 S' + this.state.nozzleTemperature.toString() + '\n';
            } 
            // else if (name == 'wrapperTemperature') {
                // command = 'M109 ' + this.state.wrapperTemperature.toString() + '\n';
            // } 
            else if (name == 'collectorSpeed') {
                if (this.state.collectorDirection == 'clockwise') {
                    command = 'M3 S' + this.state.collectorSpeed.toString() + '\n';
                } else {
                    command = 'M4 S' + this.state.collectorSpeed.toString() + '\n';
                }
            } else {
                command = ''
            }
            this.handleSubmitCommand(event, command)
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
            onSubmit={this.handleOnSubmit}
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
						type='submit'
						disabled={!this.props.isEnabled}>
						Start pull-down
				</Button>
            </Box>
        )
    }
}

export default SetupParamSubmitter;