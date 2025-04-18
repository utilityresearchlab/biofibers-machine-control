import * as React from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import HomeIcon from '@mui/icons-material/Home';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import SwipeDownAltIcon from '@mui/icons-material/SwipeDownAlt';
import ThermostatIcon from '@mui/icons-material/Thermostat';

import ConstrainedNumberTextField from './constrained-number-text-field'
import * as BF_CONSTANTS from '../lib/biofibers-machine/biofibers-machine-constants'
import { GcodeBuilder } from '../lib/machine-control/gcode-builder';
import MaterialHelper from '../lib/material-util/material-helper';
import MathUtil from '../lib/math-util'
import MiscUtil from '../lib/machine-control/misc-util';

class SetupParamSubmitter extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            adjustPumpDistance: 2,
            adjustPumpFeedRate: BF_CONSTANTS.EXTRUSION_FEED_RATE_DEFAULT,
            purgeAmount: BF_CONSTANTS.EXTRUSION_AMOUNT_PURGE,
            purgeFeedRate: BF_CONSTANTS.EXTRUSION_FEED_RATE_PURGE,
            inputNozzleTempSetPoint: 32,
            inputHeaterWrapSetPoint: 52,
            collectorSpeed: 100,
            collectorDirection: BF_CONSTANTS.COLLECTOR_DIRECTION_STOPPED, // stopped by default
            pullDownInProgress: false,
            nIntervalId: null,
            selectedMaterial: MaterialHelper.availableMaterials()[0]
        };
        this.handleSubmitCommand = this.handleSubmitCommand.bind(this);
        this.handleHomeAllClick = this.handleHomeAllClick.bind(this);
        this.handleExtrudePumpClick = this.handleExtrudePumpClick.bind(this);
        this.handleRetractPumpClick = this.handleRetractPumpClick.bind(this);
        this.handleToggleHeatersClick = this.handleToggleHeatersClick.bind(this);

        this.handlePurgeClick = this.handlePurgeClick.bind(this);
        this.handleOnChange = this.handleOnChange.bind(this);
        this.handleOnDirectionChange = this.handleOnDirectionChange.bind(this);
        this.handleStartPullDownClick = this.handleStartPullDownClick.bind(this);
        this.handleStopPullDownClick = this.handleStopPullDownClick.bind(this);
        this.handleOnKeyUp = this.handleOnKeyUp.bind(this);
        this.handleOnSelectMaterial = this.handleOnSelectMaterial.bind(this);
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
        let gcodeBuilder = new GcodeBuilder();
        const gcodeLines = gcodeBuilder
            .comment('home all and set relative')
            .homeAll()
            .useRelativeCoordinates()
            .useRelativeExtrusionDistances()
            .resetExtrusionDistance()
            .toGcode();
        gcodeLines.forEach((line, index) => {
            this.handleSubmitCommand(event, line);
        });
    }

    handleExtrudePumpClick(event) {
        let gcodeBuilder = new GcodeBuilder();
        gcodeBuilder.extrude(this.state.adjustPumpDistance, this.state.adjustPumpFeedRate);
        this.handleSubmitCommand(event, gcodeBuilder.toGcodeString());
    }

    handleRetractPumpClick(event) {
        let gcodeBuilder = new GcodeBuilder();
        gcodeBuilder.retract(this.state.adjustPumpDistance, this.state.adjustPumpFeedRate);
        this.handleSubmitCommand(event, gcodeBuilder.toGcodeString());
    }

    handleToggleHeatersClick(event) {
        event.preventDefault();
        let gcodeBuilder = new GcodeBuilder();
        //gcodeBuilder.retract(this.state.adjustPumpDistance, this.state.adjustPumpFeedRate);
        if (this.props.isHeatingOn) {
            // Turn heaters off
            gcodeBuilder.setTemperature(0, false, BF_CONSTANTS.HEATER_NOZZLE_TOOL_ID);
            gcodeBuilder.setTemperature(0, false, BF_CONSTANTS.HEATER_SYRINGE_WRAP_TOOL_ID);
        } else {
            // Turn heaters on
            gcodeBuilder.setTemperature(this.state.inputNozzleTempSetPoint, false, BF_CONSTANTS.HEATER_NOZZLE_TOOL_ID);
            gcodeBuilder.setTemperature(this.state.inputHeaterWrapSetPoint, false, BF_CONSTANTS.HEATER_SYRINGE_WRAP_TOOL_ID);
        }
        this.handleSubmitCommand(event, gcodeBuilder.toGcodeString());
    }

    handlePurgeClick(event) {
        let gcodeBuilder = new GcodeBuilder();
        gcodeBuilder.extrude(this.state.purgeAmount, this.state.purgeFeedRate, "Purge material");
        this.handleSubmitCommand(event, gcodeBuilder.toGcodeString());
    }

    handleStartPullDownClick(event) {
        if (this.props.onChangePullDownState) {
            this.props.onChangePullDownState(true);
        }
        // let gcodeBuilder = new GcodeBuilder();
        // const gcodeLines = gcodeBuilder
        //     .comment('start pull down')
        //     .useRelativeCoordinates()
        //     .useRelativeExtrusionDistances()
        //     .resetExtrusionDistance()
        //     .toGcode();
        // gcodeLines.forEach((line, index) => {
        //     this.handleSubmitCommand(event, line);
        // });

        // // keep sending command to extrude until pull-down is stopped
        // // TODO: Determine proper interval timing instead of hard-coding 5000 ms
        // // const commandTime = MiscUtil.calculateCommandTimeInMilliSec(params['E'], params['X'], params['F']);
        // // TODO (mrivera) - fix timeout interval 
        // let intervalId = setInterval(() => {
        //     let pullDownGcodeBuilder = new GcodeBuilder();
        //     const defaultParams = MaterialHelper.defaultParams()[this.state.selectedMaterial];
        //     pullDownGcodeBuilder.move({
        //             [GCODE_CONSTANTS.PARAM_E]: defaultParams[GCODE_CONSTANTS.PARAM_E],
        //             [GCODE_CONSTANTS.PARAM_X]: defaultParams[GCODE_CONSTANTS.PARAM_X],
        //             [GCODE_CONSTANTS.PARAM_F]: defaultParams[GCODE_CONSTANTS.PARAM_F],
        //         }, 
        //         'extrude and move X'); // value from experiments
        //     this.handleSubmitCommand(event, pullDownGcodeBuilder.toGcodeString());
        // }, 100);
        // this.setState({
        //     nIntervalId: intervalId,
        //     pullDownInProgress: true
        // });
    }

    handleStopPullDownClick(event) {
        if (this.props.onChangePullDownState) {
            this.props.onChangePullDownState(false);
        }
    }

    handleOnChange(event) {
        const { name, value } = event.target;
        this.setState({
            [name]: value ? Number(value) : 0
        });
    }


    handleOnDirectionChange(event, newDirection) {
        if (newDirection !== null 
                || (this.state.collectorDirection == BF_CONSTANTS.COLLECTOR_DIRECTION_STOPPED)) {
                // Don't change if we tried to deselect, otherwise let us stop
            newDirection = (newDirection != null) 
                ? newDirection 
                : BF_CONSTANTS.COLLECTOR_DIRECTION_STOPPED
            this.setState({
                collectorDirection: newDirection
            });
            let gcodeBuilder = new GcodeBuilder();
            if (newDirection == BF_CONSTANTS.COLLECTOR_DIRECTION_STOPPED) {
                gcodeBuilder.stopSpindle();
            } else {            
                gcodeBuilder.setSpindleSpeed(
                    this.state.collectorSpeed, 
                    newDirection === BF_CONSTANTS.COLLECTOR_DIRECTION_CLOCKWISE 
                        ? true 
                        : false);
            }
            this.handleSubmitCommand(event, gcodeBuilder.toGcodeString());
        }

    }

    handleOnSelectMaterial(event) {
        const material = String(event.target.value);
        this.setState({ 
            selectedMaterial: material 
        });
    }

    getRenderedMaterialItems() {
        const availableMaterials = MaterialHelper.availableMaterials();
        let renderedMaterialItems = availableMaterials.map((item, index) => {
            const value = item.toString();
            return (
                <MenuItem
                    key={"item-material-" + value}
                    value={value}>{value}</MenuItem>
            )
        });
        return renderedMaterialItems;
    }

    // Trigger submmit command if we press enter in the textbox
    handleOnKeyUp(event) {
        // TODO need to handle mix/max values for collector speed (mrivera)
        event.preventDefault();
        let gcodeBuilder = new GcodeBuilder();
        if (event.charCode == 13
            || event.keyCode == 13
            || event.key === 'Enter') {
            // Enter pressed so trigger submit
            const { name, value } = event.target;
            // Set extruder temperature: tool 1
            if (name == 'inputNozzleTempSetPoint') {
                gcodeBuilder.setTemperature(this.state.inputNozzleTempSetPoint, false, BF_CONSTANTS.HEATER_NOZZLE_TOOL_ID);
            } else if (name == 'inputHeaterWrapSetPoint') {
                // Set wrapper temperature: tool 0
                gcodeBuilder.setTemperature(this.state.inputHeaterWrapSetPoint, false, BF_CONSTANTS.HEATER_SYRINGE_WRAP_TOOL_ID);
            } else if (name == 'collectorSpeed') {
                // Don't change live speed when collector is stopped
                if (this.state.collectorDirection == BF_CONSTANTS.COLLECTOR_DIRECTION_STOPPED) {
                    return;
                }
                // Otherwise update speed
                gcodeBuilder.setSpindleSpeed(
                    this.state.collectorSpeed, 
                    this.state.collectorDirection == BF_CONSTANTS.COLLECTOR_DIRECTION_CLOCKWISE 
                        ? true 
                        : false);
            }
            this.handleSubmitCommand(event, gcodeBuilder.toGcodeString());
        }
    }

    render() {
        const renderedMaterialItems = this.getRenderedMaterialItems();
        const isMachinePullingDown = this.props.isMachinePullingDown;
        
        const heaterWrapCurrentTemp = this.props.currentSyringeWrapTemp.toFixed(BF_CONSTANTS.TEMPERATURE_DECIMAL_PRECISION);
        const heaterWrapSetPoint = this.props.setPointHeaterWrapTemp.toFixed(BF_CONSTANTS.TEMPERATURE_DECIMAL_PRECISION);
        const isOnHeaterWrapTemp = heaterWrapSetPoint > BF_CONSTANTS.HEATER_WRAP_TEMPERATURE_MIN; 
        const isHeaterWrapTempReached = Math.abs(heaterWrapCurrentTemp - heaterWrapSetPoint) <= BF_CONSTANTS.TEMPERATURE_DEVIATION_AMOUNT;
        let heaterWrapStatusColor = "body";
        if (isOnHeaterWrapTemp && isHeaterWrapTempReached) {
            heaterWrapStatusColor = "special.success";
        } else if (isOnHeaterWrapTemp) {
            heaterWrapStatusColor = "special.warning";
        }

        const nozzleCurrentTemp = this.props.currentNozzleTemp.toFixed(BF_CONSTANTS.TEMPERATURE_DECIMAL_PRECISION);
        const nozzleSetPoint = this.props.setPointNozzleTemp.toFixed(BF_CONSTANTS.TEMPERATURE_DECIMAL_PRECISION);
        const isOnNozzleTemp = nozzleSetPoint > BF_CONSTANTS.EXTRUDER_TEMPERATURE_MIN; 
        const isNozzleTempReached = Math.abs(nozzleCurrentTemp - nozzleSetPoint) <= BF_CONSTANTS.TEMPERATURE_DEVIATION_AMOUNT;

        const isHeatingOn = this.props.isHeatingOn;

        let nozzleTempStatusColor = "body";
        if (isOnNozzleTemp && isNozzleTempReached) {
            nozzleTempStatusColor = "special.success";
        } else if (isOnNozzleTemp) {
            nozzleTempStatusColor = "special.warning";
        }

        return (
            <Box
                component="form"
                noValidate
                autoComplete="off">       
                <Stack
                    direction="row"
                    justifyContent="left"
                    alignItems="center"
                    spacing={1}
                    p={1}>
                    <Button
                        size="medium"
                        variant="outlined"
                        startIcon={<HomeIcon/>}
                        disabled={this.props.disabled}
                        onClick={this.handleHomeAllClick} >
                        Home All & Set Axes to Relative
                    </Button>
                </Stack>

                <Stack
                    direction="row"
                    justifyContent="left"
                    alignItems="left"
                    spacing={1}
                    p={1}>
                    <ConstrainedNumberTextField 
                        size="small"
                        color="primary"
                        margin="normal"
                        sx={{minWidth: 245, maxWidth: 245}}
                        label="Adjust Syringe Shuttle Position [mm]"                       
                        name="adjustPumpDistance"
                        value={this.state.adjustPumpDistance}
                        min={BF_CONSTANTS.EXTRUSION_AMOUNT_MIN}
                        max={BF_CONSTANTS.EXTRUSION_AMOUNT_MAX}
                        onChange={this.handleOnChange}                        
                        disabled={this.props.disabled}
                        />
                    <ConstrainedNumberTextField
                        name="adjustPumpFeedRate"
                        label="Syringe Feed Rate [mm/min]"
                        type="number"
                        size="small"
                        color="primary"
                        margin="dense"
                        sx={{minWidth: 200, maxWidth: 200}}
                        min={BF_CONSTANTS.EXTRUSION_FEED_RATE_MIN}
                        value={this.state.adjustPumpFeedRate}
                        disabled={this.props.disabled}
                        onChange={this.handleOnChange}
                        />  

                    <Box variant="div" sx={{display: 'flex'}}>
                        <Button
                            size="medium"
                            variant="outlined"
                            width="100%"
                            startIcon={<KeyboardDoubleArrowUpIcon />}
                            disabled={this.props.disabled}
                            onClick={this.handleRetractPumpClick} >
                            Retract
                        </Button>
                    </Box>
                    <Box variant="div" sx={{display: 'flex'}}>
                        <Button
                            size="medium"
                            variant="outlined"
                            width="100%"
                            startIcon={<KeyboardDoubleArrowDownIcon />}
                            disabled={this.props.disabled}
                            onClick={this.handleExtrudePumpClick} >
                            Extrude
                        </Button>
                    </Box>
                </Stack>
                <Stack
                    direction="row"
                    justifyContent="left"
                    alignItems="left"
                    spacing={1}
                    p={1}>
                        <ConstrainedNumberTextField
                            label="Set Syringe Wrap Temp. [ºC]"
                            name="inputHeaterWrapSetPoint"
                            type="number"
                            size="small"
                            color="primary"
                            sx={{minWidth: 255, maxWidth: 255}}
                            value={this.state.inputHeaterWrapSetPoint}
                            disabled={this.props.disabled}
                            onChange={this.handleOnChange}
                            onKeyUp={this.handleOnKeyUp}
                            min={BF_CONSTANTS.HEATER_WRAP_TEMPERATURE_MIN}
                            max={BF_CONSTANTS.HEATER_WRAP_TEMPERATURE_MAX}
                            helperText={
                                <Typography 
                                    color={heaterWrapStatusColor} 
                                    gutterBottom 
                                    variant="span" 
                                    sx={{fontSize: '1.1em', fontWeight: 600}}>
                                    * Syringe Wrap: {heaterWrapCurrentTemp} ºC / {heaterWrapSetPoint} ºC
                                </Typography>}
                            />
                         <ConstrainedNumberTextField
                            label="Set Nozzle Temp. [ºC]"
                            name="inputNozzleTempSetPoint"
                            type="number"
                            size="small"
                            color="primary"
                            sx={{minWidth: 230, maxWidth: 230}}
                            value={this.state.inputNozzleTempSetPoint}
                            disabled={this.props.disabled}
                            onChange={this.handleOnChange}
                            onKeyUp={this.handleOnKeyUp}
                            min={BF_CONSTANTS.EXTRUDER_TEMPERATURE_MIN} 
                            max={BF_CONSTANTS.EXTRUDER_TEMPERATURE_MAX}
                            helperText={
                                <Typography 
                                    color={nozzleTempStatusColor} 
                                    gutterBottom 
                                    variant="span" 
                                    sx={{fontSize: '1.1em', fontWeight: 600}}>
                                    * Nozzle: {nozzleCurrentTemp} ºC / {nozzleSetPoint} ºC
                                </Typography>}
                            />
                             <Box variant="div" sx={{display: 'flex'}}>
                                <Button
                                    size="medium"
                                    variant="outlined"
                                    sx={{marginBottom: "1.85em"}}
                                    color={isHeatingOn ? "warning" : 'info'}
                                    startIcon={isHeatingOn ? <ThermostatIcon /> : <ThermostatIcon />} 
                                    disabled={this.props.disabled}
                                    onClick={this.handleToggleHeatersClick}>
                                    {!isHeatingOn ? "Enable Heat" : "Disable Heat"}
                                </Button>
                            </Box>          
                </Stack>
                <Stack  
                    direction="row"
                    justifyContent="left"
                    alignItems="left"
                    spacing={1}
                    p={1}>
                        <ConstrainedNumberTextField 
                            size="small"
                            color="primary"
                            margin="normal"
                            sx={{minWidth: 150, maxWidth: 150}}
                            label="Purge Amount [mm]"                       
                            name="purgeAmount"
                            value={this.state.purgeAmount}
                            min={BF_CONSTANTS.EXTRUSION_AMOUNT_MIN}
                            max={BF_CONSTANTS.EXTRUSION_AMOUNT_MAX}
                            onChange={this.handleOnChange}                        
                            disabled={this.props.disabled}
                            />
                        <ConstrainedNumberTextField
                            name="purgeFeedRate"
                            label="Purge Feed Rate [mm/min]"
                            type="number"
                            size="small"
                            color="primary"
                            margin="dense"
                            sx={{minWidth: 190, maxWidth: 190}}
                            min={BF_CONSTANTS.EXTRUSION_FEED_RATE_MIN}
                            value={this.state.purgeFeedRate}
                            disabled={this.props.disabled}
                            onChange={this.handleOnChange}
                            /> 
                            <Box variant="div" sx={{display: 'flex'}}>
                                <Button
                                    size="medium"
                                    variant="outlined"
                                    startIcon={<DeleteOutlineIcon />}
                                    disabled={this.props.disabled}
                                    onClick={this.handlePurgeClick}>
                                    Purge material
                                </Button>
                            </Box>
                    </Stack>
                <Stack  
                    direction="row"
                    justifyContent="left"
                    alignItems="left"
                    spacing={1}
                    p={1}>
                    <Box 
                        variant="div"
                        sx={{minWidth: 300, maxWidth: 300}}>
                        <ConstrainedNumberTextField                            
                            name="collectorSpeed"
                            label="Collector Speed PWM [from 0 to 255]"
                            size="small"
                            type="number"
                            color="primary"
                            inputUnits="/ 255"
                            sx={{width: '100%'}}
                            min={BF_CONSTANTS.COLLECTOR_PWM_SPEED_MIN}
                            max={BF_CONSTANTS.COLLECTOR_PWM_SPEED_MAX}
                            value={this.state.collectorSpeed}
                            disabled={this.props.disabled}
                            onChange={this.handleOnChange}
                            onKeyUp={this.handleOnKeyUp} />
                    </Box>
                    <ToggleButtonGroup
                        name="collectorDirection"
                        label="Direction"
                        value={this.props.disabled ? null : this.state.collectorDirection}
                        color="primary"
                        size="small"
                        onChange={this.handleOnDirectionChange}
                        disabled={this.props.disabled}
                        exclusive>
                      
                        <Tooltip title="Stop Collector">
                            <span>
                                <ToggleButton
                                    aria-label="Stop collector"
                                    disabled={this.props.disabled}
                                    value={BF_CONSTANTS.COLLECTOR_DIRECTION_STOPPED}>
                                    <StopCircleIcon />
                                </ToggleButton>
                            </span>
                        </Tooltip>
          
                        <Tooltip title="Start Clockwise Rotation">
                            <span>
                                <ToggleButton
                                    aria-label="clockwise rotation"
                                    disabled={this.props.disabled}
                                    value={BF_CONSTANTS.COLLECTOR_DIRECTION_CLOCKWISE}>
                                    <RotateRightIcon />
                                </ToggleButton>
                            </span>
                        </Tooltip>
                        <Tooltip title="Start Counterclockwise Rotation">
                            <span>
                                <ToggleButton
                                    aria-label="counterclockwise rotation"
                                    disabled={this.props.disabled}
                                    value={BF_CONSTANTS.COLLECTOR_DIRECTION_COUNTERCLOCKWISE}>
                                    <RotateLeftIcon />
                                </ToggleButton>
                            </span>
                        </Tooltip>
                    </ToggleButtonGroup>
                </Stack>
                <Stack
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
                            value={this.state.selectedMaterial}
                            onChange={this.handleOnSelectMaterial}
                            disabled={this.props.disabled}>
                            {renderedMaterialItems}
                        </Select>
                    </FormControl>
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
                </Stack>
            </Box>
        );
    }
}

export default SetupParamSubmitter;