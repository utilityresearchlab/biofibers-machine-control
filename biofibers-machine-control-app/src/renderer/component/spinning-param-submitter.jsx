import * as React from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { Stack, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

class SpinningParamSubmitter extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        }
        this.handleOnSubmit = this.handleOnSubmit.bind(this);
    }

    handleOnSubmit(event) {
		// prevent page refresh on submit
		if (event) {
			event.preventDefault();
		}
	

		const onSubmitCallback = this.props.onSubmitCallback;
		// get param and send in call back
		if (onSubmitCallback) {
			onSubmitCallback();
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
                <p>Spinning</p>
                <Stack
                    direction="row"
                    justifyContent="center"
                    alignItems="center"
                    spacing={1}
                >
                    <p>Length [mm] </p>
                    <TextField
						label="Length"
						size="small"
						color="primary"
						margin="dense"
						disabled={!this.props.isEnabled}
						/> 
                    <p>Thickness [mm] </p>
                    <TextField
						label="Thickness"
						size="small"
						color="primary"
						margin="dense"
						disabled={!this.props.isEnabled}
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