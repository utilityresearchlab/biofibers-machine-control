import * as React from 'react';

import { Box, Button, Divider, List, ListItem, ListItemText, Stack, TextField, Typography }  from '@mui/material';

import { GcodeBuilder } from '../lib/machine-control/gcode-builder';
import MiscUtil from '../lib/machine-control/misc-util';

class GcodeUploader extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            commandBuilder: new GcodeBuilder(), 
            dataInput: '',
        };
        this.handleSubmitCommand = this.handleSubmitCommand.bind(this);
        this.handleSendMultiLineCommands = this.handleSendMultiLineCommands.bind(this);
        this.handleOnTextChange = this.handleOnTextChange.bind(this);
        this.handleOnKeyUp = this.handleOnKeyUp.bind(this);
    }

    handleSubmitCommand(event, command) {
        // prevent page refresh on submit
		if (event) {
			event.preventDefault();
		}

        const onSubmitCallback = this.props.onSubmitCallback;
        if (onSubmitCallback) {
            return onSubmitCallback(command); 
        }
    }

    handleOnTextChange(event) {
		this.setState({dataInput: event.target.value});
	}

    validateDataInput() {
        return /[^01]/.test(this.state.dataInput);
    }

    handleOnKeyUp(event) {
        if (event) {
			event.preventDefault();
		}
        this.convertBinaryInputToGcode();
    }

    convertBinaryInputToGcode() {
        let gcodeSampleBuilder = new GcodeBuilder();
        const e = 0.005;
        const x = 2;
        const eFeedrate = 1.6;
        const xFeedrate = eFeedrate * (x / e);

        for (let i = 0; i < this.state.dataInput.length; i ++) {
            const char = this.state.dataInput[i];
            if (char == '0') {
                gcodeSampleBuilder
                    .setSpindleSpeed(100, true)
                    .extrudeWhileMoveXAtFeedrates(e, x, eFeedrate, xFeedrate);
            } else if (char == '1') { 
                gcodeSampleBuilder
                    .setSpindleSpeed(0, true)
                    .extrudeWhileMoveXAtFeedrates(e, x, eFeedrate, xFeedrate);
            }
        }

        this.setState({
            commandBuilder: gcodeSampleBuilder
        });
    }
 

    handleSendMultiLineCommands(event) {
        for (let i = 0; i < this.state.commandBuilder.commands.length; i ++) {
            const cmdGcodeString = this.state.commandBuilder.toGcode()[i];
            let waitTime;
            if (i == 0) {
                waitTime = 0;
            } else {
                const prevCmd = this.state.commandBuilder.commands[i-1];
                const prevCode = prevCmd['code'];
                waitTime = (prevCode == 'G1') ? 
                    Math.max(MiscUtil.calculateCommandTimeInMilliSec(prevCmd.params.E || 0, prevCmd.params.X || 0, prevCmd.params.F || 1), 0)
                    : 0; 
                console.log("wait time " + waitTime);
            }
            const that = this;
            setTimeout(() => {
                that.handleSubmitCommand(event, cmdGcodeString);
                console.log("Sent command from gcode uploader: " + cmdGcodeString);
            }, waitTime);
        }
    }

    render() {
        const listItems = this.state.commandBuilder.toGcode().map((item, index) => {
			return (
				<React.Fragment key={index+'-f'}>
                    <ListItem
                        alignItems="flex-start"
                        key={index}
                        sx={{paddingTop: '0', paddingBottom: '0'}}>
                        <ListItemText
                            key={index + "-1"}
                            disableTypography
                            primary={
                                <Typography
                                    style={{fontFamily: 'monospace', fontSize: '0.9rem'}}
                                >
                                    { item }
                                </Typography>}
                        />
			        </ListItem>
					<Divider component="li" key={index + "-div"}/>
				</React.Fragment>);
	    });
        return (
            <Box
            component="form"
            sx={{
                '& .MuiTextField-root': {m: 0, width: '100%' },
            }}
            noValidate
            autoComplete="off"
            onSubmit={e => { e.preventDefault();}}
            >
                <p><b>Data Encoding</b></p>
                <Stack>
                    <TextField
                            label="binary input"
                            name="input"
                            size="small"
                            color="primary"
                            margin="normal"
                            fullWidth
                            value={this.state.dataInput}
                            onKeyUp={this.handleOnKeyUp}
                            disabled={!this.props.isEnabled}
                            error={this.validateDataInput()}
                            onChange={this.handleOnTextChange}
                            /> 
                    <List
					sx={{
						width: "100%",
						maxWidth: 560,
						bgcolor: "background.paper",
						border: "1px solid gray",
						overflow: "auto",
						fontFamily: 'monotype',
						fontSize: '0.9rem',
					}}>
					{listItems}
					<div></div>
				</List>
                </Stack>
                <Button
                        variant="outlined"
                        size="medium"
                        disabled={!this.props.isEnabled}
                        color="success"
                        onClick={this.handleSendMultiLineCommands} > 
                        Send Commands
                    </Button>
            </Box>
          
        )
    }
}

export default GcodeUploader;