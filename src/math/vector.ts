// I'm aware that p5 has a built-in Vector class, but it has to be created with createVector() and
// that requires a reference to a p5 sketch, so it's a huge pain to use when imports are involved.

// why aren't these in the standard library?
function degToRad(angle: number): number {
    return angle * Math.PI / 180;
}
function radToDeg(angle: number): number {
    return angle * 180 / Math.PI;
}

/**
 * Enum representing which unit to use for angles, either `DEGREES` or `RADIANS`.
 */
enum AngleUnit {
    DEGREES,
    RADIANS
}

/**
 * Represents a 2D vector.
 */
export default class Vector2D {
    // mildly cursed typescript to make the enum a class property
    static readonly AngleUnit = AngleUnit;

    /**
     * What units to use for angles in `fromPolar` and `heading`. Both methods have parameters that
     * can override this. The default angle mode is `Vector2D.AngleUnit.DEGREES`.
     */
    static angleMode: AngleUnit = Vector2D.AngleUnit.DEGREES;

    x: number;
    y: number;

    constructor(x: number, y: number);
    constructor();

    constructor(x?: number, y?: number) {
        if (typeof x === "number") {
            this.x = x;
            this.y = y;
        }
        // if x and y aren't defined, make both components 0
        else {
            this.x = 0;
            this.y = 0;
        }
    }

    /**
     * Constructs a vector from an angle (`theta`) and a length (`radius`). `angleMode` is optional
     * and defaults to whatever `Vector2D.angleMode` is currently set to.
     */
    static fromPolar(theta: number, radius: number, angleMode?: AngleUnit): Vector2D {
        // we can't use built-in default parameters here because the default is whatever the value
        // of Vector2D.angleMode is, not some constant
        angleMode = (angleMode !== undefined ? angleMode : Vector2D.angleMode);

        // the built-in sine and cosine functions always use radians
        if (angleMode === Vector2D.AngleUnit.DEGREES) { theta = degToRad(theta); }

        return new Vector2D(Math.cos(theta) * radius, Math.sin(theta) * radius);
    }

    /**
     * Returns a string representation of the vector. Useful for debugging.
     */
    toString(): string {
        return `Vector2D: (${this.x}, ${this.y})`;
    }

    /**
     * Sets the vector's x and y components. Returns a reference to the vector for chaining.
     */
    set(x: number, y: number): Vector2D;
    set(vec: Vector2D): Vector2D;

    set(x: number|Vector2D, y?: number): Vector2D {
        if (x instanceof Vector2D) {
            this.x = x.x;
            this.y = x.y;
        }
        else {
            this.x = x;
            this.y = y;
        }

        // return a reference to ourself so that chained methods work
        return this;
    }

    /**
     * Copies the vector.
     */
    copy(): Vector2D {
        return new Vector2D(this.x, this.y);
    }

    /**
     * Adds to the vector's x and y components. Returns a reference to the vector for chaining.
     */
    add(x: number, y: number): Vector2D;
    add(vec: Vector2D): Vector2D;

    add(x: number|Vector2D, y?: number): Vector2D {
        if (x instanceof Vector2D) {
            this.x += x.x;
            this.y += x.y;
        }
        else {
            this.x += x;
            this.y += y;
        }

        // return a reference to ourself so that chained methods work
        return this;
    }

    /**
     * Subtracts from the vector's x and y components. Returns a reference to the vector for
     * chaining.
     */
    sub(x: number, y: number): Vector2D;
    sub(vec: Vector2D): Vector2D;

    sub(x: number|Vector2D, y?: number): Vector2D {
        if (x instanceof Vector2D) {
            this.x -= x.x;
            this.y -= x.y;
        }
        else {
            this.x -= x;
            this.y -= y;
        }

        // return a reference to ourself so that chained methods work
        return this;
    }

    /**
     * Multiplies the vector's x and y components by a scalar. Returns a reference to the vector for
     * chaining.
     */
    mult(s: number): Vector2D {
        this.x *= s;
        this.y *= s;
        return this;
    }

    /**
     * Divides the vector's x and y components by a scalar. Returns a reference to the vector for
     * chaining.
     */
    div(s: number): Vector2D {
        this.x *= s;
        this.y *= s;
        return this;
    }

    /**
     * Returns the magnitude (length) of the vector.
     */
    mag(): number {
        return Math.sqrt(this.magSq());
    }

    /**
     * Returns the magnitude (length) of the vector, squared. This is faster than `mag()` and can be
     * useful when you don't need the exact length.
     */
    magSq(): number {
        return Math.pow(this.x, 2) + Math.pow(this.y, 2);
    }

    /**
     * Sets the magnitude (length) of the vector. Returns a reference to the vector for chaining.
     */
    setMag(newMag: number): Vector2D {
        // do some division to find a scalar, then use mult() to apply it to both components
        return this.mult(newMag / this.mag());
    }

