// Command delimiters
// #define CMD_DELIM_BEGIN '['
// #define CMD_DELIM_END   ']'
// #define CMD_DELIM_PARAM ','

// Commands (settings)
// #define CMD_DELIVERY_SPEED 'D'  // [D]elivery
// #define CMD_SPINDLE_SPEED  'P'  // s[P]indle
// #define CMD_ELEVATOR_SPEED 'L'  // e[L]evator

// Commands (spin)
// #define CMD_RUN            'R'  // [R]un
// #define CMD_STOP           'S'  // [S]top

// Commands (other)
// #define CMD_PING           'A'
// #define CMD_INFO           'I'  // [I]nfo
// #define CMD_STATUS         'T'  // s[T]atus
// #define CMD_ELEVATOR_RESET 'V'  // ele[V]ate
// #define CMD_ELEVATOR_HOME  'H'  // [H]ome

// Error/Debug
// #define CMD_ERROR          'E'
// #define CMD_DEBUG          'X'

// Error codes
// #define ERR_BUFF_FULL       1   // buffer is full
// #define ERR_BEGIN_MISSING   2   // no begin delimiter
// #define ERR_END_MISSING     3   // no end delimiter
// #define ERR_DATA_SIZE       4   // command is too small (less than 3 bytes)
// #define ERR_DELIM           5   // unknow delimiter/character
// #define ERR_UNKNOWN_CMD     6   // unknown command
// #define ERR_PARAM_COUNT     7   // wrong number of parameters
// #define ERR_VALUE_SPEED     8   // speed value invalid or speed value pair inconsistent
// #define ERR_BUSY            9   // machine is busy (spinning or resetting)
// #define ERR_NO_DEBUG       10   // firmware isn't debug-able

const MACHINE_DELIMITERS = {};
MACHINE_DELIMITERS.CMD_START = 		'[';
MACHINE_DELIMITERS.CMD_END = 			']';
MACHINE_DELIMITERS.PARAMETERS = 		',';

// Machine Commands and Responses
const MACHINE_COMMANDS = {};
MACHINE_COMMANDS.STOP =				'S';
MACHINE_COMMANDS.RUN = 				'R';

MACHINE_COMMANDS.SET_DELIVERY_SPEED = 	'D';
MACHINE_COMMANDS.SET_SPINDLE_SPEED = 	'P';
MACHINE_COMMANDS.SET_ELEVATOR_SPEED = 	'L';

MACHINE_COMMANDS.RESET_ELEVATOR =		'V';
MACHINE_COMMANDS.HOME_ELEVATOR =		'H';

MACHINE_COMMANDS.PING = 				'A';
MACHINE_COMMANDS.GET_STATUS = 			'T';
MACHINE_COMMANDS.REQUEST_INFO = 		'I';

MACHINE_COMMANDS.ERROR = 				'E';
MACHINE_COMMANDS.DEBUG = 				'X';
MACHINE_COMMANDS.SUCCESS =				'O';


// MACHINE_COMMANDS.ALL_COMMANDS = (() => {
// 	return Object.keys(MACHINE_COMMANDS)
// 		.map((item) => {
// 			return MACHINE_COMMANDS[item];
// 		});
// })();
MACHINE_COMMANDS.ALL_COMMANDS = Object.values(MACHINE_COMMANDS);

// Force commands to be immutable
Object.freeze(MACHINE_COMMANDS);

// Error codes
const MACHINE_ERROR_CODES = {};
MACHINE_ERROR_CODES.UNDEFINED = 			 -1;	// Undefined error code
MACHINE_ERROR_CODES.BUFFER_FULL =			  1;	// buffer is full
MACHINE_ERROR_CODES.BEGIN_MISSING = 		  2;	// no begin delimiter
MACHINE_ERROR_CODES.END_MISSING = 			  3;	// no end delimiter
MACHINE_ERROR_CODES.DATA_SIZE  = 			  4;	// command is too small (less than 3 bytes)
MACHINE_ERROR_CODES.ERR_DELIM = 			  5;  // unknown delimiter/character
MACHINE_ERROR_CODES.ERR_UNKNOWN_CMD = 	      6;	// invalid command
MACHINE_ERROR_CODES.ERR_PARAM_COUNT = 		  7;	// wrong number of parameters
MACHINE_ERROR_CODES.ERR_VALUE_SPEED = 		  8; 	// speed value invalid or speed value pair inconsistent
MACHINE_ERROR_CODES.ERR_BUSY =			      9; 	// machine is busy (spinning or resetting)
MACHINE_ERROR_CODES.ERR_NO_DEBUG =	 		 10;	// firmware isn't debug-able

MACHINE_ERROR_CODES.ALL_ERRORS = (() => {
	return Object.keys(MACHINE_ERROR_CODES)
		.map((item) => {
			return MACHINE_ERROR_CODES[item];
		});
})();

// Force commands to be immutable
Object.freeze(MACHINE_ERROR_CODES);

export {MACHINE_DELIMITERS, MACHINE_COMMANDS, MACHINE_ERROR_CODES};
