function AudioManager() {
    this.files = {};
}

AudioManager.prototype.loadSound = function(url, name) {
    "use strict";
    var key = name || url;
    this.files[key] = new Howl({urls:[url]});
};

AudioManager.prototype.play = function(key) {
    this.files[key].play();
};
