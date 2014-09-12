/**
 * Created by tudalex on 15.03.2014.
 */
"use strict";

function ResourceManager() {
    "use strict";
}

ResourceManager.prototype.load = function(path) {
    return this.sceneData.file(path).asText();
};

ResourceManager.prototype.loadZip = function(url) {
    return ajax(url, "arraybuffer").bind(this)
        .then(function(e) {
            var zip = new JSZip(e.target.response);
            this.sceneData = zip;
            return zip;
        });
};

ResourceManager.prototype.loadObject = function(url) {
    "use strict";
    var data = JSON.parse(this.load(url));
    return data;
};

