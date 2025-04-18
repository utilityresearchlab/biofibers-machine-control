// Used to determine temperature response commands and their parameters
const TEMP_RESPONSE_PARAM_REGEX =  /([T]\d*):([\d.]+)\s*\/\s*([\d.]+)/g;

// Enum-like object to signal what our response type is
const RESPONSE_TYPE = {
    UNKNOWN: 0,
    TEMPERATURE_STATUS: 1,
    ERROR: 999,
};

// Parses responses to g-code commands sent from the machine
const parseResponse = (() => {
        // Removes all white space in a command
    const stripWhitespace = (() => {
        const whitespaceRe = /\s+/igm;
        return (line => line.replace(whitespaceRe, ''));
    })();

    return (line, options) => {
        options = options || {};
        options.flatten = !!options.flatten;
        options.noParseLine = !!options.noParseLine;
        line = line.trim();
        const result = {
            line: line,
            parsedData: null,
            responseType: RESPONSE_TYPE.UNKNOWN
        };

        if (options.noParseLine) {
            return result;
        }
        // Check if temp response
        if (TEMP_RESPONSE_PARAM_REGEX.test(line)) {
            result.parsedData = parseTempResponse(line);
            result.responseType = RESPONSE_TYPE.TEMPERATURE_STATUS;
        }
        return result;
    };
})();

function parseTempResponse(line) {
    // Response format: ' T:25.00 /0.00 T0:25.00 /0.00 T1:25.00 /0.00 @:0 @0:0 @1:0'
    //      - Active temp is first: T: ../ ...
    //      - T{#}: ##.## / ##.## for each temp sensor, where"
    //           T# is the temp sensor for tool {#}
    //           ##.## is the current temperature
    //           / ##.## is the set point temperature
    //     - @: indicates the current PID pwm on/off value   
    //     - @{#}: indicated the current PID pwm on/off value for each heater at index {#} 
    if (!line) {
        return [];
    }
    let match;
    const result = [];
    while ((match = TEMP_RESPONSE_PARAM_REGEX.exec(line)) !== null) {
        result.push({
            tool: match[1],         // Tool number (e.g., T, T0, T1)
            currentTemp: match[2],  // Current Temp (e.g., 25.00)
            setPointTemp: match[3]  // Setpoint Temp (e.g., 0.00)
        });
    }
    return result;
}

export {
    parseResponse,
    RESPONSE_TYPE
};
