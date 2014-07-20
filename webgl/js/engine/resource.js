/**
 * Created by tudalex on 15.03.2014.
 */
"use strict";

function ResourceManager() {
    "use strict";

}

ResourceManager.prototype.xhrLoadBinary = function(url, callback, type) {
    "use strict";
    //TODO: Implement a more feature complete loader
    var req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.responseType = "arraybuffer";
    req.onload = function (data) {
        callback(req.response, req.responseType);
    };
    req.send();
};

ResourceManager.prototype.load = function (url, callback) {
    return this.currentData.file(url).asText();
};

ResourceManager.prototype.loadDataZip = function (data_path, callback) {
    this.xhrLoadBinary(data_path, function(data) {
        this.currentData = new JSZip(data);
        callback();
    }.bind(this));
};

ResourceManager.prototype.loadObject = function(url) {
    "use strict";
    var data = JSON.parse(this.load(url));
    console.log(data);
    return data;
};

