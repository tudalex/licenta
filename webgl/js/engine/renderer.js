/**
 * Created by tudalex on 07.03.2014.
 */

function AssimpScene(data, gl) {
    "use strict";
    this.data = data;
    this.gl = gl;

    this.init();
}

AssimpScene.prototype.init = function() {
    "use strict";
    var gl = this.gl;
    var i, mesh;
    for (i in this.data.meshes) {
        mesh = this.data.meshes[i];
        mesh.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.vertices), gl.STATIC_DRAW);

        mesh.indexes = [];
        mesh.indexes = mesh.indexes.concat.apply(mesh.indexes, mesh.faces);
        mesh.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indexes), gl.STATIC_DRAW);

    }
};


AssimpScene.prototype.drawMesh = function(idx, shaderProgram) {
    "use strict";
    var gl = this.gl;
    var mesh = this.data.meshes[idx];
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
    gl.drawElements(gl.TRIANGLES, mesh.indexes.length, gl.UNSIGNED_SHORT, 0);

};

AssimpScene.prototype.draw = function(shaderProgram, mvMatrix, node ) {
    "use strict";

    var i;
    var temp = mat4.create();

    if (!mvMatrix) {
        mvMatrix = mat4.create();
        mat4.identity(mvMatrix);
    }

    if (!node)
        node = this.data.rootnode;
    else {
        mat4.transpose(temp, node.transformation);
        mat4.mul(mvMatrix,mvMatrix,  temp);
    }

    if (node.meshes) {
        this.gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
        for (i in node.meshes)
            this.drawMesh(node.meshes[i], shaderProgram);
    }

    if (node.children) {
        for (i in node.children)
            this.draw(shaderProgram, mat4.clone(mvMatrix), node.children[i]);

    }


}



function Renderer(canvas_id, stats, engine) {
    window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
        window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    var canvas = document.getElementById(canvas_id);
    //TODO: Check it's a canvas

    if (stats)
        this.stats = stats;
    this.manager = new ResourceManager();
    engine.renderer = this;

    this.gl =undefined;

    this.pMatrix = mat4.create();
    this.mvMatrix = mat4.create();
    this.lookatMatrix = mat4.create();
    mat4.identity(this.lookatMatrix);
    this.initGL(canvas);
    if (!this.gl) {
        return;
    }


    this.initShaders();
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);

    this.manager.loadObject('sponza.json', function(data, type) {
        this.currScene = new AssimpScene(data, this.gl);
        console.log(type);
    }.bind(this));


    mat4.perspective(this.pMatrix,45, this.gl.canvas.width/this.gl.canvas.height, 0.1, 10000.0);
    mat4.identity(this.mvMatrix);

    mat4.lookAt(this.lookatMatrix,[0, 0, 120], [0, 0, 0], [0, 1, 0]);
    //mat4.translate(this.mvMatrix, this.mvMatrix, [0, 0.0, -120]);
    this.gl.enable(this.gl.DEPTH_TEST);

    this.currCamera = new Camera(engine);


    this.drawScene();

    console.dir( this.gl.getSupportedExtensions());
    //setInterval(this.drawScene.bind(this), 1000/60);
}

Renderer.prototype.initGL = function(canvas) {
    try {
        this.rawgl =  canvas.getContext("experimental-webgl")||canvas.getContext("webgl");
    }
    catch(e) {}

    if (!this.rawgl) {
        console.error("Unable to load webgl");
        return;
    }
    function logGLCall(functionName, args) {
        console.log("gl." + functionName + "(" +
            WebGLDebugUtils.glFunctionArgsToString(functionName, args) + ")");
    }
    //this.gl = WebGLDebugUtils.makeDebugContext(this.rawgl, undefined, logGLCall);
    //this.gl = WebGLDebugUtils.makeDebugContext(this.rawgl);
    this.gl = this.rawgl;
};


Renderer.prototype.initShaders = function() {
    "use strict";
    function getShader(gl, id) {
        "use strict";
        var shaderScript, theSource, currentChild, shader;

        shaderScript = document.getElementById(id);

        if (!shaderScript) {
            return null;
        }

        theSource = "";
        currentChild = shaderScript.firstChild;

        while(currentChild) {
            if (currentChild.nodeType === currentChild.TEXT_NODE) {
                theSource += currentChild.textContent;
            }

            currentChild = currentChild.nextSibling;
        }
        if ("x-shader/x-fragment" === shaderScript.type) {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        } else if ("x-shader/x-vertex" === shaderScript.type) {
            shader = gl.createShader(gl.VERTEX_SHADER);
        } else {
            // Unknown shader type
            return null;
        }
        gl.shaderSource(shader, theSource);

        // Compile the shader program
        gl.compileShader(shader);

        // See if it compiled successfully
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }




    var fragmentShader = getShader(this.gl, "shader-fs");
    var vertexShader = getShader(this.gl, "shader-vs");


    var shaderProgram = this.gl.createProgram();
    this.gl.attachShader(shaderProgram, vertexShader);
    this.gl.attachShader(shaderProgram, fragmentShader);

    this.gl.linkProgram(shaderProgram);

    if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
        console.error("Unable to initialize the shader program.");
    }

    this.gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = this.gl.getAttribLocation(shaderProgram, "aVertexPosition");
    this.gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.pMatrixUniform = this.gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = this.gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.lookat = this.gl.getUniformLocation(shaderProgram, "uLookAt");


    this.shaderProgram = shaderProgram;
};



Renderer.prototype.drawBuffer = function(buffer) {
    "use strict";
    var gl = this.gl;

};

Renderer.prototype.setMatrixUniform = function() {
    var gl = this.gl;
    gl.uniformMatrix4fv(this.shaderProgram.pMatrixUniform, false, this.pMatrix);
    gl.uniformMatrix4fv(this.shaderProgram.mvMatrixUniform, false, this.mvMatrix);
    gl.uniformMatrix4fv(this.shaderProgram.lookat, false, this.lookatMatrix);
};

Renderer.prototype.renderObject = function() {
    "use strict";

};

Renderer.prototype.drawScene = function() {
    "use strict";

    var gl = this.gl;
    if (this.stats)
        this.stats.begin();

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.currCamera.animate();
    mat4.rotate(this.mvMatrix, this.mvMatrix, 0.1, [1, 1, 1]);

    this.setMatrixUniform();

    this.currScene.draw(this.shaderProgram, mat4.clone(this.mvMatrix));

    if (this.stats) {
        this.stats.end();
    }

    window.requestAnimationFrame(this.drawScene.bind(this));
};
