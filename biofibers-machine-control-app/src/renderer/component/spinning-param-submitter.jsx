import * as React from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { Stack, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import RotateRightIcon from '@mui/icons-material/RotateRight';


class SpinningParamSubmitter extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            eValueLow: 0.1, 
            eValueHigh: 0.2,
            xValue:4, 
            xFeedrate: 0.01, 
            collectorSpeedLow: 60, 
            collectorSpeedHigh: 120, 
            collectorDirection: 'clockwise', 
            pulseCycle: 20, 
            eFeedrate: 0.01, 
            spinningInProgress: false
        }
        // this.handleSubmit = this.handleSubmitCommand.bind(this);
        this.handleOnChange = this.handleOnChange.bind(this);
        this.handleOnDirectionChange = this.handleOnDirectionChange.bind(this);
    }

    handleOnChange(event) {
        const {name, value} = event.target;
        console.log(name);
        this.setState({
            ...this.state,
            [name]: Number(value)
        });
    }

    handleOnDirectionChange( event, newDirection ) {
        this.setState({
            collectorDirection: newDirection
        });
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
            >
                <p><b>Pulsing</b></p>

                <Stack
                    direction="row"
                    justifyContent="center"
                    alignItems="center"
                    spacing={1}
                >
                    <p>Extrusion Amount [mm]: </p>
                    <TextField
						label="extrusion amount low"
                        name="eValueLow"
                        type="number"
						size="small"
						color="primary"
						margin="dense"
						value={this.state.eValueLow}
						disabled={!this.props.isEnabled}
                        onChange={this.handleOnChange}
						/> 
                    <TextField
						label="extrusion amount high"
                        name="eValueHigh"
                        type="number"
						size="small"
						color="primary"
						margin="dense"
						value={this.state.eValueHigh}
						disabled={!this.props.isEnabled}
                        onChange={this.handleOnChange}
						/>                 
                </Stack>
                <Stack
                    direction="row"
                    justifyContent="center"
                    alignItems="center"
                    spacing={1}
                >
                    <p>Extrusion Feed Rate [mm/min]</p>
                    <TextField
                        name="eFeedrate"
						label="extrusion feedrate"
                        type="number"
						size="small"
						color="primary"
						margin="dense"
                        value={this.state.eFeedrate}
						disabled={!this.props.isEnabled}
                        onChange={this.handleOnChange}
						/>  
                </Stack>
                <Stack
                    direction="row"
                    justifyContent="center"
                    alignItems="center"
                    spacing={1}
                >
                    <p>X Axis Movement [mm]</p>
                    <TextField
                        name="xValue"
						label="x axis movement"
                        type="number"
						size="small"
						color="primary"
						margin="dense"
                        value={this.state.xValue}
						disabled={!this.props.isEnabled}
                        onChange={this.handleOnChange}
						/>   
                    
                    <p>X Axis Feed Rate [mm/min]</p>
                    <TextField
                        name="xFeedrate"
						label="x axis feedrate"
                        type="number"
						size="small"
						color="primary"
                        value={this.state.xFeedrate}
						disabled={!this.props.isEnabled}
                        onChange={this.handleOnChange}
						/>                   
                </Stack>
                <Stack
                    direction="row"
                    justifyContent="center"
                    alignItems="center"
                    spacing={1}
                >
                    <p>Collector Speed: </p>
                    <TextField
						label="collector speed low"
                        name="collectorSpeedLow"
                        type="number"
						size="small"
						color="primary"
						margin="dense"
						value={this.state.collectorSpeedLow}
						disabled={!this.props.isEnabled}
                        onChange={this.handleOnChange}
						/> 
                    <TextField
						label="collector speed high"
                        name="collectorSpeedHigh"
                        type="number"
						size="small"
						color="primary"
						margin="dense"
						value={this.state.collectorSpeedHigh}
						disabled={!this.props.isEnabled}
                        onChange={this.handleOnChange}
						/> 
                    <ToggleButtonGroup
                        name="collectorDirection"
                        label="Direction"
                        value={this.state.collectorDirection}
                        disabled={!this.props.isEnabled}
                        color="primary"
                        onChange={this.handleOnDirectionChange}
                        exclusive>
                        <ToggleButton value="clockwise">
                            <RotateRightIcon />
                        </ToggleButton>
                        <ToggleButton value="counterclockwise">
                            <RotateLeftIcon />
                        </ToggleButton>
                    </ToggleButtonGroup>                
                </Stack>
                <Stack
                    direction="row"
                    justifyContent="center"
                    alignItems="center"
                    spacing={1}
                >
                    <p>Pulse Cycle [min]: </p>
                    <TextField
                        label="pulse cycle"
                        name="pulseCycle"
                        type="number"
                        size="small"
                        color="primary"
                        margin="dense"
                        value={this.state.pulseCycle}
                        disabled={!this.props.isEnabled}
                        onChange={this.handleOnChange}
                        /> 
                </Stack>
            </Box>
        )
    }
}

export default SpinningParamSubmitter;

