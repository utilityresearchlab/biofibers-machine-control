
// Constrains a value between a [min, max] range
function constrain(value, min, max) {
	value = value < min ? min : (value > max ? max : value);
	return value;
}


// Counts the number of decimals in a number/string 
function countDecimals(value) {
	if (value === null || value == '') {
		return 0;
	}
	if (Math.floor(value.valueOf()) === value.valueOf()) {
		return 0;
	}
	const str = value.toString();
	if (str.indexOf(".") !== -1 && str.indexOf("-") !== -1) {
		return str.split("-")[1] || 0;
	} else if (str.indexOf(".") !== -1) {
		return str.split(".")[1].length || 0;
	}
	return str.split("-")[1] || 0;
}

function toMinimumPrecision(value, maxPrecision=5) {
	if (value === null || value == '') {
		return '';
	}
	const decimalCount = countDecimals(value);
	if (decimalCount == 0) {
		// No decimals - then just return the number
		return value;
	}
	return value.toFixed(Math.min(maxPrecision, decimalCount));
}

export default {constrain, toMinimumPrecision};

