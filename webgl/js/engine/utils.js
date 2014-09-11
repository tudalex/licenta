function ajax(url, responseType) {
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest;
        xhr.addEventListener("error", reject);
        xhr.addEventListener("load", resolve);
        xhr.open("GET", url);
        if (responseType)
            xhr.responseType = responseType;
        xhr.send(null);
    });
}