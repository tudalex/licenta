/**
 * Created by tudalex on 17.03.2014.
 */
function InputControl(element_id) {
    "use strict";
    this.element_id = element_id;
    this.keystatus = new Uint8Array(256);
    this.initKeyboard();
    this.initMouseLock();
    this.debug = true;
    this.actions = {};
}

InputControl.prototype.defineAction = function (name) {
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
        if (typeof triggers[i] === "number")
            processed_triggers.push(triggers[i]);
    }
    this.actions[name] = processed_triggers;
};

InputControl.prototype.action = function(name) {
    "use strict";
    var ret = false, i, keys = this.actions[name];
    for (i = 0; i < keys.length; ++i) {
        ret = ret || this.keystatus[keys[i]];
    }
    return ret;
};

InputControl.prototype.keyCallback = function (ev) {
    "use strict";
    if (this.debug)
        console.log(ev.type, ev.keyCode);
    switch (ev.type) {
        case "keyup":
            this.keystatus[ev.keyCode] = 0;
            break;
        case "keydown":
            this.keystatus[ev.keyCode] = 1;
    }
    console.log(JSON.stringify(this.actions));
};

InputControl.prototype.initKeyboard = function() {
    "use strict";
    document.addEventListener('keydown',this.keyCallback.bind(this));
    document.addEventListener('keyup', this.keyCallback.bind(this));

};

InputControl.prototype.releaseKeybaord = function() {
    "use strict";
    document.removeEventListener('keydown', this.keyCallback.bind(this));
    document.removeEventListener('keyup', this.keyCallback.bind(this));
};

InputControl.prototype.mouseMoveCallback = function(m) {
    "use strict";

};

InputControl.prototype.initMouseLock = function() {
    "use strict";
    var elem = document.getElementById(this.element_id);


};


