import * as React from 'react';

import Box from '@mui/material/Box';

class SpinningParamSubmitter extends React.Component {
    constructor(props) {
        super(props);
        this.state = {

        }
        // this.handleSubmit = this.handleSubmitCommand.bind(this);
        this.handleOnChange = this.handleOnChange.bind(this);
    }

    handleOnChange(event) {
        const {name, value} = event.target;
        console.log(name);
        this.setState({
            ...this.state,
            [name]: Number(value)
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
                <p><b>Spinning</b></p>
            </Box>
        )
    }
}

export default SpinningParamSubmitter;

