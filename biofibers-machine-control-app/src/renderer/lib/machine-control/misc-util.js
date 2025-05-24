import * as BF_CONSTANTS from '../biofibers-machine/biofibers-machine-constants'


const MiscUtil = {};

MiscUtil.calculateCommandTimeInMilliSec = function(eValue, xValue, compositeFeedrate) {
    return Math.floor((Math.sqrt(Math.pow(eValue, 2) + Math.pow(xValue, 2)) / compositeFeedrate) * 60 * 1000);
};


MiscUtil.calculateXFeedrate = function(eValue, eFeedrate, xValue=0) {
    // If no extrusion simply use the default X feed rate
    if (eValue == 0) {
        return BF_CONSTANTS.X_AXIS_DEFAULT_FEED_RATE_SLOW;
    }
    // If no e-feed rate, use default X feedrate
    if (eFeedrate == 0) {
        return BF_CONSTANTS.X_AXIS_DEFAULT_FEED_RATE_SLOW;
    }
    if (xValue == 0) {
        return 0;
    }
    return xValue * (eFeedrate / eValue);
}

MiscUtil.getCompositeFeedrate = function(...values) {
    if (!values || values.length == 0) {
        return 0;
    }
    if (values.length == 1) {
        return values[0];
    }
    const squared = values.reduce((acc, curr,) => {
        return Math.pow(curr, 2) + acc;
    }, 0);
    return Math.sqrt(squared);
}
export default MiscUtil;