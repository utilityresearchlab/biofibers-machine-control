
function getReadableTimeOfDay(timestamp) {
	const dt = new Date(timestamp);
	const hours = String(dt.getHours()).padStart(2, '0');
	const minutes = String(dt.getMinutes()).padStart(2, '0');
	const seconds = String(dt.getSeconds()).padStart(2, '0');
 	const timeString = `${hours}:${minutes}:${seconds}`;
	return timeString;
}

export default getReadableTimeOfDay;
