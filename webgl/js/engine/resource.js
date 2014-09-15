/**
 * Created by tudalex on 15.03.2014.
 */
function ResourceManager() {
    "use strict";
    this.textureHash = {};
}

ResourceManager.prototype.load = function(path) {
    "use strict";
    return this.sceneData.file(path).asText();
};

ResourceManager.prototype.loadBinary = function(path) {
    "use strict";
    return this.sceneData.file(path).asUint8Array();
};

ResourceManager.prototype.loadImage = function(path) {
    "use strict";
    var data = this.loadBinary(path);
    var blob = new Blob( [ data ], { type: "image/jpeg" } );
    var urlCreator = window.URL || window.webkitURL;
    var imageUrl = urlCreator.createObjectURL( blob );
    var img = new Image();
    img.src = imageUrl;
    document.body.appendChild(img);
    return img;
};

ResourceManager.prototype.getTexture = function(image, gl) {
    "use strict";
    var url = image.currentSrc;
    console.log(url);
    if (this.textureHash[url] === undefined) {
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
        this.textureHash[url] = texture;
    }
    return this.textureHash[url];
};

ResourceManager.prototype.loadZip = function(url) {
    "use strict";
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

