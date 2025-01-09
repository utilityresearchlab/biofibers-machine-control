
// Constrains a value between a [min, max] range
function constrain(value, min, max) {
	value = value < min ? min : (value > max ? max : value);
	return value;
}

export default {constrain};