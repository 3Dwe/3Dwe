/**
 * Created by Aibek on 11/28/13.
 */

/**
 *   EMPTY was used to debug memory management
 *
 */

var EMPTY = new EMPTY();

function EMPTY() {
    // Utilize singleton property
    if ( arguments.callee._singletonInstance )
        return arguments.callee._singletonInstance;
    arguments.callee._singletonInstance = this;

    this.isLoaded = false;

    this.load = function () {
        this.isLoaded = true;
    }

    this.unload = function () {
        this.isLoaded = false;
    }
}