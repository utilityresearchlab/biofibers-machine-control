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
        return (
            <Box
                component="form"
                sx={{'& .MuiTextField-root': {m: 0, width: '100%' }}}
                noValidate
                autoComplete="off"
                onSubmit={e => { e.preventDefault();}}>
                <Button
                    variant="outlined"
                    size="medium"
                    disabled={!this.props.isEnabled}
                    color="success"
                    onClick={this.handleSendMultiLineCommands} > 
                    Send Commands
                </Button>
            </Box>
        );
    }
}

export default GcodeUploader;