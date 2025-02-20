enum GpButton {
    /** X on Playstation controllers. */
    A,
    /** Circle on Playstation controllers. */
    B,
    /** Square on Playstation controllers. */
    X,
    /** Triangle on Playstation controllers. */
    Y,
    /** L1 on Playstation controllers. */
    LEFT_BUMPER,
    /** R1 on Playstation controllers. */
    RIGHT_BUMPER,
    /**
     * L2 on Playstation controllers. Active whenever the trigger is touched at all; use
     * `LEFT_TRIGGER_FULL_PULL` to check if it is held all the way down.
     */
    LEFT_TRIGGER,
    /**
     * R2 on Playstation controllers. Active whenever the trigger is touched at all; use
     * `RIGHT_TRIGGER_FULL_PULL` to check if it is held all the way down.
     */
    RIGHT_TRIGGER,
    SHARE,
    OPTIONS,
    /** L3 on Playstation controllers. */
    LEFT_STICK_CLICK,
    /** R3 on Playstation controllers */
    RIGHT_STICK_CLICK,
    DPAD_UP,
    DPAD_DOWN,
    DPAD_LEFT,
    DPAD_RIGHT,
    /** Xbox/Playstation logo button */
    HOME,
    /**
     * L2 on Playstation controllers. Only active when the trigger is all the way down; use
     * `LEFT_TRIGGER` to check if it is touched at all.
     */
    LEFT_TRIGGER_FULL_PULL,
    /**
     * R2 on Playstation controllers. Only active when the trigger is all the way down; use
     * `LEFT_TRIGGER` to check if it is touched at all.
     */
    RIGHT_TRIGGER_FULL_PULL
}

enum GpAxis {
    LEFT_STICK_X,
    LEFT_STICK_Y,
    RIGHT_STICK_X,
    RIGHT_STICK_Y,
    LEFT_TRIGGER,
    RIGHT_TRIGGER,
}

enum GpThumbstick { LEFT, RIGHT }

/**
 * Applies deadzone to an analog value. Both the input and output are between -1 and 1.
 */
function applyDeadzone(value: number, inner: number, outer: number): number {
    if (Math.abs(value) < inner) { return 0; }
    
    // storing the outer deadzone as distance from the edge is more intuitive
    outer = 1 - outer;
    if (Math.abs(value) > outer) { return (value < 0 ? -1 : 1); }
    else {
        const mapped = (1 / (outer - inner)) * (Math.abs(value) - inner);
        return value < 0 ? -mapped : mapped;
    }
}

/**
 * Manages input for a gamepad.
 */
class GamepadManager {
    // mildly cursed typescript to make the enums into properties
    /**
     * A button on the gamepad. Uses Xbox button names.
     */
    static readonly Button = GpButton;
    /**
     * An analog axis on the gamepad.
     */
    static readonly Axis = GpAxis;
    /**
     * A thumbstick on the gamepad.
     */
    static readonly Thumbstick = GpThumbstick;

    /** The JS Gamepad API object. */
    private gamepad: Gamepad = null;

    /**
     * Which gamepad to poll input from, useful for multiplayer games. If this is -1, any connected
     * gamepad will be used.
     */
    private _padIndex: number;

    /**
     * Inner deadzone for analog sticks - if the raw value is closer to 0 than this, it will be
     * snapped to 0.
     */
    innerDeadzone: number = 0.1;

    /**
     * Outer deadzone for analog sticks - if the raw value is closer to -1 or 1 than this, it will
     * be snapped to -1 or 1 respectively.
     */
    outerDeadzone: number = 0.05;

    /**
     * @param padIndex Which gamepad to poll input from. Useful for multiplayer games. If this is
     * -1, any connected gamepad will be used.
     */
    constructor(padIndex: number=-1) {
        this._padIndex = padIndex;

        // add connection event based on which pad we're using
        if (padIndex !== -1) {
            window.addEventListener("gamepadconnected", (event: GamepadEvent) => {
                // only connect if this is our gamepad
                if (event.gamepad.index === this.padIndex) {
                    this.gamepad = event.gamepad;
                }
            });
        }
        else {
            window.addEventListener("gamepadconnected", (event: GamepadEvent) => {
                // connect to any gamepad if we aren't already connected to one
                if (this.gamepad === null) {
                    this.gamepad = event.gamepad;
                }
            });
        }

        // the disconnect event is always the same
        window.addEventListener("gamepaddisconnected", (event: GamepadEvent) => {
            if (event.gamepad.index === this.gamepad.index) {
                this.gamepad = null;
            }
        });
    }

    /**
     * Returns whether a button on the gamepad is pressed. If the gamepad is disconnected, this
     * method always returns false.
     */
    buttonPressed(button: GpButton): boolean {
        if (this.gamepad === null) { return false; }

        // full pull triggers are special cases - the entry in the button array is true whenever the
        // triggers have been touched at all, so we need to check their axes instead
        if (button === GpButton.LEFT_TRIGGER_FULL_PULL) {
            return this.gamepad.axes[4] === 1;
        }
        else if (button === GpButton.RIGHT_TRIGGER_FULL_PULL) {
            return this.gamepad.axes[5] === 1;
        }
        // otherwise, the enum is laid out so that each button maps directly to its location in the
        // button array
        else {
            return this.gamepad.buttons[button].pressed;
        }
    }

    /**
     * Returns the value of an analog axis. Trigger values are between 0 and 1, where 1 is a full
     * pull. Thumbstick axes are between -1 and 1, where -1 is all the way left/up and 1 is all the
     * way right/down. If the gamepad is disconnected, this method always returns 0.
     * @param rawValue If true, deadzone is not applied to thumbstick values. Has no effect on
     *      triggers (because they never have deadzone).
     */
    axisValue(axis: GpAxis, rawValue: boolean=false): number {
        if (this.gamepad === null) { return 0; }

        if (axis === GpAxis.LEFT_TRIGGER) {
            // apply trigger fix if necessary

            // triggers are stored between -1 and 1, but it's usually makes math easier if they're
            // mapped to between 0 and 1
            return (this.gamepad.axes[4] + 1) / 2;
        }
        else if (axis === GpAxis.RIGHT_TRIGGER) {
            return (this.gamepad.axes[5] + 1) / 2;
        }
        else {
            // stick axes map directly to their location in the axes array (triggers also do, but we
            // handle them differently so it doesn't matter)
            const value = this.gamepad.axes[axis];
            
            return rawValue ? value : applyDeadzone(value, this.innerDeadzone, this.outerDeadzone);
        }
    }

    /**
     * Which gamepad to poll input from. Useful for multiplayer games. If this is -1, any connected
     * gamepad will be used.
     */
    get padIndex() { return this._padIndex; }

    /**
     * Whether the manager is connected to a gamepad.
     */
    get connected() { return this.gamepad !== null; }
}

const Input = {
    /**
     * Manages input for a gamepad.
     */
    Gamepad: GamepadManager
};
export default Input;