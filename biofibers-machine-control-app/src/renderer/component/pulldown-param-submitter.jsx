import * as React from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import MaterialHelper from '../lib/material-util/material-helper';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import SwipeDownAltIcon from '@mui/icons-material/SwipeDownAlt';

import ConstrainedNumberTextField from './constrained-number-text-field'

import MathUtil from '../lib/math-util'
import MiscUtil from '../lib/machine-control/misc-util'
import TimeUtil from '../lib/time'

import { GcodeBuilder } from '../lib/machine-control/gcode-builder';
import * as GCODE_CONSTANTS from '../lib/machine-control/gcode-constants'

import * as BF_CONSTANTS from '../lib/biofibers-machine/biofibers-machine-constants'
import { FEATURE_FLAGS } from '../app-settings';

class PullDownParamSubmitter extends React.Component {
    constructor(props) {
        super(props);
        
        const defaultMaterial = MaterialHelper.availableMaterials()[0];
        const defaultParams = MaterialHelper.defaultParams();

        this.state = {
            eValue: defaultParams[GCODE_CONSTANTS.PARAM_E], 
            eFeedrate: defaultParams[GCODE_CONSTANTS.PARAM_F],
            xValue: 0,
            numCommands: 5,
            selectedMaterial: defaultMaterial
        };
        
        this.handleSubmitCommand = this.handleSubmitCommand.bind(this);
        this.handleOnChange = this.handleOnChange.bind(this);
        this.handleOnSelectMaterial = this.handleOnSelectMaterial.bind(this);
        this.handleStartPullDownClick = this.handleStartPullDownClick.bind(this);
        this.handleStopPullDownClick = this.handleStopPullDownClick.bind(this);
    }

