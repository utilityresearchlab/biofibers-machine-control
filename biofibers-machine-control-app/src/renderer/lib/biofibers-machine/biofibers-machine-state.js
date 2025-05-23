
import * as BF_CONSTANTS from './biofibers-machine-constants'

const MACHINE_STATE_IS_DISCONNECTED = 0x00;
const MACHINE_STATE_IS_CONNECTED = 0x01;
const MACHINE_STATE_IS_SPINNING = 0x02; 
const MACHINE_STATE_IS_PULLING_DOWN = 0x04; 
const MACHINE_STATE_IS_EMERGENCY_STOPPED = 0x80;

export class BiofibersMachineState {
   
    constructor() {
        this._state = MACHINE_STATE_IS_DISCONNECTED;
        this._currentHeaterWrapTemp = BF_CONSTANTS.HEATER_WRAP_TEMPERATURE_MIN;
        this._setPointHeaterWrapTemp = 0;
        
        this._currentNozzleTemp = BF_CONSTANTS.EXTRUDER_TEMPERATURE_MIN;
        this._setPointNozzleTemp = 0;

    }

    setCurrentNozzleTemp(temp=BF_CONSTANTS.EXTRUDER_TEMPERATURE_MIN, setPointTemp=null) {
        this._currentNozzleTemp = temp;
        if (setPointTemp != null) {
            this._setPointNozzleTemp = setPointTemp;
        }
    }

    setNozzleTempSetPoint(setPointTemp) {
        this._setPointNozzleTemp = setPointTemp;
    }

    getCurrentNozzleTemp() {
        return this._currentNozzleTemp;
    }

    getSetpointNozzleTemp() {
        return this._setPointNozzleTemp;
    }

    setCurrentHeaterWrapTemp(temp=BF_CONSTANTS.HEATER_WRAP_TEMPERATURE_MIN, setPointTemp=null) {
        this._currentHeaterWrapTemp = temp;
        if (setPointTemp != null) {
            this._setPointHeaterWrapTemp = setPointTemp;
        }
    }
    setHeaterWrapTempSetPoint(setPointTemp) {
        this._setPointHeaterWrapTemp = setPointTemp;
    }

    getCurrentHeaterWrapTemp() {
        return this._currentHeaterWrapTemp;
    }

    getSetpointHeaterWrapTemp() {
        return this._setPointHeaterWrapTemp;
    }

    isHeatingOn() {
        return this._setPointHeaterWrapTemp > 0 || this._setPointNozzleTemp > 0;
    }

    resetHeatingState() {
        this._currentHeaterWrapTemp = BF_CONSTANTS.HEATER_WRAP_TEMPERATURE_MIN;
        this._setPointHeaterWrapTemp = 0;
        
        this._currentNozzleTemp = BF_CONSTANTS.EXTRUDER_TEMPERATURE_MIN;
        this._setPointNozzleTemp = 0;
    }

    setMachineDisconnected() {
        this._state = MACHINE_STATE_IS_DISCONNECTED;
        this.resetHeatingState();
    }

    setMachineConnected() {
        this._state = MACHINE_STATE_IS_CONNECTED;
        this.resetHeatingState();
    }

    setMachineEmergencyStopped() {
        this._state |= MACHINE_STATE_IS_EMERGENCY_STOPPED;
        this.setMachineIsPullingDown(false);
        this.setMachineIsSpinning(false);
        this.resetHeatingState();
    }
    
    setMachineIsSpinning(isOn) {
        if (isOn) {
            this._setBitOff(MACHINE_STATE_IS_PULLING_DOWN);
            this._setBitOn(MACHINE_STATE_IS_SPINNING);
        } else {
            this._setBitOff(MACHINE_STATE_IS_SPINNING);
        }
    }

    setMachineIsPullingDown(isOn) {
        if (isOn) {
            this._setBitOff(MACHINE_STATE_IS_SPINNING);
            this._setBitOn(MACHINE_STATE_IS_PULLING_DOWN);
        } else {
            this._setBitOff(MACHINE_STATE_IS_PULLING_DOWN);
        }
    }

    isMachineSpinning() {
        return this._isBitOn(MACHINE_STATE_IS_SPINNING);
    }

    isMachinePullingDown() {
        return this._isBitOn(MACHINE_STATE_IS_PULLING_DOWN);
    }

    isMachineConnected() {
        return this._isBitOn(MACHINE_STATE_IS_CONNECTED);
    }

    isMachineDisconnected() {
        return !this.isMachineConnected();
    }

    isMachineEmergencyStopped() {
       return this._isBitOn(MACHINE_STATE_IS_EMERGENCY_STOPPED);
    }

    // Internal methods
    _setBitOn(s) {
        // Bitwise OR
        this._state |= s;
    }

    _setBitOff(s) {
        // Bitwise AND with NOT(S)
        this._state &= ~s;
    }

    _isBitOn(s) {
        // Bitwise AND and comparison
        return (this._state & s) == s;
    }

    _isBitOff(s) {
        // Bitwise AND and comparison
        return !this._isBitOn(s);
    }

}
