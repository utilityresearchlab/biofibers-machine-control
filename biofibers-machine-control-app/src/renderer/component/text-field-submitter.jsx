import * as React from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

class TextFieldSubmitter extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			inputText: ''
		};
		this.handleOnKeyUp = this.handleOnKeyUp.bind(this);
		this.handleOnTextChange = this.handleOnTextChange.bind(this);
		this.handleOnSubmit = this.handleOnSubmit.bind(this);
	}

	handleOnTextChange(event) {
		this.setState({inputText: event.target.value});
	}

	// Trigger submit if we press enter in the textbox
	handleOnKeyUp(event) {
		event.preventDefault();
		if (event.charCode == 13
			|| event.keyCode == 13
			|| event.key === 'Enter') {
			// Enter pressed so trigger submit
			this.handleOnSubmit(event);
		}
	}

	handleOnSubmit(event) {
		// prevent page refresh on submit
		if (event) {
			event.preventDefault();
		}
		const inputText = this.state.inputText;
		if (inputText.length == 0 || inputText.trim().length == 0) {
			return;
		}

		const onSubmitCallback = this.props.onSubmitCallback;
		// get text input and send in call back
		if (onSubmitCallback) {
			onSubmitCallback(inputText);
		}

		// Clear the input text after submission
		this.setState({
			inputText: ''
		});
	}

	render() {
		const inputText = this.state.inputText;
		const buttonStyle = {
		};
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
				<Stack
					direction="row"
					justifyContent="left"
					alignItems="left"
					spacing={1}
				>	
					<Box variant="div" sx={{minWidth: 300}}>
					<TextField
						label={this.props.fieldLabel}
						size="small"
						color="primary"
						margin="dense"
						value={this.state.inputText}
						onKeyUp={this.handleOnKeyUp}
						onChange={this.handleOnTextChange}
						disabled={!this.props.isEnabled}
						/>
					</Box>
					<Button
						variant="outlined"
						size="medium"
						endIcon={this.props.buttonIcon}
						type='submit'
						disabled={!this.props.isEnabled}>
						{this.props.buttonLabel}
					</Button>
				</Stack>
			</Box>
		);
	}

}

export default TextFieldSubmitter;
