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