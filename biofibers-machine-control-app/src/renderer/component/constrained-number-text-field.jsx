import * as React from 'react';
import TextField from '@mui/material/TextField';

import MathUtil from '../lib/math-util'

class ConstrainedNumberTextField extends React.Component {  

    constructor(props) {
        // props.min = props.min ? props.min : 0;
        // props.max = props.max ? props.max : Number.MAX_SAFE_INTEGER;
        super(props);
        this.handleOnChange = this.handleOnChange.bind(this);
        this.handleOnKeyUp = this.handleOnKeyUp.bind(this);

    }

    handleOnChange(evt) {
        const constrainedValue = MathUtil.constrain(Number(evt.target.value), this.props.min, this.props.max);
        console.log(constrainedValue);
        if (!this.props.onChange) {
            return;
        }
        evt.target.value = constrainedValue;
        this.props.onChange(evt);
    }

    handleOnKeyUp(evt) {
        const constrainedValue = MathUtil.constrain(evt.target, this.props.min, this.props.max);
        if (!this.props.onKeyUp) {
            return;
        }
        evt.target.value = constrainedValue;
        this.props.onKeyUp(evt);
    }

    render() {
        return (
            <TextField
                type='number'
                name={this.props.name}
                label={this.props.label}
                value={this.props.value}
                size={this.props.size}
                min={this.props.min}
                max={this.props.max}
                onKeyUp={this.handleOnKeyUp}
                onChange={this.handleOnChange} />
        );
    }
// <!-- <TextField
//                             label="Nozzle Temp. [ºC]"
//                             name="nozzleTemperature"
//                             type="number"
//                             size="small"
//                             color="primary"
//                             sx={{minWidth: 150, maxWidth: 150}}
//                             value={this.state.nozzleTemperature}
//                             disabled={!this.props.isEnabled}
//                             onChange={this.handleOnChange}
//                             onKeyUp={this.handleOnKeyUp}
//                             inputProps={{min: BF_CONSTANTS.EXTRUDER_TEMPERATURE_MIN, max: BF_CONSTANTS.EXTRUDER_TEMPERATURE_MAX}}
//                             /> -->
}

export default ConstrainedNumberTextField;
