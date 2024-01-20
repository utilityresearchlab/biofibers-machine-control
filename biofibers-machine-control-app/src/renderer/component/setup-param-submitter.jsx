import * as React from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { Stack, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import RotateRightIcon from '@mui/icons-material/RotateRight';

import { GcodeBuilder } from '../lib/machine-control/gcode_builder';
import MaterialHelper from '../lib/material-util/material-helper';

class SetupParamSubmitter extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            nozzleTemperature: 60,
            wrapperTemperature: 60,
            collectorSpeed: 60,
            collectorDirection: 'clockwise', 
            pullDownInProgress: false,
            nIntervalId: null,
            selectedMaterial: MaterialHelper.availableMaterials()[0]
        }
        this.handleSubmitCommand = this.handleSubmitCommand.bind(this);
        this.handleHomeAllClick = this.handleHomeAllClick.bind(this);
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
        var gcodeBuilder = new GcodeBuilder();
        gcodeBuilder.homeAll();
		this.handleSubmitCommand(event, gcodeBuilder.toGcodeString());
	}

    handleStartPullDownClick(event) {
        var gcodeBuilder = new GcodeBuilder();
        gcodeBuilder
            .userRelativeCoordinates()
            .useRelativeExtrusionDistances()
            .resetExtrusionDistance();

        this.handleSubmitCommand(event, gcodeBuilder.toGcodeString());

        // keep sending command to extrude until pull-down is stopped
        // todo: check buffer
        var intervalId = setInterval(() => {
            var pullDownGcodeBuilder = new GcodeBuilder();
            const params = MaterialHelper.defaultParams()[this.state.selectedMaterial];
            pullDownGcodeBuilder
                .extrudeWhileMoveX(params['E'], params['X'], params['F'], 'extrude and move X'); // value from experiments
                // .moveX(2, 1) // for testing
            this.handleSubmitCommand(event, pullDownGcodeBuilder.toGcodeString())
        }, 1000)
        this.setState({
            nIntervalId: intervalId,
            pullDownInProgress: true
        })
    }

    handleStopPullDownClick(event) {
        this.setState({
            pullDownInProgress: false
        })
        clearInterval(this.state.nIntervalId);
        var gcodeBuilder = new GcodeBuilder();
        gcodeBuilder.setSpindleSpeed(0, true);
        this.handleSubmitCommand(event, gcodeBuilder.toGcodeString());
    }

    handleOnChange(event) {
        const {name, value} = event.target;
        this.setState({
            ...this.state,
            [name]: value
        });
    }

    handleOnDirectionChange( event, newDirection ) {
        this.setState({
            collectorDirection: newDirection
        });
    }

    handleOnSelectMaterial(event) {
		console.log("select material", event.target.value);
		const material = String(event.target.value);
		this.setState({selectedMaterial: material});
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
		event.preventDefault();
        var gcodeBuilder = new GcodeBuilder();
		if (event.charCode == 13
			|| event.keyCode == 13
			|| event.key === 'Enter') {
			// Enter pressed so trigger submit
			const {name, value} = event.target;
            if (name == 'nozzleTemperature'){
                gcodeBuilder.setTemperature(this.state.nozzleTemperature,true, 1);
            } 
            else if (name == 'wrapperTemperature') {
                gcodeBuilder.setTemperature(this.state.wrapperTemperature, true, 0);
            } 
            else if (name == 'collectorSpeed') {
                if (this.state.collectorDirection == 'clockwise') {
                    gcodeBuilder.setSpindleSpeed(this.state.collectorSpeed, true)
                } else {
                    gcodeBuilder.setSpindleSpeed(this.state.collectorSpeed, false)
                }
            } 
            this.handleSubmitCommand(event, gcodeBuilder.toGcodeString())
		}
	}

    render() {
        const renderedMaterialItems = this.getRenderedMaterialItems();
        return (
            <Box
            component="form"
            sx={{
                '& .MuiTextField-root': {m: 0, width: '100%' },
            }}
            noValidate
            autoComplete="off"
            > 
                <p><b>Setup</b></p>
                <Button
                    size="medium"
                    variant="outlined"
                    onClick={this.handleHomeAllClick} > 
                    Home All
                </Button>
                <Stack
                    direction="row"
                    justifyContent="center"
                    alignItems="center"
                    spacing={1}
                >
                    <p>Extruder: </p>
                    <TextField
						label="Temperature"
                        name="nozzleTemperature"
                        type="number"
						size="small"
						color="primary"
						margin="dense"
						value={this.state.nozzleTemperature}
						disabled={!this.props.isEnabled}
                        onChange={this.handleOnChange}
                        onKeyUp={this.handleOnKeyUp}
						/> 
                    <p>Wrapper: </p>
                    <TextField
						label="Temperature"
                        name="wrapperTemperature"
                        type="number"
						size="small"
						color="primary"
						margin="dense"
						value={this.state.wrapperTemperature}
						disabled={!this.props.isEnabled}
                        onChange={this.handleOnChange}
                        onKeyUp={this.handleOnKeyUp}
						/>                 
                </Stack>
                <Stack
                    direction="row"
                    justifyContent="center"
                    alignItems="center"
                    spacing={1}>
                    <p>Collector: </p>
                    <TextField
                        name="collectorSpeed"
						label="Speed"
						size="small"
                        type="number"
						color="primary"
						margin="dense"
						value={this.state.collectorSpeed}
						disabled={!this.props.isEnabled}
                        onChange={this.handleOnChange}
                        onKeyUp={this.handleOnKeyUp}
						/>  
                    <ToggleButtonGroup
                        name="collectorDirection"
                        label="Direction"
                        value={this.state.collectorDirection}
                        color="primary"
                        onChange={this.handleOnDirectionChange}
                        disabled={!this.props.isEnabled}
                        exclusive>
                        <ToggleButton value="clockwise">
                            <RotateRightIcon />
                        </ToggleButton>
                        <ToggleButton value="counterclockwise">
                            <RotateLeftIcon />
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Stack>
                <FormControl size="small" sx={{mb:1, mr: 1, minWidth: 300 }}>
                    <InputLabel id="material-label">Material</InputLabel>
                    <Select
                        labelId="material"
                        id="material-select"
                        label="Material"
                        value={this.state.selectedMaterial}
                        onChange={this.handleOnSelectMaterial}>
                        {renderedMaterialItems}
                    </Select>
                </FormControl>
                <Button
                    variant="outlined"
                    size="medium"
                    disabled={!this.props.isEnabled}
                    color={(this.state.pullDownInProgress) ? "error" : "success"}
                    onClick={(this.state.pullDownInProgress)
                        ? this.handleStopPullDownClick
                        : this.handleStartPullDownClick} > 
                    {this.state.pullDownInProgress
                        ? 'Stop pull-down'
                        : 'Start pull-down'}
                </Button>
            </Box>
        )
    }
}

export default SetupParamSubmitter;