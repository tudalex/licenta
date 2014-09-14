function ajax(url, responseType) {
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest;
        xhr.addEventListener("error", reject);
        xhr.addEventListener("load", resolve);
        xhr.open("GET", url+"?r="+Math.random());
        if (responseType)
            xhr.responseType = responseType;
        xhr.send(null);
    });
}

function loadImage(path) {
    return new Promise(function (resolve, reject) {
        var img = new Image();
        img.addEventListener("error", reject);
        img.addEventListener("load", resolve);
        img.src = path;
        document.body.appendChild(img);
    });
}
