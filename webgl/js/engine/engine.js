/**
 * Created by tudalex on 17.03.2014.
 */

/** @export */
function Engine(canvas_id, frameCount) {
    "use strict";
    this.frameCount = frameCount;
    this.timer = new Timer(16, false);
    this.timer.map(0, "DrawMesh");
    this.timer.map(1, "Draw");

    this.stats = this.initStats();
    this.inputControl = new InputControlSystem();
    this.input = new InputControl(canvas_id);
    this.inputControl.useInputControl(this.input);
    this.input.defineAction('forward', 'W');
    this.input.defineAction('backward', 'S');
    this.input.defineAction('left', 'A');
    this.input.defineAction('right', 'D');
    this.input.defineAction('up', 'R');
    this.input.defineAction('down', 'F');
    this.renderer = new Renderer(canvas_id, this.stats, this.timer, this);

    this.physics = new Physics(this.render);
    //TODO(tudalex): Fix it and make the renderer use the resource manager from the engine
    this.manager = this.renderer.manager;
    this.mainLoop = this.mainLoop.bind(this);

    this.renderer.loadShaderPrograms()
        .then(this.mainLoop);
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
Engine.prototype.loadGameData = function(path) {
    "use strict";
    return this.manager.loadZip(path).bind(this)
        .then(function() {
            var manifest = this.manager.loadObject("manifest.json");
            this.loadScene(manifest.main_scene);
        });
};

/** @export */
Engine.prototype.loadScene = function(scene) {
    "use strict";
    var data = this.renderer.manager.loadObject(scene);
    this.renderer.currScene = new AssimpScene(data, this.renderer.gl, this.timer);
};

Engine.prototype.mainLoop = function() {
    "use strict";

    if (this.stats) {
        this.stats.begin();
    }

    this.renderer.drawScene();
    this.physics.step();
    if (this.stats) {
        this.stats.end();
    }
    if (this.frameCount !== undefined) {
        if (this.frameCount > 0) {
            window.requestAnimationFrame(this.mainLoop, this.renderer.canvas);
            this.frameCount -= 1;
        }
    } else {
        window.requestAnimationFrame(this.mainLoop, this.renderer.canvas);
    }
};
