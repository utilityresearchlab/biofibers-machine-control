import * as React from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { Stack, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

class SpinningParamSubmitter extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            length: 150,
            diameter: 0.3
        }
        this.handleOnSubmit = this.handleOnSubmit.bind(this);
        this.handleOnChange = this.handleOnChange.bind(this);
    }

    handleOnChange(event) {
        const {name, value} = event.target;
        this.setState({
            ...this.state,
            [name]: value
        });
    }

    handleOnSubmit(event) {
		// prevent page refresh on submit
		if (event) {
			event.preventDefault();
		}
	

		const onSubmitCallback = this.props.onSubmitCallback;
		// TODO: generate gcode based on param and send in call back 
		if (onSubmitCallback) {
			onSubmitCallback('');
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
                <p><b>Spinning</b></p>
                <Stack
                    direction="row"
                    justifyContent="center"
                    alignItems="center"
                    spacing={1}
                >
                    <p>Length [mm] </p>
                    <TextField
                        name="length"
						label="Length"
                        type="number"
						size="small"
						color="primary"
						margin="dense"
                        value={this.state.length}
						disabled={!this.props.isEnabled}
                        onChange={this.handleOnChange}
						/> 
                    <p>Diameter [mm] </p>
                    <TextField
                        name="diameter"
						label="Diameter"
                        type="number"
						size="small"
						color="primary"
						margin="dense"
                        value={this.state.diameter}
						disabled={!this.props.isEnabled}
                        onChange={this.handleOnChange}
						/>                 
                </Stack>
                <Button
						variant="outlined"
						size="medium"
						type='submit'
						disabled={!this.props.isEnabled}>
						Start spinning
				</Button>
            </Box>
        )
    }
}

export default SpinningParamSubmitter;