// all the stuff that didn't belong anywhere else

/**
 * Represents an error caused when an argument is of the correct type but still invalid for some
 * other reason.
 */
export class InvalidArgumentError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "InvalidArgumentError";
    }
};