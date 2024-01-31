
import * as GCODE_CONSTANTS from './gcode-constants.js'

export class GcodeBuilder {

    constructor() {
        /**
         * command = {
         *    'code': 'G1',
         *    'params: { 'X': 10.00},
         *    'comment': 'this is some text'
         *  }
         */
        this.commands = []
        this._debugOutput = false
    }

    toGcode() {
        let cmdsList = []
        for (const cmd of this.commands) {
            let cmdStr = this._concatCommand(cmd.code, cmd.params, cmd.comment)
            cmdsList.push(cmdStr)
        }
        if (this._debugOutput) {
            console.log(cmdsList)
        }
        return cmdsList
    }

    toGcodeString(){
        let cmdsList = this.toGcode()
        // todo (mrivera): use new line for OS ?
        let cmdsOut = cmdsList.join(GCODE_CONSTANTS.NEW_LINE)
        if (this._debugOutput) {
            console.log(cmdsOut)
        }
        return cmdsOut
    }

    _getCommandObj(cmd='', params=null, comment=null) {
        let cmdObj = {'code': cmd}
        if (params) {
            cmdObj['params'] = params
        }
        if (comment && comment.length > 0) {
            cmdObj['comment'] = comment
        }
        return cmdObj
    }

    _concatParam(paramName, paramValue='') {
        let formattedParamValue = ''
        if (typeof(paramValue) == 'number') {
            if (paramValue === 0) {
                // Handle "-0" cases
                formattedParamValue = "0"
            } else {
                let isFloat = (Math.abs(paramValue - Math.round(paramValue))) > 0
                formattedParamValue = isFloat ? paramValue.toFixed(9) : paramValue.toString()
            }
        } else {
            formattedParamValue = paramValue.toString()
        }
        return paramName.toString().toUpperCase() + formattedParamValue
    }

    _concatCommand(cmd='', params={}, comment='') {
        let line = cmd
        for (const [paramKey, paramValue] of Object.entries(params)) {
            // Produces e.g.,' X0.00'
            if (paramKey != null && paramValue != null) {
                // Some commands are literally just "parameters" like tool changes
                // So we exclude the spacer at the beginning if there's not special
                let paramSeparator = (line.length > 0)
                    ? GCODE_CONSTANTS.PARAMETER_SEPARATOR
                    : ''
                line +=  paramSeparator + this._concatParam(paramKey, paramValue)
            }
        }
        if (comment.length > 0) {
            line += this._concatComment(comment)
        }
        return line
    }


    _concatComment(comment) {
        return '' + GCODE_CONSTANTS.COMMENT_PREFIX + ' ' + comment.toString()
    }

    _appendCommand(cmd, params=null, comment=null) {
        let cmdObj = this._getCommandObj(cmd, params, comment)
        this.commands.push(cmdObj)
    }

    reset() {
        this.commands = []
        return this
    }

    // get debugOutput() {
    //     return this._debugOutput
    // }

    set debugOutput(value=true) {
        this._debugOutput = value
        return this
    }


    endSection() {
        this._appendCommand('', null, '-------------')
        return this
    }

    comment(commentText) {
        this._appendCommand('', null, commentText)
        return this
    }

    _getMoveParams(axis, value, feedrate=null) {
        let moveParams = {}
        moveParams[axis] = value
        if (feedrate) {
            moveParams['F'] = feedrate
        }
        return moveParams
    }

    moveX(value, feedrate=null, comment=null) {
        this.move(this._getMoveParams('X', value, feedrate), comment)
        return this
    }

    moveY(value, feedrate=null, comment=null) {
        this.move(this._getMoveParams('Y', value, feedrate), comment)
        return this
    }

    moveZ(value, feedrate=null, comment=null) {
        this.move(this._getMoveParams('Z', value, feedrate), comment)
        return this
    }

    moveE(value, feedrate=null, comment=null) {
        this.move(this._getMoveParams('E', value, feedrate), comment)
        return this
    }

    setFeedRate(value, comment=null) {
        this.move({'F': value}, comment=null)
        return this
    }

    move(axisToValueDic, comment=null) {
        this._appendCommand(GCODE_CONSTANTS.CMD_MOVE, axisToValueDic, comment)
        return this
    }

    homeX(comment='home x') {
        this._home(['X'], comment)
        return this
    }

    homeY(comment='home y') {
        this._home(['Y'], comment)
        return this
    }

    homeZ(comment='home z') {
        this._home(['Z'], comment)
        return this
    }

    homeXY(comment='home xy') {
        this._home(['X', 'Y'], comment)
        return this
    }

    homeAll(comment='home all') {
        this._home([], comment)
        return this
    }
    /**
     *
     */
    _home(axes=[], comment='') {
        var homeParams = {}
        for (const axis of axes) {
            homeParams[axis] = 0
        }
        this._appendCommand(GCODE_CONSTANTS.CMD_HOME_AXES, homeParams, comment)
        return this
    }

    changeTool(toolIndex, comment='tool change') {
        const toolChangeParam = {}
        toolChangeParam[GCODE_CONSTANTS.CMD_CHANGE_TOOL] = toolIndex
        this._appendCommand('', toolChangeParam, comment)
        return this
    }

