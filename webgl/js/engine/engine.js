/**
 * Created by tudalex on 17.03.2014.
 */
function Engine(canvas_id) {
    "use strict";
    this.stats = this.initStats();
    this.input = new InputControl(canvas_id);
    this.input.defineAction('forward', 'W');
    this.input.defineAction('backward', 'S');
    this.renderer = new Renderer(canvas_id, this.stats, this);

}

Engine.prototype.initStats = function() {
    "use strict";
    var stats = new Stats();
    stats.setMode(1);
    document.body.appendChild(stats.domElement);
    return stats;
};

