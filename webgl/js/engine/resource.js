/**
 * Created by tudalex on 15.03.2014.
 */

ResourceManager = function() {
    "use strict";

}

ResourceManager.prototype.load = function(url, callback, type) {
    "use strict";
    //TODO: Implement a more feature complete loader
    var req = new XMLHttpRequest();
    req.open("GET", url, false);
    req.onload = function (data) {
        callback(req.response, req.responseType);
    }
    req.send();


}

ResourceManager.prototype.loadObject = function(url, callback) {
    "use strict";
    this.load(url, function (data, type) {
        "use strict";
        data = JSON.parse(data);
        callback(data, type);
    }, 'JSON');
}

