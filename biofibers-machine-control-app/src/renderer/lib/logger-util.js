import * as APP_SETTINGS from '../app-settings'

// Check if app is packaged for logging
const { ipcRenderer } = require('electron');
let isPackaged = true;
ipcRenderer.invoke('BFMAIN_isPackaged').then((result) => {
  	isPackaged = result;
});

const LOG_TAG_DELIMITER = ":";

export function logD(...info) {
    if (APP_SETTINGS.DEBUG_MODE && !isPackaged) {
	    console.log(`DEBUG${LOG_TAG_DELIMITER}`, ...info);
    }
};

export function logE(...info) {
	console.error(`ERROR${LOG_TAG_DELIMITER}`, ...info);
};

export function logW(...info) {
	console.warn(`WARNING${LOG_TAG_DELIMITER}`, ...info);
};

export function logI(...info) {
	console.info(`INFO${LOG_TAG_DELIMITER}`, ...info);
};

export function log(...info) {
	console.log(`App${LOG_TAG_DELIMITER}`, ...info);
};
