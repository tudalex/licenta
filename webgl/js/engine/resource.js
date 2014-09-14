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

ResourceManager.prototype.loadBinary = function(path) {
    return this.sceneData.file(path).asUint8Array();
};

ResourceManager.prototype.loadImage = function(path) {
    var data = this.loadBinary(path);
    var blob = new Blob( [ data ], { type: "image/jpeg" } );
    var urlCreator = window.URL || window.webkitURL;
    var imageUrl = urlCreator.createObjectURL( blob );
    var img = new Image();
    img.src = imageUrl;
    document.body.appendChild(img);
    return img;
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

