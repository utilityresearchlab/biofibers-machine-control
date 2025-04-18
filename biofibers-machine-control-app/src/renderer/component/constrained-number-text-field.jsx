import * as React from 'react';

import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
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

    enforceConstraints(value, event=null, callback=null) {
        value =  (value == null || value.length == 0) ? 0 : parseFloat(value);
        const constrainedValue = MathUtil.constrain(value, this.props.min, this.props.max);
        if (!callback) {
            return;
        }
        if (event) {
            event.target.value = constrainedValue;
            callback(event);
        } else {
            callback(constrainedValue);
        }
    }

    handleOnChange(event) {
        this.enforceConstraints(event.target.value, event, this.props.onChange);
    }
 
    handleOnKeyUp(event) {
        this.enforceConstraints(event.target.value, event, this.props.onKeyUp);
    }

    render() {
        let attrInputProps = {};
        if (this.props.inputUnits) {
            attrInputProps = {
                endAdornment: <InputAdornment position="end">{this.props.inputUnits}</InputAdornment>,
            };
        }
        return (
            <Box variant="div" sx={{display: 'flex'}}>
                <TextField
                    type='number'
                    color={this.props.color}
                    sx={{...this.props.sx}}
                    name={this.props.name}
                    label={this.props.label}
                    value={this.props.value}
                    size={this.props.size}
                    min={this.props.min}
                    max={this.props.max}
                    onKeyUp={this.handleOnKeyUp}
                    onChange={this.handleOnChange}
                    disabled={this.props.disabled}
                    inputProps={{min: this.props.min, max: this.props.max}}
                    InputProps={attrInputProps}
                    helperText={this.props.helperText}/>
            </Box>
        );
    }
}

export default ConstrainedNumberTextField;
