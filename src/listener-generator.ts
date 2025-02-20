interface Args {
    canvas:p5.Renderer
    disableContextMenu?:boolean
    keyPressed?:(e?:KeyboardEvent)=>void
    keyReleased?:(e?:KeyboardEvent)=>void
    mousePressed?:(e?:MouseEvent)=>void
    mouseReleased?:(e?:MouseEvent)=>void
}

export function addCanvasListeners({ canvas, disableContextMenu=true, keyPressed, keyReleased,
    mousePressed, mouseReleased }: Args) {

    // add event listeners if any of them are defined
    if (keyPressed || keyReleased || mousePressed || mouseReleased || disableContextMenu) {
        // i already have a reference to the canvas that i got from the canvas parameter, and i can
        // use that to make mouse functions only trigger when the mouse is over the canvas, but if i
        // do that then it just casually doesn't pass an event to mousePressed???? so now i have to
        // use this to get a DIFFERENT reference to the SAME THING just to fix that. I SHOULD NOT
        // HAVE TO DO ANY OF THIS DO YOU REALIZE HOW LONG IT TOOK ME TO FIND THIS BUG
        const c = document.getElementById(canvas.id());

        // makes keyboard functions work on the canvas - this has the added bonus of making them
        // only trigger when the canvas has focus (read: only trigger when they should), and makes
        // the debug hotkey still open the console
        c.tabIndex = -1;
        if (mousePressed) {
            c.addEventListener("mousedown", mousePressed);
        }
        if (mouseReleased) {
            c.addEventListener("mouseup", mouseReleased);
        }
        if (keyPressed) {
            c.addEventListener("keydown", keyPressed);
        }
        if (keyReleased) {
            c.addEventListener("keyup", keyReleased);
        }

        if (disableContextMenu) {
            // disables the right-click menu
            c.addEventListener("contextmenu", e => e.preventDefault());
        }
    }
}