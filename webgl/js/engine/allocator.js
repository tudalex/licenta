/**
 * Created by tudalex on 8/18/14.
 */

function Allocator(maxSize) {
    "use strict";
    if (!maxSize) {
        maxSize = 256 * 1024 * 1024;
    }
    this.maxSize = maxSize;
    this.buffer = new ArrayBuffer(maxSize); // 256MB
    this.lp = 0;
}

Allocator.prototype.getArrayInt32 = function(size) {
    "use strict";
    if (this.lp + size * 4 >= this.maxSize) {
        return null;
    }
    var ret = new Int32Array(this.buffer, this.lp, size);
    this.lp += size * 4;
    return ret;
};

Allocator.prototype.convertInt32 = function(array) {
    "use strict";
    var size = array.length;
    var i, ret = this.getArrayInt32(size);
    for (i = 0; i < size; ++ i) {
        ret[i] = array[i];
    }
    return ret;
};

Allocator.prototype.destroy = function() {
    "use strict";
    delete this.buffer;
};


// Benchmark methods

var maxSize = 64 * 1024 * 1024;  // 64MB
var large = maxSize / 16;

function allocateChunksAllocator(size) {
    "use strict";
    var allocator = new Allocator(maxSize);
    var i, t;
    for (i = 0; i < maxSize; i += size * 4) {
        t = allocator.getArrayInt32(size);
    }
}

function allocateChunksArray(size) {
    "use strict";
    var i;
    var t;
    for (i = 0; i < maxSize; i += size * 4) {
        t = new Int32Array(size);
    }
}

