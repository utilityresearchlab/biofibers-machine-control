import * as React from "react";

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';

import Stack from '@mui/material/Stack';
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";

import AutoModeIcon from '@mui/icons-material/AutoMode';
import DangerousIcon from '@mui/icons-material/Dangerous';
import PendingOutlinedIcon from '@mui/icons-material/PendingOutlined';
import SwipeDownAltIcon from '@mui/icons-material/SwipeDownAlt';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import UsbIcon from '@mui/icons-material/Usb';
import UsbOffIcon from '@mui/icons-material/UsbOff';

import * as LOGGER from '../lib/logger-util';

import * as BF_CONSTANTS from '../lib/biofibers-machine/biofibers-machine-constants'


class StatusBar extends React.Component {
	constructor(props) {
		super(props);
		// do nothing
        this.handleEmergencyStopClick = this.handleEmergencyStopClick.bind(this);
	}

    handleEmergencyStopClick(event) {
        if (event) {
            event.preventDefault();
        }
        if (this.props.onEmergencyStopClicked) {
            this.props.onEmergencyStopClicked();
        }
        LOGGER.logE("EMERGENCY STOPPED TRIGGERED");
    }

	render() {
		const props = this.props;
        const machineState = this.props.machineState;
        const isConnected = machineState.isMachineConnected();
        const currentNozzleTemp = machineState.getCurrentNozzleTemp();
        const setPointNozzleTemp = machineState.getSetpointNozzleTemp(); 
        const currentSyringeWrapTemp = machineState.getCurrentHeaterWrapTemp();
        const setPointSyringeWrapTemp = machineState.getSetpointHeaterWrapTemp();
        const isHeatingOn = machineState.isHeatingOn();

        const iconSx = { 
            fontSize: '1rem',
            variant: 'contained',
        };

        const machineConnectedStatusText = isConnected ? "Machine Connected" : "Machine Disconnected";
        const connectedWidget = () => {
            let connectedIconColor = (isConnected) ? "success" : "special.gray";
            const usbIcon = () => {
                if (isConnected) {
                    return (<UsbIcon
                        sx={iconSx}
                        color={connectedIconColor} />);
                } else {    
                return (<UsbOffIcon
                            sx={iconSx}
                            color={connectedIconColor}
                            // selected={this.state.shouldScroll}
                            />);
                }}
            return (
                <Stack
                    direction="row"                        
                    alignItems="center"
                    justifyContent="center"
                    spacing={1}
                    width={30}
                    color={connectedIconColor}>
                        {usbIcon()} 
                </Stack>);
        };

        let machineStatusText = "Machine Disconnected";
        let shortMachineStatusText = "Offline";
        let machineStatusColorSetup = "special.gray";
        if (!isConnected) {
            machineStatusText = "Offline";
            shortMachineStatusText = "Offline";
            machineStatusColorSetup = "special.gray";
        } else if (machineState.isMachinePullingDown()) {
            machineStatusText = "Pull Down - In Progress ";
            shortMachineStatusText = "Pulling";
            machineStatusColorSetup = "special.success";
        } else if (machineState.isMachineSpinning()) {
            machineStatusText = "Spinning - In Progress ";
            shortMachineStatusText = "Spinning";
            machineStatusColorSetup = "special.warning";
        } else if (machineState.isMachineEmergencyStopped()) {
            machineStatusText = "Emergency Stop Called! ";
            shortMachineStatusText = "Stopped";
            machineStatusColorSetup = "special.error";
        } else {
            // Connected but no status
            machineStatusText = "Machine Idle";
            shortMachineStatusText = "Idle";
            machineStatusColorSetup = "special.info";
        }
        const machineStatusColor = machineStatusColorSetup;
        const machineStatusIcon = () => {
            if (!isConnected) {
                return (<PendingOutlinedIcon sx={iconSx} color={machineStatusColor} />);
            } else if (machineState.isMachinePullingDown()) {
                return (<SwipeDownAltIcon sx={iconSx} color={machineStatusColor} />);
            } else if (machineState.isMachineSpinning()) {
                return (<AutoModeIcon sx={iconSx} color={machineStatusColor} />)
            } else if (machineState.isMachineEmergencyStopped()) {
                return (<DangerousIcon sx={iconSx} color={machineStatusColor} />) 
            } else {
                // Connected but no status
                return (<PendingOutlinedIcon sx={iconSx} color={machineStatusColor} />);
            }
        };

        const heaterWrapCurrentTemp = currentSyringeWrapTemp.toFixed(BF_CONSTANTS.TEMPERATURE_DECIMAL_PRECISION);
        const heaterWrapSetPoint = setPointSyringeWrapTemp.toFixed(BF_CONSTANTS.TEMPERATURE_DECIMAL_PRECISION);
        const isOnHeaterWrapTemp = heaterWrapSetPoint > BF_CONSTANTS.HEATER_WRAP_TEMPERATURE_MIN; 
        const isHeaterWrapTempReached = Math.abs(heaterWrapCurrentTemp - heaterWrapSetPoint) <= BF_CONSTANTS.TEMPERATURE_DEVIATION_AMOUNT;
        let heaterWrapStatusColor = "special.gray";
        let heaterWrapTooltip = "Syringe Heat Off"
        if (isOnHeaterWrapTemp && isHeaterWrapTempReached) {
            heaterWrapStatusColor = "special.success";
            heaterWrapTooltip = "Syringe Heat On";
        } else if (isOnHeaterWrapTemp) {
            heaterWrapStatusColor = "special.warning";
            heaterWrapTooltip =  "Syringe Heat Off";
        }

        const nozzleCurrentTemp = currentNozzleTemp.toFixed(BF_CONSTANTS.TEMPERATURE_DECIMAL_PRECISION);
        const nozzleSetPoint = setPointNozzleTemp.toFixed(BF_CONSTANTS.TEMPERATURE_DECIMAL_PRECISION);
        const isOnNozzleTemp = nozzleSetPoint > BF_CONSTANTS.EXTRUDER_TEMPERATURE_MIN; 
        const isNozzleTempReached = Math.abs(nozzleCurrentTemp - nozzleSetPoint) <= BF_CONSTANTS.TEMPERATURE_DEVIATION_AMOUNT;


        let nozzleTempStatusColor = "special.gray";
        let nozzleTempTooltip = "Nozzle Heat Off"

        if (isOnNozzleTemp && isNozzleTempReached) {
            nozzleTempStatusColor = "special.success";
            nozzleTempTooltip = "Nozzle Heat On"
        } else if (isOnNozzleTemp) {
            nozzleTempStatusColor = "special.warning";
            nozzleTempTooltip = "Nozzle Heat Off";
        }

        return (
			<Box component="div">       
                <Stack
                    direction="row"
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    spacing={1}
                   >
                    <Tooltip title={machineConnectedStatusText}>
                        {connectedWidget()}
                    </Tooltip>
                    <Divider component="span" orientation="vertical" flexItem/>
                    <Tooltip title={machineStatusText}>
                        <Stack
                            direction="row"                        
                            alignItems="center"
                            justifyContent="center"
                            spacing={1}
                            width={90}
                            color={machineStatusColorSetup}>
                                {machineStatusIcon()} 
                                <Typography
                                    color={machineStatusColorSetup}
                                    variant="span" 
                                    sx={{
                                        fontSize: '0.8rem', 
                                        fontWeight: 600,
                                        }}>
                                        {shortMachineStatusText}
                                </Typography>
                        </Stack>
                    </Tooltip>
                    <Divider component="span" orientation="vertical" flexItem/>
                    <Tooltip title={heaterWrapTooltip}>
                        <Stack
                            direction="row"                        
                            alignItems="center"
                            justifyContent="center"
                            spacing={1}
                            width={200}
                            color={heaterWrapStatusColor}>
                            <ThermostatIcon sx={iconSx} />
                            <Typography 
                                color={heaterWrapStatusColor} 
                                variant="span" 
                                sx={{fontSize: '0.8rem', fontWeight: 600}}>
                                Syringe: {heaterWrapCurrentTemp} ºC / {heaterWrapSetPoint} ºC
                            </Typography>
                        </Stack>
                    </Tooltip>
                    <Divider component="span" orientation="vertical" flexItem/>
                    <Tooltip title={nozzleTempTooltip}>
                        <Stack
                            direction="row"                        
                            alignItems="center"
                            justifyContent="center"
                            spacing={1}
                            width={200}
                            color={nozzleTempStatusColor}>
                                <ThermostatIcon sx={iconSx} />
                                <Typography 
                                    color={nozzleTempStatusColor} 
                                    variant="span" 
                                    sx={{fontSize: '0.8rem', fontWeight: 600}}>
                                    Nozzle: {nozzleCurrentTemp} ºC / {nozzleSetPoint} ºC
                                </Typography>
                            </Stack>
                    </Tooltip>
                    <Divider component="span" orientation="vertical" flexItem/> 
                    <Tooltip title={"Click for Emergency Stop"}>
                        <Box 
                            component="div">
                            <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                disabled={!isConnected}
                                startIcon={<DangerousIcon />}
                                onClick={this.handleEmergencyStopClick} >
                                    <Typography 
                                        disabled={!isConnected}
                                        variant="span" 
                                        sx={{fontSize: '0.8rem', fontWeight: 600}}>
                                        {"E-STOP"}
                                    </Typography>
                            </Button>
                        </Box>
                    </Tooltip>
                </Stack>
            </Box>
		);
	}
}

export default StatusBar;
