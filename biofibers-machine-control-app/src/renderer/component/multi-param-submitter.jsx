import * as React from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { Stack, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import RotateRightIcon from '@mui/icons-material/RotateRight';

class MultiParamSubmitter extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            nozzleTemperature: 60,
            wrapperTemperature: 60,
            collectorSpeed: 60,
            collectorDirection: "clockwise"
        }
        this.handleOnSubmit = this.handleOnSubmit.bind(this);
        this.handleOnChange = this.handleOnChange.bind(this);
        this.handleOnDirectionChange = this.handleOnDirectionChange.bind(this);
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

    handleOnSubmit(event) {
		// prevent page refresh on submit
		if (event) {
			event.preventDefault();
		}
		const nozzleTemperature = this.state.nozzleTemperature;
        const wrapperTemperature = this.state.wrapperTemperature;
        const rollerSpeed = this.state.rollerSpeed;
	

		const onSubmitCallback = this.props.onSubmitCallback;
		// get param and send in call back
		if (onSubmitCallback) {
			onSubmitCallback(nozzleTemperature, wrapperTemperature, rollerSpeed);
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
                <p>Setup </p>
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
						Start purging
				</Button>
            </Box>
        )
    }
}

export default MultiParamSubmitter;