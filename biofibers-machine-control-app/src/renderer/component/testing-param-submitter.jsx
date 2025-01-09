import * as React from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';

import ConstrainedNumberTextField from './constrained-number-text-field'

import MathUtil from '../lib/math-util'

import { GcodeBuilder } from '../lib/machine-control/gcode-builder';
import * as GCODE_CONSTANTS from '../lib/machine-control/gcode-constants'

import * as BF_CONSTANTS from '../lib/biofibers-machine-constants'

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
            [name]: value
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
            gcodeBuilder.move({
                    [GCODE_CONSTANTS.PARAM_E]: this.state.eValue,
                    [GCODE_CONSTANTS.PARAM_X]: this.state.xValue,
                    [GCODE_CONSTANTS.PARAM_F]: this.getCompositeFeedrate(),
                }, 
                'extrude and move X'); 
            this.handleSubmitCommand(event, gcodeBuilder.toGcodeString());
        }, 1000);
        this.setState({
            ...this.state,
            nIntervalId: intervalId,
            spinningInProgress: true
        });
    }

     handleStopSpinningClick(event) {
        let intervalId = this.state.nIntervalId;
        this.setState({
            ...this.state,
            spinningInProgress: false,
            nIntervalId: null
        });
        clearInterval(intervalId);
        let gcodeBuilder = new GcodeBuilder();
        gcodeBuilder.setSpindleSpeed(0, true);
        this.handleSubmitCommand(event, gcodeBuilder.toGcodeString());
    }

    handleSendMultipleCommands(event) {
        let gcodeBuilder = new GcodeBuilder();
        for (let i = 0; i < this.state.numCommands; i ++) {
            gcodeBuilder.reset();
            gcodeBuilder.move({
                [GCODE_CONSTANTS.PARAM_E]: this.state.eValue,
                [GCODE_CONSTANTS.PARAM_X]: this.state.xValue,
                [GCODE_CONSTANTS.PARAM_F]: this.getCompositeFeedrate(),
                }, 
                'extrude and move X'); 
            this.handleSubmitCommand(event, gcodeBuilder.toGcodeString());
        }
    }

    getCompositeFeedrate() {
        return Math.sqrt( 
            Math.pow(this.state.eFeedrate, 2) + Math.pow(this.calculateXFeedrate(), 2));
    }

    calculateXFeedrate() {
        // If no extrusion simply use the default X feed rate
        if (this.state.eValue == 0) {
            return BF_CONSTANTS.X_AXIS_DEFAULT_FEED_RATE;
        }
        // If no e-feed rate, use default X feedrate
        if (this.state.eFeedrate == 0) {
            return BF_CONSTANTS.X_AXIS_DEFAULT_FEED_RATE;
        }
        return this.state.xValue * (this.state.eFeedrate / this.state.eValue);
    }

    render() {
        const preciseXFeedrate = MathUtil.toMinimumPrecision(
            this.calculateXFeedrate(), 
            GCODE_CONSTANTS.PARAM_F_FLOAT_PRECISION);
            
        const preciseCompositeFeedRate = MathUtil.toMinimumPrecision(
            this.getCompositeFeedrate(), 
            GCODE_CONSTANTS.PARAM_F_FLOAT_PRECISION);
        return (
            <Box
            component="form"
            noValidate
            autoComplete="off">   
                <Stack
                    direction="row"
                    justifyContent="left"
                    alignItems="left"
                    spacing={1}
                    padding={1}
                >
                    <Box variant="div">
                        <ConstrainedNumberTextField
                            name="eValue"
                            label="Extrusion Amount [mm]"
                            type="number"
                            size="small"
                            color="primary"
                            margin="dense"
                            sx={{minWidth: 170, maxWidth: 170}}
                            value={this.state.eValue}
                            min={BF_CONSTANTS.EXTRUSION_AMOUNT_MIN}
                            max={BF_CONSTANTS.EXTRUSION_AMOUNT_MAX}
                            disabled={!this.props.isEnabled}
                            onChange={this.handleOnChange}
                            />
                    </Box>
                    <Box variant="div">
                    <ConstrainedNumberTextField
                        name="eFeedrate"
                        label="Extrusion Feedrate [mm/min]"
                        type="number"
                        size="small"
                        color="primary"
                        margin="dense"
                        sx={{minWidth: 200, maxWidth: 200}}
                        min={BF_CONSTANTS.EXTRUSION_FEED_RATE_MIN}
                        value={this.state.eFeedrate}
                        disabled={!this.props.isEnabled}
                        onChange={this.handleOnChange}
                        />  
                    </Box>
                    <Box variant="div">
                        <ConstrainedNumberTextField
                            name="xValue"
                            label="X-Axis Movement [mm]"
                            type="number"
                            size="small"
                            color="primary"
                            margin="dense"
                            sx={{minWidth: 170, maxWidth: 170}}
                            value={this.state.xValue}
                            disabled={!this.props.isEnabled}
                            onChange={this.handleOnChange}
                            />   
                    </Box>
                </Stack>
                <Stack
                    direction="column"
                    justifyContent="left"
                    alignContent="left"
                    spacing={1}
                    padding={2}
                    >
                    <Typography gutterBottom variant="body1" component="div">
                        Calculated X-Axis Feed Rate [mm/min]: {preciseXFeedrate}
                    </Typography>
                    <Typography gutterBottom variant="body1" component="div">
                        Calculated Composite Feed Rate [mm/min]: {preciseCompositeFeedRate}
                    </Typography>
                </Stack>
                <Stack
                        direction="row"
                        alignItems="left"
                        alignContent="left"
                        justifySelf={true}
                        spacing={1}
                    >
                    <ConstrainedNumberTextField
                            name="numCommands"
                            label="Number of Commands to Send"
                            type="number"
                            size="small"
                            color="primary"
                            value={this.state.numCommands}
                            disabled={!this.props.isEnabled}
                            onChange={this.handleOnChange}
                            sx={{maxWidth: '30%'}}
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
                        startIcon={<PlayCircleOutlineIcon/>}
                        onClick={this.handleSendMultipleCommands} > 
                        Send Commands
                    </Button>
                </Stack>
            </Box>
        );
    }
}

export default TestingParamSubmitter;