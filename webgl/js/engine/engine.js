/**
 * Created by tudalex on 17.03.2014.
 */

/** @export */
function Engine(canvas_id) {
    "use strict";
    this.stats = this.initStats();
    this.input = new InputControl(canvas_id);
    this.input.defineAction('forward', 'W');
    this.input.defineAction('backward', 'S');
    this.input.defineAction('left', 'A');
    this.input.defineAction('right', 'D');
    this.input.defineAction('up', 'R');
    this.input.defineAction('down', 'F');
    this.renderer = new Renderer(canvas_id, this.stats, this);

    //TODO(tudalex): Fix it and make the renderer use the resource manager from the engine
    this.manager = this.renderer.manager;
    this.mainLoop = this.mainLoop.bind(this);
    console.dir(this);
    this.mainLoop();
}

/** @export */
Engine.prototype.initStats = function() {
    "use strict";
    var stats = new Stats();
    stats.setMode(1);
    document.body.appendChild(stats.domElement);
    return stats;
};

/** @export */
Engine.prototype.loadGameData = function(dataPath, callback) {
    "use strict";
    this.manager.loadDataZip(dataPath, function() {
        var manifest = this.manager.loadObject("manifest.json");
        //console.log("Manifest", manifest);
        this.loadScene(manifest.main_scene);
        if (typeof callback == "function")
            callback();
    }.bind(this));
};

/** @export */
Engine.prototype.loadScene = function(scene) {
    "use strict";
    var data = this.renderer.manager.loadObject(scene);
    this.renderer.currScene = new AssimpScene(data, this.renderer.gl);
    console.log(data);
};

Engine.prototype.mainLoop = function() {
    "use strict";
    if (this.stats)
        this.stats.begin();
    this.renderer.drawScene();

    if (this.stats) {
        this.stats.end();
    }

//    window.requestAnimationFrame(this.mainLoop, this.renderer.canvas);
};