    /**
     * Limits the magnitude (length) of the vector to at or below a maximum value. Returns a
     * reference to the vector for chaining.
     */
    limit(maximum: number): Vector2D;
    /**
     * Limits the magnitude (length) of the vector to between a minimum and maximum value. Returns a
     * reference to the vector for chaining.
     */
    limit(minimum: number, maximum: number): Vector2D;

    limit(minimum: number, maximum?: number): Vector2D {
        // handle overloads
        if (maximum === undefined) {
            maximum = minimum;
            minimum = 0;
        }

        // use magSq() to avoid an expensive square root operation
        if (this.magSq() < Math.pow(minimum, 2)) {
            this.setMag(minimum);
        }
        if (this.magSq() > Math.pow(maximum, 2)) {
            this.setMag(maximum);
        }
        return this;
    }

    /**
     * Returns the angle the vector is pointing in. `angleMode` is optional and defaults to whatever
     * `Vector2D.angleMode` is currently set to.
     */
    heading(angleMode?: AngleUnit): number {
        // we can't use built-in default parameters here because the default is whatever the value
        // of Vector2D.angleMode is, not some constant
        angleMode = (angleMode !== undefined ? angleMode : Vector2D.angleMode);

        let a = Math.atan2(this.y, this.x);
        if (angleMode === Vector2D.AngleUnit.DEGREES) { return radToDeg(a); }
        else { return a; }
    }

    /**
     * Sets the angle the vector is pointing in. `angleMode` is optional and defaults to whatever
     * `Vector2D.angleMode` is currently set to. Returns a reference to the vector for chaining.
     */
    setHeading(newHeading: number, angleMode?: AngleUnit): Vector2D {
        // we can't use built-in default parameters here because the default is whatever the value
        // of Vector2D.angleMode is, not some constant
        angleMode = (angleMode !== undefined ? angleMode : Vector2D.angleMode);

        if (angleMode === Vector2D.AngleUnit.DEGREES) { newHeading = degToRad(newHeading); }

        // maintain our current length
        let mag = this.mag();
        this.x = Math.cos(newHeading) * mag;
        this.y = Math.sin(newHeading) * mag;

        return this;
    }

    /**
     * Returns the dot product of the vector and another vector, or another set of x and y
     * components.
     */
    dot(vec: Vector2D): number;
    dot(x: number, y: number): number;

    dot(x: number|Vector2D, y?: number): number {
        if (x instanceof Vector2D) { return this.x * x.x + this.y * x.y; }
        else { return this.x * x + this.y * y; }
    }

    /**
     * Normalizes the vector so that its length is 1. A zero vector remains at length 0. Returns a
     * reference to the vector for chaining.
     */
    normalize(): Vector2D {
        // only normalize nonzero vectors
        if (this.x !== 0 || this.y !== 0) {
            this.div(this.mag());
        }

        return this;
    }

    /**
     * Returns the distance between the vector's coordinates and other vector's coordinates,
     * squared. This is faster than `dist()` and can be useful when you don't need the exact
     * distance.
     */
    distSq(vec: Vector2D): number;
    /**
     * Returns the distance between the vector's coordinates and another set of x and y coordinates,
     * squared. This is faster than `dist()` and can be useful when you don't need the exact
     * distance.
     */
    distSq(x: number, y: number): number;
    
    distSq(x: number|Vector2D, y?: number): number {
        if (x instanceof Vector2D) {
            return Math.pow(this.x - x.x, 2) + Math.pow(this.y - x.y, 2);
        }
        else {
            return Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2);
        }
    }

    /**
     * Returns the distance between the vector's coordinates and other vector's coordinates.
     */
    dist(vec: Vector2D): number;
    /**
     * Returns the distance between the vector's coordinates and another set of x and y coordinates
     */
    dist(x: number, y: number): number;
    
    dist(x: number|Vector2D, y?: number): number {
        if (x instanceof Vector2D) {
            return Math.sqrt(Math.pow(this.x - x.x, 2) + Math.pow(this.y - x.y, 2));
        }
        else {
            return Math.sqrt(Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2));
        }
    }

    /**
     * Returns whether the vector's x and y components are equal to another vector's x and y
     * components.
     */
    equals(vec: Vector2D): boolean;
    /**
     * Returns whether the vector's x and y components are equal to another set of x and y
     * coordinates.
     */
    equals(x: number, y: number): boolean;

    equals(x: number|Vector2D, y?: number): boolean {
        if (x instanceof Vector2D) {
            return this.x === x.x && this.y === x.y;
        }
        else {
            return this.x === x && this.y === y;
        }
    }

    /**
     * Snaps the vector's components to zero if its length is below a certain threshold. This can be
     * useful for avoiding issues caused by floating-point imprecision. Returns a reference to the
     * vector for chaining.
     */
    snapZero(threshold: number): Vector2D {
        // use magSq() to avoid an expensive square root operation
        if (this.magSq() < Math.pow(threshold, 2)) {
            this.x = 0;
            this.y = 0;
        }
        return this;
    }
}