import Vector2D from "../math/vector.js";
import { InvalidArgumentError } from "../utils.js";

/**
 * A single input action.
 */
interface InputAction {
    active: boolean,
    keys: string[],
    buttons: GpButton[],
    update: (pressed: boolean, dt: number)=>void,
    wasActive: boolean,
    bufferDuration: number
}

export enum GpButton {
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

export enum GpAxis {
    LEFT_STICK_X,
    LEFT_STICK_Y,
    RIGHT_STICK_X,
    RIGHT_STICK_Y,
    LEFT_TRIGGER,
    RIGHT_TRIGGER,
}

export enum GpThumbstick { LEFT, RIGHT }

// lookup table for gamepad button names
const GAMEPAD_BUTTON_LOOKUP: {[key: string]: GpButton} = {
    "a": GpButton.A,
    "b": GpButton.B,
    "x": GpButton.X,
    "y": GpButton.Y,
    "left bumper": GpButton.LEFT_BUMPER,
    "right bumper": GpButton.RIGHT_BUMPER,
    "left trigger": GpButton.LEFT_TRIGGER,
    "right trigger": GpButton.RIGHT_TRIGGER,
    "share": GpButton.SHARE,
    "options": GpButton.OPTIONS,
    "left stick click": GpButton.LEFT_STICK_CLICK,
    "right stick click": GpButton.RIGHT_STICK_CLICK,
    "dpad up": GpButton.DPAD_UP,
    "dpad down": GpButton.DPAD_DOWN,
    "dpad left": GpButton.DPAD_LEFT,
    "dpad right": GpButton.DPAD_RIGHT,
    "home": GpButton.HOME,
    "left trigger full pull": GpButton.LEFT_TRIGGER_FULL_PULL,
    "right trigger full pull": GpButton.RIGHT_TRIGGER_FULL_PULL
};

/**
 * Lookup table to map some key names to more intuitive ones.
 */
const ALTERNATE_KEY_NAMES: {[key: string]: string} = {

};

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
export class GamepadManager {
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
     * Whether triggers should be read from the gamepad's axes or its buttons.
     */
    private triggersAreAxes: boolean;

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

