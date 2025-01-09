// File Extension
export const GCODE_FILE_EXTENSION = ".gcode";

// Various GCode Commands
export const CMD_CHANGE_TOOL = 'T';

export const CMD_DISABLE_MOTORS = 'M86';
export const CMD_ENABLE_FAN = 'M106';
export const CMD_DISABLE_FANS = 'M107';

export const CMD_HOME_AXES = 'G28';

export const CMD_MOVE_G0 = 'G0';
export const CMD_MOVE = 'G1';

export const CMD_POWER_SUPPLY_ON = 'M80';

export const CMD_RESET_EXTRUSION_DISTANCE = 'G92';

export const CMD_SET_TEMPERATURE = 'M104';
export const CMD_SET_TEMPERATURE_AND_WAIT = 'M109';
export const CMD_SET_UNITS_MM = 'G21';

export const CMD_USE_ABSOLUTE_COORDINATES = 'G90';
export const CMD_USE_RELATIVE_COORDINATES = 'G91';

export const CMD_USE_ABSOLUTE_DISTANCES_FOR_EXTRUSION = 'M82';
export const CMD_USE_RELATIVE_DISTANCES_FOR_EXTRUSION = 'M83';

export const CMD_SET_SPINDLE_SPEED_CW = 'M3';
export const CMD_SET_SPINDLE_SPEED_CCW = 'M4';
export const CMD_SET_SPINDLE_SPEED_OFF = 'M5';

export const CMD_COLD_EXTRUSION = 'M302';

// Marlin shutdown and halt - https://marlinfw.org/docs/gcode/M112.html
// Note requires space in the buffer!
export const CMD_FULL_SHUTDOWN = 'M112';

// GCode Parameters
export const PARAM_X = 'X';
export const PARAM_Y = 'Y';
export const PARAM_Z = 'Z';
export const PARAM_E = 'E';
export const PARAM_F = 'F';
export const PARAM_T = 'T';
export const PARAM_S = 'S';
export const PARAM_P = 'P';

// Uses to affix a comment to a line  in the file
export const COMMENT_PREFIX = ';';

// Spacer for multiple commands in a string
export const PARAMETER_SEPARATOR = ' ';

export const NEW_LINE = '\r\n';
