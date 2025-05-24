import * as React from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import AutoModeIcon from '@mui/icons-material/AutoMode';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';

import ConstrainedNumberTextField from './constrained-number-text-field'

import MathUtil from '../lib/math-util'
import MiscUtil from '../lib/machine-control/misc-util'
import * as TimeUtil from "../lib/time";


import { GcodeBuilder } from '../lib/machine-control/gcode-builder';
import * as GCODE_CONSTANTS from '../lib/machine-control/gcode-constants'

import * as BF_CONSTANTS from '../lib/biofibers-machine/biofibers-machine-constants'

class SpinningParamSubmitter extends React.Component {
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
        this.getSpinningState = this.getSpinningState.bind(this);
        this.handleSubmitCommand = this.handleSubmitCommand.bind(this);
        this.handleOnChange = this.handleOnChange.bind(this);
        this.handleOnKeyUp = this.handleOnKeyUp.bind(this);
        this.handleStartSpinningClick = this.handleStartSpinningClick.bind(this);
        this.handleStopSpinningClick = this.handleStopSpinningClick.bind(this);
        this.handleSendMultipleCommands = this.handleSendMultipleCommands.bind(this);
    }  

    getSpinningState() {
        return {
            eValue: this.state.eValue,
            eFeedrate: this.state.eFeedrate,
            xValue: this.state.xValue,
        };
    }

    handleOnChange(event) {
        const {name, value} = event.target;
        this.setState({
            [name]: value
        });
    }

    handleOnKeyUp(event) {
        event.preventDefault();
        if (event.charCode == 13
            || event.keyCode == 13
            || event.key === 'Enter') {
            const {name, value} = event.target;

            // update spinning down process with new values, if they changed
            const machineState = this.props.machineState;
            if (machineState.isMachineSpinning()
                && (name == 'eValue' || name == 'eFeedrate' || name == 'xValue')
                && !isNaN(value) && parseFloat(value) >= 0) {
                let eValue = this.state.eValue;
                let eFeedrate = this.state.eFeedrate;
                let xValue = this.state.xValue;
                if (name == 'eValue') {
                    eValue = value;
                } else if (name == 'eFeedrate') {
                    eFeedrate = value;
                } else if (name == 'xValue') {
                    xValue = value;
                }
                if (this.props.onChangeSpinningState) {
                    this.props.onChangeSpinningState(true, this.getSpinningState());
                }
            }
        }
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

    handleStartSpinningClick(evt) {
        if (this.props.onChangeSpinningState) {
            this.props.onChangeSpinningState(true, this.getSpinningState());
        }
    }

     handleStopSpinningClick(evt) {
        if (this.props.onChangeSpinningState) {
            this.props.onChangeSpinningState(false);
        }
    }

    handleSendMultipleCommands(event) {
        if (this.props.onSendMultipleSpinningCommands) {
            const spinningCommand = this.getSpinningCommand();
            const numCommands = this.state.numCommands;
            const timePerCommandMs = MiscUtil.calculateCommandTimeInMilliSec(this.state.eValue, this.state.xValue, this.getCompositeFeedrate());
            this.props.onSendMultipleSpinningCommands(spinningCommand, numCommands, timePerCommandMs);
        }
    }

    getSpinningCommand() {
        let gcodeBuilder = new GcodeBuilder();
        gcodeBuilder.move({
            [GCODE_CONSTANTS.PARAM_E]: this.state.eValue,
            [GCODE_CONSTANTS.PARAM_X]: this.state.xValue,
            [GCODE_CONSTANTS.PARAM_F]: this.getCompositeFeedrate(),
            }, 
            'spin and move X'); 
        return gcodeBuilder.toGcodeString();
    }

    getCompositeFeedrate() {
        const eFeedrate = this.state.eFeedrate;
        const xFeedrate = this.calculateXFeedrate();
        const compositeFeedrate = MiscUtil.getCompositeFeedrate(xFeedrate, eFeedrate);
        return compositeFeedrate;
    }

    calculateXFeedrate() {
        const eValue = this.state.eValue;
        const eFeedrate = this.state.eFeedrate;
        const xValue = this.state.xValue;
        const xFeedrate = MiscUtil.calculateXFeedrate(eValue, eFeedrate, xValue);
       return xFeedrate;
    }

    render() {
        const preciseXFeedrate = MathUtil.toMinimumPrecision(
            this.calculateXFeedrate(), 
            GCODE_CONSTANTS.PARAM_F_FLOAT_PRECISION);            
        const preciseCompositeFeedRate = MathUtil.toMinimumPrecision(
            this.getCompositeFeedrate(), 
            GCODE_CONSTANTS.PARAM_F_FLOAT_PRECISION);

        const commandStyle = {
            background: "#f4f4f4",
            fontSize: '0.95rem',
            fontFamily: 'monospace',
            whiteSpace: 'pre',
            unicodeBidi: 'isolate',
            wordWrap: 'no-wrap'
        };

        const spinningCommandText = this.getSpinningCommand(); 
        const isMachineSpinning = this.props.machineState.isMachineSpinning();

        const timePerCommandTotalSec = MiscUtil.calculateCommandTimeInMilliSec(this.state.eValue, this.state.xValue, this.getCompositeFeedrate()) / 1000;
        const perCommandTimeMins = Math.floor(timePerCommandTotalSec / 60);
        const perCommandTimeSecs = Math.round(timePerCommandTotalSec % 60);
        const perCommandTimeText = TimeUtil.getMinSecText(perCommandTimeMins, perCommandTimeSecs);

        const totalTimeForAllCommandsSec = timePerCommandTotalSec * this.state.numCommands;
        const totalCommandTimeMins = Math.floor(totalTimeForAllCommandsSec / 60);
        const totalCommandTimeSecs = Math.round(totalTimeForAllCommandsSec % 60);
        const totalCommandTimeText = TimeUtil.getMinSecText(totalCommandTimeMins, totalCommandTimeSecs);
		const progressIndicator = () => {
			return (<CircularProgress color="warning" size={20}/>);
		};

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
                    <Box variant="div" sx={{display: 'flex'}}>
                    <ConstrainedNumberTextField
                            name="eValue"
                            label="Extrusion Amount [mm]"
                            type="number"
                            size="small"
                            color="primary"
                            margin="dense"
                            sx={{minWidth: 160, maxWidth: 160}}
                            value={this.state.eValue}
                            min={BF_CONSTANTS.EXTRUSION_AMOUNT_MIN}
                            max={BF_CONSTANTS.EXTRUSION_AMOUNT_MAX}
                            disabled={this.props.disabled}
                            onChange={this.handleOnChange}
                            onKeyUp={this.handleOnKeyUp}
                            />
                    </Box>
                    <Box variant="div" sx={{display: 'flex'}}>
                        <ConstrainedNumberTextField
                            name="eFeedrate"
                            label="Extrusion Feedrate [mm/min]"
                            type="number"
                            size="small"
                            color="primary"
                            margin="dense"
                            sx={{minWidth: 190, maxWidth: 190}}
                            min={BF_CONSTANTS.EXTRUSION_FEED_RATE_MIN}
                            max={BF_CONSTANTS.EXTRUSION_FEED_RATE_MAX}
                            value={this.state.eFeedrate}
                            disabled={this.props.disabled}
                            onChange={this.handleOnChange}
                            onKeyUp={this.handleOnKeyUp}
                            />  
                    </Box>
                    <Box variant="div" sx={{display: 'flex'}}>
                        <ConstrainedNumberTextField
                            name="xValue"
                            label="X-Axis Movement [mm]"
                            type="number"
                            size="small"
                            color="primary"
                            margin="dense"
                            sx={{minWidth: 160, maxWidth: 160}}
                            min={BF_CONSTANTS.X_AXIS_POSITION_MIN}
                            max={BF_CONSTANTS.X_AXIS_POSITION_MAX}
                            value={this.state.xValue}
                            disabled={this.props.disabled}
                            onChange={this.handleOnChange}
                            onKeyUp={this.handleOnKeyUp}
                            />   
                    </Box>
                    <Box variant="div" sx={{display: 'flex'}}>
                            <Button
                                variant="outlined"
                                size="medium"
                                disabled={this.props.disabled}
                                color={(isMachineSpinning) ? "error" : "success"}
                                startIcon={<AutoModeIcon />}
                                onClick={(isMachineSpinning)
                                    ? this.handleStopSpinningClick
                                    : this.handleStartSpinningClick} >
                                {(isMachineSpinning)
                                    ? 'Stop Spinning'
                                    : 'Start Spinning'}
                            </Button>
                    </Box>
                    <Stack variant="div"   justifyContent="center"
                    alignContent="center" sx={{display: 'flex'}}>
                        {(isMachineSpinning) ? progressIndicator() : ''}
                    </Stack>
                    
                </Stack>
                <Stack
                    direction="column"
                    justifyContent="left"
                    alignContent="left"
                    spacing={1}
                    padding={2}
                    >
                    <Typography gutterBottom variant="span" sx={{fontStyle: 'italic'}} component="div">
                        Calculated X-Axis Feed Rate [mm/min]: {preciseXFeedrate}
                    </Typography>
                    <Typography gutterBottom variant="span" sx={{fontStyle: 'italic'}} component="div">
                        Calculated Composite Feed Rate [mm/min]: {preciseCompositeFeedRate}
                    </Typography>
                    <Stack
                        direction="row"
                        alignItems="left"
                        alignContent="left"
                        spacing={1}
                        width="100%"
                        >
                            <Typography variant="div" gutterBottom sx={{wordWrap: 'no-wrap', fontStyle: 'italic', fontWeight: 500}}>
                                Generated Spinning Command: 
                            </Typography>
                            <Typography variant="span" sx={commandStyle}>
                                {spinningCommandText}
                            </Typography>                        
                    </Stack>
                      
                  
                </Stack>
               
                <Stack
                    direction="row"
                    justifyContent="left"
                    alignItems="left"
                    spacing={1}
                    p={1}>
                    <Box variant="div" sx={{display: 'flex'}}>
                        <ConstrainedNumberTextField
                            name="numCommands"
                            label="Number of Commands to Send"
                            type="number"
                            size="small"
                            color="primary"
                            min={0}
                            value={this.state.numCommands}
                            disabled={this.props.disabled}
                            onChange={this.handleOnChange}
                            sx={{minWidth: 220, maxWidth: 220}}
                            /> 

                        </Box>
                    <Box variant="div" sx={{display: 'flex'}}>
                        <Button
                            variant="outlined"
                            size="medium"
                            disabled={this.props.disabled}
                            color="success"
                            startIcon={<PlayCircleOutlineIcon/>}
                            onClick={this.handleSendMultipleCommands} > 
                            Send Commands
                        </Button>
                    </Box>
                </Stack>
                <Stack
                    direction="column"
                    justifyContent="left"
                    alignContent="left"
                    spacing={1}
                    padding={2}
                    paddingBottom={0}>
                        <Typography gutterBottom variant="span" sx={{fontStyle: 'italic'}} component="div">
                            Estimated Time Per Command: {perCommandTimeText}                    
                        </Typography>
                        <Typography variant="span" sx={{fontStyle: 'italic'}} component="div">
                            Estimated Total Time for <Typography variant="span" fontWeight={500}>{this.state.numCommands}</Typography> Commands: {totalCommandTimeText}
                        </Typography>
                    </Stack>
            </Box>
        );
    }
}

export default SpinningParamSubmitter;