const MiscUtil = {};

MiscUtil.calculateCommandTimeInMiliSec = function(eValue, xValue, compositeFeedrate) {
    return Math.floor((Math.sqrt(Math.pow(eValue, 2) + Math.pow(xValue, 2)) / compositeFeedrate) * 60 * 1000);
}

export default MiscUtil;