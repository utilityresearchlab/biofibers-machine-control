import * as React from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';

import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import HomeIcon from '@mui/icons-material/Home';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import StopCircleIcon from '@mui/icons-material/StopCircle';

import ThermostatIcon from '@mui/icons-material/Thermostat';

import ConstrainedNumberTextField from './constrained-number-text-field'
import * as BF_CONSTANTS from '../lib/biofibers-machine/biofibers-machine-constants'
import { GcodeBuilder } from '../lib/machine-control/gcode-builder';


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
        };
        this.handleSubmitCommand = this.handleSubmitCommand.bind(this);
        this.handleHomeAllClick = this.handleHomeAllClick.bind(this);
        this.handleSetRelativeClick = this.handleSetRelativeClick.bind(this);
        this.handleDisableMotorsClick = this.handleDisableMotorsClick.bind(this);
        this.handleMoveX = this.handleMoveX.bind(this);
        this.handleExtrudePumpClick = this.handleExtrudePumpClick.bind(this);
        this.handleRetractPumpClick = this.handleRetractPumpClick.bind(this);
        this.handleToggleHeatersClick = this.handleToggleHeatersClick.bind(this);

        this.handlePurgeClick = this.handlePurgeClick.bind(this);
        this.handleOnChange = this.handleOnChange.bind(this);
        this.handleOnDirectionChange = this.handleOnDirectionChange.bind(this);
        this.handleOnKeyUp = this.handleOnKeyUp.bind(this);
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
            .comment('home all')
            .homeAll()
            // .useRelativeCoordinates()
            // .useRelativeExtrusionDistances()
            // .resetExtrusionDistance()
            .toGcode();
        gcodeLines.forEach((line, index) => {
            this.handleSubmitCommand(event, line);
        });
    }

    handleSetRelativeClick(event) {
        let gcodeBuilder = new GcodeBuilder();
        const gcodeLines = gcodeBuilder
            .comment('set relative')
            .useRelativeCoordinates()
            .useRelativeExtrusionDistances()
            .resetExtrusionDistance()
            .toGcode();
        gcodeLines.forEach((line, index) => {
            this.handleSubmitCommand(event, line);
        });
    }

    handleDisableMotorsClick(event) {
        let gcodeBuilder = new GcodeBuilder();
        const gcodeLines = gcodeBuilder
            .disableMotors()
            .toGcode();
        gcodeLines.forEach((line, index) => {
            this.handleSubmitCommand(event, line);
        });
    }

    handleMoveX(evt) {
        if (!evt) {
            return;
        }
        const value = parseFloat(evt.target.textContent);
        let gcodeBuilder = new GcodeBuilder();
        const gcodeLines = gcodeBuilder
            .moveX(value, BF_CONSTANTS.X_AXIS_DEFAULT_FEED_RATE, 'move x')
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
        if (this.props.onChangeHeatingState) {
            const isHeating = this.props.machineState.isHeatingOn();
            if (!isHeating) {
                // Enable Heating
                this.props.onChangeHeatingState(this.state.inputHeaterWrapSetPoint, this.state.inputNozzleTempSetPoint);
            } else {
                // Disable Heating
                this.props.onChangeHeatingState(0, 0);
            }
        }
    }

    handlePurgeClick(event) {
        let gcodeBuilder = new GcodeBuilder();
        gcodeBuilder.extrude(this.state.purgeAmount, this.state.purgeFeedRate, "Purge material");
        this.handleSubmitCommand(event, gcodeBuilder.toGcodeString());
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
        const machineState = this.props.machineState;
        const currentNozzleTemp = machineState.getCurrentNozzleTemp();
        const setPointNozzleTemp = machineState.getSetpointNozzleTemp(); 
        const currentSyringeWrapTemp = machineState.getCurrentHeaterWrapTemp();
        const setPointSyringeWrapTemp = machineState.getSetpointHeaterWrapTemp();
        const isHeatingOn = machineState.isHeatingOn();

        const heaterWrapCurrentTemp = currentSyringeWrapTemp.toFixed(BF_CONSTANTS.TEMPERATURE_DECIMAL_PRECISION);
        const heaterWrapSetPoint = setPointSyringeWrapTemp.toFixed(BF_CONSTANTS.TEMPERATURE_DECIMAL_PRECISION);
        const isOnHeaterWrapTemp = heaterWrapSetPoint > BF_CONSTANTS.HEATER_WRAP_TEMPERATURE_MIN; 
        const isHeaterWrapTempReached = Math.abs(heaterWrapCurrentTemp - heaterWrapSetPoint) <= BF_CONSTANTS.TEMPERATURE_DEVIATION_AMOUNT;
        let heaterWrapStatusColor = "special.gray";
        if (isOnHeaterWrapTemp && isHeaterWrapTempReached) {
            heaterWrapStatusColor = "special.success";
        } else if (isOnHeaterWrapTemp) {
            heaterWrapStatusColor = "special.warning";
        }

        const nozzleCurrentTemp = currentNozzleTemp.toFixed(BF_CONSTANTS.TEMPERATURE_DECIMAL_PRECISION);
        const nozzleSetPoint = setPointNozzleTemp.toFixed(BF_CONSTANTS.TEMPERATURE_DECIMAL_PRECISION);
        const isOnNozzleTemp = nozzleSetPoint > BF_CONSTANTS.EXTRUDER_TEMPERATURE_MIN; 
        const isNozzleTempReached = Math.abs(nozzleCurrentTemp - nozzleSetPoint) <= BF_CONSTANTS.TEMPERATURE_DEVIATION_AMOUNT;

        let nozzleTempStatusColor = "special.gray";
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
                        Home Axes
                    </Button>
                    <Button
                        size="medium"
                        variant="outlined"
                        startIcon={<GpsFixedIcon/>}
                        disabled={this.props.disabled}
                        onClick={this.handleSetRelativeClick} >
                        Set Axes to Relative
                    </Button>
                    <Button
                        size="medium"
                        variant="outlined"
                        startIcon={<LockOpenIcon/>}
                        disabled={this.props.disabled}
                        onClick={this.handleDisableMotorsClick} >
                        Unlock Motors {/* Disable Motors */}
                    </Button>
                </Stack>
                <Stack
                    direction="row"
                    justifyContent="left"
                    alignItems="left"
                    spacing={2}
                    p={1}>
                    <Stack
                        direction="row"
                        justifyContent="center"
                        alignItems="center">                
                            <Typography p={1}>X:</Typography>    
                            <Tooltip title={"Move X Position"}>                 
                            <ButtonGroup 
                            variant="outlined" 
                            aria-label="Move X" 
                            size="small"
                            color="secondary"
                            onClick={this.handleMoveX}>
                                    <Button>-100</Button>
                                    <Button>-10</Button>
                                    <Button>-1</Button>
                                    <Button>-0.1</Button>
                                    <Button>0.1</Button>
                                    <Button>1</Button>
                                    <Button>10</Button>
                                    <Button>100</Button>
                                </ButtonGroup>
                        </Tooltip>
                    </Stack>
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
                        max={BF_CONSTANTS.EXTRUSION_FEED_RATE_MAX}
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
                            max={BF_CONSTANTS.EXTRUSION_FEED_RATE_MAX}
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
            </Box>
        );
    }
}

export default SetupParamSubmitter;