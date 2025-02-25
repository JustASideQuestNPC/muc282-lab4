/**
 * Creates and runs the actual sketch object. A common theme in this code is that p5js is a
 * TOTALLY PERFECT library with NO FLAWS WHATSOEVER. On an entirely unrelated note, I would really
 * like to try whatever the p5js devs have been smoking.
 */

// sketch.json holds configurations for the canvas size and a few input things
import SKETCH_CONFIG from "../config/sketchConfig.js";
import Input from "./engine/input.js";
import { addCanvasListeners } from "./listener-generator.js";

const gamepad = new Input.Gamepad();
const input = new Input.ActionManager();

const sketch = (p5: p5) => {
    p5.setup = () => {
        const canvas = p5.createCanvas(SKETCH_CONFIG.SCREEN_WIDTH, SKETCH_CONFIG.SCREEN_HEIGHT);

        addCanvasListeners({
            canvas: canvas,
            disableContextMenu: SKETCH_CONFIG.DISABLE_RIGHT_CLICK_MENU,
            keyPressed: keyPressed,
            keyReleased: keyReleased,
            mousePressed: mousePressed,
            mouseReleased: mouseReleased
        });
    };

    p5.draw = () => {
        p5.background("#e0e0e0");

        p5.textAlign("left", "top");
        p5.textSize(16);
        p5.noStroke();
        p5.fill("#000000");
        
        let buttonText: string = `Gamepad ${gamepad.connected ? "connected" : "disconnected"}\n`;
        buttonText += "Buttons:\n";
        for (const [i, button] of Object.entries(Input.Gamepad.Button)) {
            if (Number.isNaN(Number(i))) { continue; }
            buttonText += `${button}: ${gamepad.buttonPressed(Number(i))}\n`;
        }
        p5.text(buttonText, 5, 5);

        let axisText: string = "\nAxes:\n";
        for (const [i, axis] of Object.entries(Input.Gamepad.Axis)) {
            if (Number.isNaN(Number(i))) { continue; }
            axisText += `${axis}: ${gamepad.axisValue(Number(i)).toFixed(3)}\n`;
            // add non-deadzone entries for stick axes
            if (Number(i) < 4) {
                axisText += `${axis} raw: ${gamepad.axisValue(Number(i), true).toFixed(3)}\n`;
            }
        }
        p5.text(axisText, 300, 5);
    };

    function keyPressed(event: KeyboardEvent) {
        console.log(`Pressed ${event}`);
    }

    function keyReleased(event: KeyboardEvent) {
    }

    function mousePressed(event: MouseEvent) {
    }
    
    function mouseReleased(event: MouseEvent) {
    }
};

// error checks need to be disabled here because otherwise typescript explodes for some reason
// @ts-ignore
const instance = new p5(sketch);