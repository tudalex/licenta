/**
 * Created by tudalex on 17.03.2014.
 */

function InputControlSystem(elementId) {
    "use strict";
    var canvas = this.canvas = document.getElementById(elementId);
    canvas.requestPointerLock = canvas.requestPointerLock ||
        canvas.mozRequestPointerLock ||
        canvas.webkitRequestPointerLock;

    this.currentInputControl = {};
    this.initKeyboard();
    //this.initMouseLock();
    canvas.addEventListener('mousedown', function(e) {
        if (!this.pointerLocked() && e.which === 3) {
            canvas.requestPointerLock();
        }
    }.bind(this));
    canvas.addEventListener('mousedown', this.mouseClickCallback.bind(this));
    canvas.addEventListener('mousemove', this.mouseMoveCallback.bind(this));
    this.mouseBound = false;
}

InputControlSystem.prototype.mouseClickCallback = function(e) {
    "use strict";
    if (this.pointerLocked()) {
        this.currentInputControl.mouseClickCallback(e);
    }
};

InputControlSystem.prototype.mouseMoveCallback = function(e) {
    "use strict";
    if (this.pointerLocked()) {
        var x = e.movementX || e.mozMovementX || e.webkitMovementX;
        var y = e.movementY || e.mozMovementY || e.webkitMovementY;
        console.log(x, y);
        this.currentInputControl.mouseMoveCallback(x, y);
    }
};

InputControlSystem.prototype.pointerLocked = function() {
    "use strict";
    var canvas = this.canvas;
    return document.pointerLockElement === canvas ||
        document.mozPointerLockElement === canvas ||
        document.webkitPointerLockElement === canvas;
};

InputControlSystem.prototype.keyCallback = function(ev) {
    "use strict";
    this.currentInputControl.keyCallback.call(this.currentInputControl, ev);
};

InputControlSystem.prototype.initKeyboard = function() {
    "use strict";
    document.addEventListener('keydown', this.keyCallback.bind(this));
    document.addEventListener('keyup', this.keyCallback.bind(this));

};

InputControlSystem.prototype.releaseKeybaord = function() {
    "use strict";
    document.removeEventListener('keydown', this.keyCallback.bind(this));
    document.removeEventListener('keyup', this.keyCallback.bind(this));
};

InputControlSystem.prototype.useInputControl = function(inputControl) {
    "use strict";
    this.currentInputControl = inputControl;
};



InputControlSystem.prototype.initMouseLock = function() {
    "use strict";
    this.requestPointerLock();
};

function InputControl(elementId) {
    "use strict";
    this.elementId = elementId;
    this.keystatus = new Uint8Array(256);
    this.debug = false;
    this.actions = {};
    this.dx = 0;
    this.dy = 0;
}


InputControl.prototype.mouseMoveCallback = function(dx, dy) {
    "use strict";
    this.dx += dx;
    this.dy += dy;
};

InputControl.prototype.getMouseMove = function() {
    "use strict";
    var ret = [this.dx, this.dy];
    this.dx = this.dy = 0;
    return ret;
};

InputControl.prototype.defineAction = function(name) {
    "use strict";
    if (arguments.length < 2) {
        return;
    }
    var triggers = Array.prototype.slice.call(arguments, 1);
    var processed_triggers;
    processed_triggers = [];

    var i;
    for (i = 0; i < triggers.length; ++i) {
        if (typeof triggers[i] === "string" && triggers[i].length === 1) {
            triggers[i] = triggers[i].charCodeAt(0);
        }
        if (typeof triggers[i] === "number") {
            processed_triggers.push(triggers[i]);
        }
    }
    this.actions[name] = processed_triggers;
};

InputControl.prototype.action = function(name) {
    var ret = false, i, keys = this.actions[name];
    for (i = 0; i < keys.length; ++i) {
        ret = ret || this.keystatus[keys[i]];
    }
    return ret;
};

InputControl.prototype.keyCallback = function(ev) {
    if (this.debug) {
        console.log(ev.type, ev.keyCode);
        console.log(JSON.stringify(this.actions));
    }
    switch (ev.type) {
        case "keyup":
            this.keystatus[ev.keyCode] = 0;
            break;
        case "keydown":
            this.keystatus[ev.keyCode] = 1;
    }
};






