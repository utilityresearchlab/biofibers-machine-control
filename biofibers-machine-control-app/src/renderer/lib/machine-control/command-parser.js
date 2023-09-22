
// @param {string} line The machine command line
// Note: A line could contain multiple commands "[R,100][X]"
// @return An array of arrays that each contain a command or a command and it's parameters
// TODO (mrivera): Replace this with gcode parser 
import { MACHINE_COMMANDS } from "./machine-protocol";

// For example: the input "[X]" => [["X"]] and "[R,100][X]" => [["R", 100], ["X"]]
const parseLine = (() => {
		// Removes all white space in a command
    const stripWhitespace = (() => {
				const whitespaceRe = /\s+/igm;
        return (line => line.replace(whitespaceRe, ''));
    })();

		const removeNewLines = (() => {
			const newlineRe = /\r?\n|\r/igm;
			return (line => line.replace(newlineRe, ''));
		})();

		const splitCommandsInBrackets =  (() => {
				const cmdRe = /\[.*?\]/igm;
				return (line => line.match(cmdRe, ''));
		})();

		const replaceBrackets = (() => {
			const bracketsRe = /[\[\]']+/gm;
			return (line => line.replace(bracketsRe, ''));
		})();

		// Matches commands formatted like: [R], [R,1] etc.
    const re = /\[([A-Za-z]+)((,.*)?)\]/igm;

    return (line, options) => {
				//console.log(line);
        options = options || {};
        options.flatten = !!options.flatten;
        options.noParseLine = !!options.noParseLine;

        const result = {
            line: line
        };

        if (options.noParseLine) {
            return result;
        }


				const cmdsInBrackets = splitCommandsInBrackets(removeNewLines(line.trim())) || [];
				const cmds = cmdsInBrackets.map((item, idx) => {
					return replaceBrackets(item);
				});

				result.words = [];
				for (let i = 0; i < cmds.length; i++) {
					// Go through cmds, split on comma, parse parameters if necessary
					const cmd = cmds[i];
					// If only a single char, that's the command [R] => "R"
					if (cmd.length == 1) {
						result.words.push([[cmd[0].trim()]]);
					} else {
						// More than 1 char, with a comma separator [R,10] => ["R", "10"]
						const splitCmd = cmd.split(',');
						const letter = splitCmd[0].toUpperCase().trim();
						const params = splitCmd.slice(1).map((param, idx) => {
							let trimmedParam = param.trim();
							let value = Number(param);
							if (Number.isNaN(value) || letter == MACHINE_COMMANDS.DEBUG) {
								value = param;
							}
							return value;
						});
						if (options.flatten) {
							result.words.push(letter + params);
						} else {
							result.words.push([letter, ...params]);
						}
					}
				}
				console.log(result);
        // Line number
        (typeof (ln) !== 'undefined') && (result.ln = ln);
        return result;
    };
})();



export {
	parseLine,
};