        // add the correct method to poll input from the gamepad
        if (padIndex !== -1) {
            const pollInput = () => {
                this.gamepad = navigator.getGamepads()[this._padIndex];
                // some browsers store the triggers using the axes, but other ones store them using
                // buttons array and this is the only good way i've found to get around that
                if (this.gamepad !== null && this.triggersAreAxes === undefined) {
                    this.triggersAreAxes = this.gamepad.axes[4] != null;
                    console.log(
                        `[GamepadManager] Triggers are ${this.triggersAreAxes ? "axes" : "buttons"}`
                    );
                }
                // repeat every frame
                window.requestAnimationFrame(pollInput);
            };
            window.requestAnimationFrame(pollInput);
        }
        else {
            const pollInput = () => {
                this.gamepad = navigator.getGamepads().find((g) => g !== null) ?? null;
                if (this.gamepad !== null && this.triggersAreAxes === undefined) {
                    this.triggersAreAxes = this.gamepad.axes[4] != null;
                    console.log(
                        `[GamepadManager] Triggers are ${this.triggersAreAxes ? "axes" : "buttons"}`
                    );
                }
                window.requestAnimationFrame(pollInput);
            };
            window.requestAnimationFrame(pollInput);
        }
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
            return (this.triggersAreAxes ? this.gamepad.axes[4] === 1 :
                                           this.gamepad.buttons[6].value === 1);
        }
        else if (button === GpButton.RIGHT_TRIGGER_FULL_PULL) {
            return (this.triggersAreAxes ? this.gamepad.axes[5] === 1 :
                                           this.gamepad.buttons[7].value === 1);
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
     * @param [rawValue=false] If true, deadzone is not applied to thumbstick values. Has no effect
     *      on triggers (because they never have deadzone). Defaults to false.
     */
    axisValue(axis: GpAxis, rawValue: boolean=false): number {
        if (this.gamepad === null) { return 0; }

        if (axis === GpAxis.LEFT_TRIGGER) {
            if (this.triggersAreAxes) {
                // TODO: fix bug where trigger values are initially 0.5 until updated
                // map value to between 0 and 1
                return (this.gamepad.axes[4] + 1) / 2;
            }
            else {
                // the button value is already between 0 and 1
                return this.gamepad.buttons[6].value;
            }
        }
        else if (axis === GpAxis.RIGHT_TRIGGER) {
            if (this.triggersAreAxes) {
                // map value to between 0 and 1
                return (this.gamepad.axes[5] + 1) / 2;
            }
            else {
                // the button value is already between 0 and 1
                return this.gamepad.buttons[7].value;
            }
        }
        else {
            // stick axes map directly to their location in the axes array (triggers also do, but we
            // handle them differently so it doesn't matter)
            const value = this.gamepad.axes[axis];
            
            return rawValue ? value : applyDeadzone(value, this.innerDeadzone, this.outerDeadzone);
        }
    }

    /**
     * Returns the position of a thumbstick. If the gamepad is disconnected, this method always
     * returns a zero vector.
     * @param [rawValue=false] If true, deadzone is not applied to the position. Defaults to false.
     */
    stickPos(stick: GpThumbstick, rawValue: boolean=false): Vector2D {
        if (stick === GpThumbstick.LEFT) {
            return new Vector2D(
                this.axisValue(GpAxis.LEFT_STICK_X, rawValue),
                this.axisValue(GpAxis.LEFT_STICK_Y, rawValue)
            );
        }
        else {
            return new Vector2D(
                this.axisValue(GpAxis.RIGHT_STICK_X, rawValue),
                this.axisValue(GpAxis.RIGHT_STICK_Y, rawValue)
            );
        }
    }

    /**
     * Returns a normalized (length 1) vector with the position of a thumbstick. If the gamepad is
     * disconnected, this method always returns a zero vector.
     */
    stickVector(stick: GpThumbstick): Vector2D {
        return this.stickPos(stick).normalize();
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

/**
 * An action-based system for managing inputs.
 */
export class InputManager {
    /**
     * All active actions.
     */
    private actions: {[key: string]: InputAction};

    /**
     * The state of every keyboard key and mouse button
     */
    private keyStates: {[key: string]: boolean};

    /**
     * How long press-type inputs can be buffered for, in seconds.
     */
    bufferDuration: number = 0.03;

    /**
     * Timestamp of the previous update; used for updating buffers.
     */
    prevTimestamp: number;

    /**
     * The gamepad to use for polling input.
     */
    gamepad: GamepadManager | null = null;

    constructor(canvas: HTMLElement, gamepad: GamepadManager=null) {
        // attach input listeners to the canvas
        canvas.addEventListener("keydown", (event) => {
            console.log(event.code);
        });
        canvas.addEventListener("keyup", (event) => {

        });
        canvas.addEventListener("mousedown", (event) => {
            if (event.button === 0) {
                this.keyStates["left click"] = true;
            }
            else if (event.button === 1) {
                this.keyStates["middle click"] = true;
            }
            else if (event.button === 2) {
                this.keyStates["right click"] = true;
            }
        });
        canvas.addEventListener("mouseup", (event) => {
            if (event.button === 0) {
                this.keyStates["left click"] = false;
            }
            else if (event.button === 1) {
                this.keyStates["middle click"] = false;
            }
            else if (event.button === 2) {
                this.keyStates["right click"] = false;
            }
        });

        this.gamepad = gamepad;

        // start the counter
        this.prevTimestamp = window.performance.now();
        // setup a callback to update everything
        const updateCallback = () => {
            const currentTimestamp = window.performance.now();
            const dt = currentTimestamp - this.prevTimestamp;
            this.prevTimestamp = currentTimestamp;

            // update all actions
            for (const action of Object.values(this.actions)) {
                // figure out whether the action is pressed
                let actionPressed = action.keys.some((k) => this.keyStates[k]);
                // check gamepad buttons if the gamepad is connected
                if (!actionPressed && this.gamepad !== null && this.gamepad.connected) {
                    actionPressed = action.buttons.some((b) => this.gamepad.buttonPressed(b));
                }

                action.update(actionPressed, dt);
            }

            // run every frame
            window.requestAnimationFrame(updateCallback);
        };
        window.requestAnimationFrame(updateCallback);
    }

    /**
     * Adds an action to the manager.
     * @param name The name of the action; used to access it using `isActive()`.
     * @param keys All keyboard keys or mouse buttons that can activate the action. Actions must
     *      have at least one keyboard key, mouse button, or gamepad button assigned to them.
     * @param buttons All gamepad buttons that can activate the action. Actions must have at least
     *      one keyboard key, mouse button, or gamepad button assigned to them.
     * @param type The type of the action, either `"press"` or `"hold"`. A `"press"` action is
     *      active once when its key is initially pressed, and then deactivates until the key is
     *      released and re-pressed. A `"hold"` action is active whenever its keys are pressed. The
     *      default action type is `"hold"`,
     */
    addAction({ name, keys=[], buttons=[], type="hold" }: { name: string, keys?: string[],
              buttons?: (string|GpButton)[], type?: "press"|"hold" }) {
        // make sure the action has something assigned to it
        if (keys.length === 0 && buttons.length === 0) {
            throw new InvalidArgumentError(
                `[InputManager] The action ${name} has no keys or buttons assigned to it.`
            );
        }

        const action: InputAction = {
            active: false,
            keys: keys.map((k) => k.toLowerCase()),
            // convert strings to gamepad buttons
            buttons: buttons.map((b) => typeof b === "string" ? GAMEPAD_BUTTON_LOOKUP[b] : b),
            // we'll set this up a bit later
            update: null,
            wasActive: false,
            bufferDuration: 0
        };

        // set update method based on action type
        if (type === "hold") {
            action.update = (pressed: boolean, dt: number) => {
                action.active = pressed;
            };
        }
        else {
            action.update = (pressed: boolean, dt: number) => {
                if (pressed) {
                    if (action.bufferDuration >= 0) {
                        action.bufferDuration -= dt;
                        action.active = true;
                    }
                    else if (action.wasActive) {
                        action.active = false;
                    }
                    else {
                        action.active = true;
                        action.wasActive = true;
                        action.bufferDuration = this.bufferDuration;
                    }
                }
                else {
                    action.wasActive = false;
                    action.active = false;
                }
            };
        }

        this.actions[name] = action;
    }

    /**
     * Returns whether the named action is active. Throws an `InvalidArgumentError` if the action
     * does not exist.
     */
    isActive(name: string): boolean {
        if (Object.hasOwn(this.actions, name)) {
            const active = this.actions[name].active;
            // clear the buffers for press inputs to prevent them from activating multiple times
            this.actions[name].bufferDuration = 0;
            return active;
        }
        throw new InvalidArgumentError(`[InputManager] The action "${name}" does not exist.`);
    }
}