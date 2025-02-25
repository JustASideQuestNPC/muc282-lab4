interface ControlBind {
    keyboard: string[],
    gamepad: string[]
}

const CONTROL_BINDS: {[key: string]: ControlBind} = {
    accelerate: {
        keyboard: [],
        gamepad: []
    },
    brake: {
        keyboard: [],
        gamepad: []
    },
    "turn left": {
        keyboard: [],
        gamepad: []
    },
    "turn right": {
        keyboard: [],
        gamepad: []
    },
    boost: {
        keyboard: [],
        gamepad: []
    }
};

const USER_CONFIG = {
    CONTROL_BINDS: CONTROL_BINDS
};
export default USER_CONFIG;