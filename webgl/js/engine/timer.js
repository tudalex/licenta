function Timer(counters, log_stats) {
    "use strict";
    this.avg = new Float64Array(counters);
    this.max = new Float64Array(counters);
    this.min = new Float64Array(counters);
    this.samples = new Uint32Array(counters);
    this.startTime = new Float64Array(counters);
    this.mapping = {};
    if (log_stats) {
        window.setInterval(function() {
            console.log(this.toString());
        }.bind(this), 1000);
    }
}

Timer.prototype.start = function(id) {
    "use strict";
    this.startTime[id] = window.performance.now();
};

Timer.prototype.stop = function(id) {
    "use strict";
    var samplecnt = this.samples[id];
    var diff = window.performance.now() - this.startTime[id];
    this.min[id] = Math.min(this.min[id], diff);
    this.max[id] = Math.max(this.max[id], diff);
    this.avg[id] =
        ((this.avg[id] * samplecnt) + diff) / (samplecnt + 1);
    this.samples[id] = samplecnt;
};

Timer.prototype.map = function(id, name) {
    "use strict";
    this.mapping[name] = id;
};

Timer.prototype.toString = function() {
    "use strict";
    var output = "";
    var key;
    for (key in this.mapping) {
        var id = this.mapping[key];
        output += key + ": avg:" + this.avg[id] + " min: " + this.min[id] + " max: " + this.max[id] + "\n";
    }
    return output;
};

Timer.prototype.destroy = function() {
    "use strict";
    this.avg.destroy();
    this.samples.destroy();
    this.start.destroy();
};