    handleOnChange(event) {
        const {name, value} = event.target;
        this.setState({
            [name]: value
        });

        // update pulling down process with new values, if they changed
        const machineState = this.props.machineState;
        const isPullingDown = machineState.isMachinePullingDown();
        if (isPullingDown 
            && (name == 'eValue' || name == 'eFeedrate')
            && !isNaN(value) && parseFloat(value) >= 0) {
            let eValue = this.state.eValue;
            let eFeedrate = this.state.eFeedrate;
            if (name == 'eValue') {
                eValue = value;
            } else if (name == 'eFeedrate') {
                eFeedrate = value;
            }
            if (this.props.onChangePullDownState) {
                this.props.onChangePullDownState(true, eValue, eFeedrate);
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
    // added from setup
    handleStartPullDownClick(evt) {
        if (this.props.onChangePullDownState) {
            this.props.onChangePullDownState(true, this.state.eValue, this.state.eFeedrate);
        }
    }

    handleStopPullDownClick(evt) {
        if (this.props.onChangePullDownState) {
            this.props.onChangePullDownState(false);
        }
    }

    handleOnSelectMaterial(event) {
        const materialName = String(event.target.value);
        const availableMaterials = MaterialHelper.availableMaterials();
        let eValue = this.state.eValue;
        let eFeedrate = this.state.eFeedrate;
        const prevMaterial = this.state.selectedMaterial;
        let selectedMaterial = prevMaterial;
        for (let i = 0; i < availableMaterials.length; i += 1) {
            const material = availableMaterials[i];
            if (materialName == material.name) {
                eValue = material[GCODE_CONSTANTS.PARAM_E];
                eFeedrate = material[GCODE_CONSTANTS.PARAM_F];
                selectedMaterial = material;
                break;
            }
        }        
        
        if (selectedMaterial != prevMaterial) {
            if (this.props.onChangePullDownState && this.props.machineState.isMachinePullingDown()) {
                this.props.onChangePullDownState(true, eValue, eFeedrate);
            }
        }
        this.setState({             
            eValue: eValue,
            eFeedrate: eFeedrate,
            selectedMaterial: selectedMaterial 
        });
    }

    getPullDownCommand() {
        let gcodeBuilder = new GcodeBuilder();
        gcodeBuilder.move({
            [GCODE_CONSTANTS.PARAM_E]: this.state.eValue,
            [GCODE_CONSTANTS.PARAM_F]: this.getCompositeFeedrate(),
            }, 
            'pull down'); 
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

    getRenderedMaterialItems() {
            const availableMaterials = MaterialHelper.availableMaterials();
            let renderedMaterialItems = availableMaterials.map((item, index) => {
                const value = item.name.toString();
                return (
                    <MenuItem
                        key={"item-material-" + value}
                        value={value}>{value}</MenuItem>
                )
            });
            return renderedMaterialItems;
        }

    render() {
        const renderedMaterialItems = this.getRenderedMaterialItems();
        const machineState = this.props.machineState;
        const isMachinePullingDown = machineState.isMachinePullingDown();
        const compositeFeedrate = this.getCompositeFeedrate();

        const preciseCompositeFeedRate = MathUtil.toMinimumPrecision(
            compositeFeedrate, 
            GCODE_CONSTANTS.PARAM_F_FLOAT_PRECISION);

        const commandStyle = {
            background: "#f4f4f4",
            fontSize: '0.95rem',
            fontFamily: 'monospace',
            whiteSpace: 'pre',
            unicodeBidi: 'isolate',
            wordWrap: 'no-wrap'
        };

        const spinningCommandText = this.getPullDownCommand(); 

        const timePerCommandTotalSec = MiscUtil.calculateCommandTimeInMilliSec(this.state.eValue, this.state.xValue, compositeFeedrate) / 1000;
        const perCommandTimeMins = Math.floor(timePerCommandTotalSec / 60);
        const perCommandTimeSecs = Math.round(timePerCommandTotalSec % 60);
        const perCommandTimeText = TimeUtil.getMinSecText(perCommandTimeMins, perCommandTimeSecs);
        
        const materialSelectComponent = () => {
            return (!FEATURE_FLAGS.SHOW_MATERIAL_SELECT_PULL_DOWN) 
                ? '' 
                : ( <Stack
                direction="row"
                justifyContent="left"
                alignItems="left"
                spacing={1}
                p={1}>
                <FormControl size="small" sx={{ mb: 1, mr: 1, minWidth: 300 }}>
                    <InputLabel id="material-label">Material</InputLabel>
                    <Select
                        labelId="material"
                        id="material-select"
                        label="Material"
                        value={this.state.selectedMaterial.name}
                        onChange={this.handleOnSelectMaterial}
                        disabled={this.props.disabled}
                        MenuProps={{
                            disableScrollLock: true, // stop scroll bar in window from popping
                          }}>
                        {renderedMaterialItems}
                    </Select>
                </FormControl>
            </Stack>);
        };

        const progressIndicator = () => {
            return (<CircularProgress color="warning" size={20}/>);
        };

        return (
            <Box
            component="form"
            noValidate
            autoComplete="off">  
                 {materialSelectComponent()}
                <Stack
                    direction="row"
                    justifyContent="left"
                    alignItems="left"
                    spacing={1}
                    padding={1}>
                    <Box variant="div" sx={{display: 'flex'}}>
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
                                disabled={this.props.disabled}
                                onChange={this.handleOnChange}
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
                            sx={{minWidth: 200, maxWidth: 200}}
                            min={BF_CONSTANTS.EXTRUSION_FEED_RATE_MIN}
                            max={BF_CONSTANTS.EXTRUSION_FEED_RATE_MAX}
                            value={this.state.eFeedrate}
                            disabled={this.props.disabled}
                            onChange={this.handleOnChange}
                            />  
                    </Box>
                    <Box variant="div" sx={{display: 'flex'}}>
                            <Button
                                variant="outlined"
                                size="medium"
                                disabled={this.props.disabled}
                                color={(isMachinePullingDown) ? "error" : "success"}
                                startIcon={<SwipeDownAltIcon />}
                                onClick={(isMachinePullingDown)
                                    ? this.handleStopPullDownClick
                                    : this.handleStartPullDownClick} >
                                {(isMachinePullingDown)
                                    ? 'Stop Pull-Down'
                                    : 'Start Pull-Down'}
                            </Button>
                        </Box>
                        <Stack variant="div"   justifyContent="center"
                            alignContent="center" sx={{display: 'flex'}}>
                                {(isMachinePullingDown) ? progressIndicator() : ''}
                        </Stack>
                </Stack>
                <Stack
                    direction="column"
                    justifyContent="left"
                    alignContent="left"
                    spacing={1}
                    padding={2}
                    >
                    <Stack
                        direction="row"
                        alignItems="left"
                        alignContent="left"
                        spacing={1}
                        width="100%"
                        >
                            <Typography variant="div" gutterBottom sx={{wordWrap: 'no-wrap', fontStyle: 'italic', fontWeight: 500}}>
                                Generated Pull Down Command:
                            </Typography>
                            <Typography variant="span" sx={commandStyle}>
                                {spinningCommandText}
                            </Typography>                        
                    </Stack>
                    <Typography gutterBottom variant="span" sx={{fontStyle: 'italic'}} component="div">
                        Estimated Time Per Command: {perCommandTimeText}
                        </Typography>
                </Stack>
            </Box>
        );
    }
}

export default PullDownParamSubmitter;