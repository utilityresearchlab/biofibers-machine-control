/**
 * This class builds gcode commands for common tasks done on the biofber machine.
 */
const getHomeAllCommand = () => {
    return "G28";
};

export {getHomeAllCommand}