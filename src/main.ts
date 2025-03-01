/**
 * Creates and runs the actual sketch object. A common theme in this code is that p5js is a
 * TOTALLY PERFECT library with NO FLAWS WHATSOEVER. On an entirely unrelated note, I would really
 * like to try whatever the p5js devs have been smoking.
 */

// sketch.json holds configurations for the canvas size and a few input things
import SKETCH_CONFIG from "../config/sketchConfig.js";
import { addCanvasListeners } from "./listener-generator.js";
import { GamepadManager, InputManager } from "./engine/input.js";

let gamepad: GamepadManager, input: InputManager;

const sketch = (p5: p5) => {
    p5.setup = () => {
        const canvas = p5.createCanvas(SKETCH_CONFIG.SCREEN_WIDTH, SKETCH_CONFIG.SCREEN_HEIGHT);

        addCanvasListeners({
            canvas: canvas,
            disableContextMenu: SKETCH_CONFIG.DISABLE_RIGHT_CLICK_MENU
        });

        gamepad = new GamepadManager();
        input = new InputManager(document.getElementById(canvas.id()), gamepad);

        // test actions, will be removed later
        input.addAction({
            name: "hold action",
            keys: ["shift", " "],
            buttons: ["a", "left trigger full pull"]
        });
        input.addAction({
            name: "press action",
            keys: ["left mouse"],
            buttons: ["right stick click"],
            type: "press"
        });
    };

    p5.draw = () => {
        p5.background("#e0e0e0");

        p5.noStroke();
        if (input.isActive("hold action")) {
            p5.fill("#ff0000");
        }
        else {
            p5.fill("#000000");
        }
        p5.circle(425, 360, 150);

        if (input.isActive("press action")) {
            p5.fill("#ff0000");
        }
        else {
            p5.fill("#000000");
        }
        p5.circle(850, 360, 150);
    };
};

// error checks need to be disabled here because otherwise typescript explodes for some reason
// @ts-ignore
const instance = new p5(sketch);