    extrude(value, feedrate=null, comment='') {
        this.moveE(value.toFixed(4), feedrate, comment)
        return this
    }

    extrudeWhileMoveX(value, xValue, compositeFeedrate, comment='') {
        this.move({'X': xValue, 'E': value.toFixed(4), 'F': compositeFeedrate.toFixed(4)}, comment)
        return this
    }

    retract(value, feedrate=null, comment='retract') {
        value = (value > 0) ? -1 * value : value
        this.moveE(value, feedrate, comment)
        return this
    }

    unretract(value, feedrate=null, comment='unretract') {
        value = (value < 0) ? -1 * value : value
        this.moveE(value, feedrate, comment)
        return this
    }

    resetExtrusionDistance() {
        this._appendCommand(GCODE_CONSTANTS.CMD_RESET_EXTRUSION_DISTANCE, {'E': 0}, 'reset extrusion distance')
        return this
    }

    powerSupplyOn() {
        this._appendCommand(GCODE_CONSTANTS.CMD_POWER_SUPPLY_ON, null, 'power supply on')
        return this
    }

    enableFan(fanSpeed=null, fanIndex=null) {
        let hasParams = (fanSpeed != null || fanIndex != null)
        let params = (hasParams) ? {} : null

        if (fanIndex != null) {
            params[GCODE_CONSTANTS.PARAM_P] = fanIndex
        }

        if (fanSpeed != null) {
            // Constrain fan speed
            if (fanSpeed < 0) {
                fanSpeed = 0
            } else if (fanSpeed > 255) {
                fanSpeed = 255
            }
            params[GCODE_CONSTANTS.PARAM_S] = fanSpeed
        }

        this._appendCommand(GCODE_CONSTANTS.CMD_ENABLE_FAN, params, 'enable fan')
        return this
    }

    disableFan(fanIndex=null) {
        let params = null
        if (fanIndex != null) {
            params = {}
            params[GCODE_CONSTANTS.PARAM_P] = fanIndex
        }
        this._appendCommand(GCODE_CONSTANTS.CMD_DISABLE_FANS, params, 'disable fan')
        return this
    }

    disableMotors() {
        this._appendCommand(GCODE_CONSTANTS.CMD_DISABLE_MOTORS, null, 'disable motors')
        return this
    }

    setUnitsToMillimeters() {
        this._appendCommand(GCODE_CONSTANTS.CMD_SET_UNITS_MM, null, 'set units to millimeters')
        return this
    }

    useAbsoluteCoordinates() {
        this._appendCommand(GCODE_CONSTANTS.CMD_USE_ABSOLUTE_COORDINATES, null, 'use absolute coordinates')
        return this
    }

    userRelativeCoordinates() {
        this._appendCommand(GCODE_CONSTANTS.CMD_USE_RELATIVE_COORDINATES, null, 'use relative coordinates')
        return this
    }

    useAbsoluteExtrusionDistances() {
        this._appendCommand(GCODE_CONSTANTS.CMD_USE_ABSOLUTE_DISTANCES_FOR_EXTRUSION, null, 'use absolute extrusion distances')
        return this
    }

    useRelativeExtrusionDistances() {
        this._appendCommand(GCODE_CONSTANTS.CMD_USE_RELATIVE_DISTANCES_FOR_EXTRUSION, null, 'use relative extrusion distances')
        return this
    }

    setTemperature(value, shouldWait=false, toolIndex=null) {
        let tempParams = {'S': value}
        if (toolIndex !== null) {
            tempParams['T'] = toolIndex
        }
        let cmd = (shouldWait) ? GCODE_CONSTANTS.CMD_SET_TEMPERATURE_AND_WAIT : GCODE_CONSTANTS.CMD_SET_TEMPERATURE
        this._appendCommand(cmd, tempParams, (shouldWait) ? 'set temperature and wait' : 'set temperature')
        return this
    }

    disableTemperature() {
        this.setTemperature(0, false)
        return this
    }

    setEnableColdExtrusion(isEnabled) {
        let params = {}
        params[GCODE_CONSTANTS.PARAM_P] = isEnabled ? '1' : '0'
        this._appendCommand(GCODE_CONSTANTS.CMD_COLD_EXTRUSION, params, isEnabled ? 'enable cold extrusion' : 'disable cold extrusion')
        return this
    }

    enableColdExtrusion() {
        this.setEnableColdExtrusion(true)
        return this
    }

    disableColdExtrusion() {
        this.setEnableColdExtrusion(false)
        return this
    }

    setSpindleSpeed(value, clockwise=true) {
        let speedParams = {'S': value}
        let cmd = (clockwise) ? GCODE_CONSTANTS.CMD_SET_SPINDLE_SPEED_CW : GCODE_CONSTANTS.CMD_SET_SPINDLE_SPEED_CCW
        this._appendCommand(cmd, speedParams, (clockwise) ? 'set spindle rotation clockwise' : 'set spindle rotation counterclockwise')
        return this
    }
}
