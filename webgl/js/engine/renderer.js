/**
 * Created by tudalex on 07.03.2014.
 */

function AssimpScene(data, gl, timer) {
    "use strict";
    this.data = data;
    this.gl = gl;
    this.timer = timer;

    this.init();
}

AssimpScene.prototype.init = function() {
    "use strict";
    var gl = this.gl;
    var i, j, mesh, material, key;
    for (i in this.data.meshes) { //jshint ignore:line
        mesh = this.data.meshes[i];
        mesh.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.vertices), gl.STATIC_DRAW);

        mesh.indexes = [];
        mesh.indexes = mesh.indexes.concat.apply(mesh.indexes, mesh.faces);
        mesh.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indexes), gl.STATIC_DRAW);

        mesh.normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.normals), gl.STATIC_DRAW);
    }

    for (i in this.data.materials) {
        material = this.data.materials[i];
        material.mat = {};
        material.tex = {};
        material.clr = {};
        for (j in material.properties) {
            key = material.properties[j].key.slice(1).split('.');
            //console.log(key);
            material[key[0]][key[1]] = material.properties[j].value;
        }
//        for (j in material.clr) {
//            console.log(j);
//            //gl.
//        }
        delete material.properties;
    }
    console.dir(this);
};


AssimpScene.prototype.drawMesh = function(idx, shaderProgram) {
    "use strict";
    this.timer.start(0);
    var gl = this.gl;
    var mesh = this.data.meshes[idx];
    var material = this.data.materials[mesh.materialindex];
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer);
    gl.vertexAttribPointer(shaderProgram.normalAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
    gl.drawElements(gl.TRIANGLES, mesh.indexes.length, gl.UNSIGNED_SHORT, 0);
    this.timer.stop(0);
};

AssimpScene.prototype.draw = function(shaderProgram, mvMatrix, node) {
    "use strict";
    var i;
    var temp = mat4.create();

    if (!mvMatrix) {
        mvMatrix = mat4.create();
        mat4.identity(mvMatrix);
    }

    if (!node) {
        node = this.data.rootnode;
    }
    else {
        mat4.transpose(temp, node.transformation);
        mat4.mul(mvMatrix, mvMatrix, temp);
    }

    if (node.meshes) {
        this.gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
        for (i in node.meshes)
            this.drawMesh(node.meshes[i], shaderProgram);
    }

    if (node.children) {
        for (i in node.children) {
            this.draw(shaderProgram, mat4.clone(mvMatrix), node.children[i]);
        }
    }
};

function Renderer(canvas_id, stats, timer, engine) {
    "use strict";
    window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
        window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    this.canvas = document.getElementById(canvas_id);
    //TODO: Check it's a canvas
    this.timer = timer;
    if (stats)
        this.stats = stats;
    this.manager = new ResourceManager();
    engine.renderer = this;

    this.gl = undefined;

    this.pMatrix = mat4.create();
    this.mvMatrix = mat4.create();
    this.lookatMatrix = mat4.create();
    mat4.identity(this.lookatMatrix);
    this.initGL(this.canvas);
    if (!this.gl) {
        return;
    }


    this.initShaders();
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.initFB();



    mat4.perspective(this.pMatrix, 45, this.gl.canvas.width / this.gl.canvas.height, 1.1, 10000.0);
    mat4.identity(this.mvMatrix);

    mat4.lookAt(this.lookatMatrix, [0, 0, 120], [0, 0, 0], [0, 1, 0]);
    //mat4.translate(this.mvMatrix, this.mvMatrix, [0, 0.0, -120]);
    this.gl.enable(this.gl.DEPTH_TEST);

    this.currCamera = new Camera(engine);

    console.dir(this.gl.getSupportedExtensions());
    //setInterval(this.drawScene.bind(this), 1000/60);
}

Renderer.prototype.initGL = function(canvas) {
    "use strict";
    try {
        this.rawgl = canvas.getContext("experimental-webgl") || canvas.getContext("webgl");
    }
    catch (e) {
        window.alert("WebGL couldn't be initialized.");
        throw e;
    }

    if (!this.rawgl) {
        console.error("Unable to load webgl");
        return;
    }
    function logGLCall(functionName, args) {
        console.log("gl." + functionName + "(" +
            WebGLDebugUtils.glFunctionArgsToString(functionName, args) + ")"); //jshint ignore:line
    }
    this.gl = this.rawgl;
//    this.gl = WebGLDebugUtils.makeDebugContext(this.rawgl, undefined, logGLCall);
    this.gl = WebGLDebugUtils.makeDebugContext(this.rawgl); //jshint ignore:line


    this.extDepth = this.gl.getExtension("WEBGL_depth_texture");
    this.extDraw = this.gl.getExtension("WEBGL_draw_buffers");
    console.dir(this.extDraw);
    this.extFloat = this.gl.getExtension("OES_texture_float");
};


Renderer.prototype.initShaders = function() {
    "use strict";
    var gl = this.gl;

    function printShader(source) {
        var lines = source.split("\n");
        var i;
        for (i = 0; i < lines.length; ++ i) {
            lines[i] = (i + 1) + ": " + lines[i];
        }
        console.log(lines.join("\n"));

    }
    function getShader(id) {
        var shaderScript, theSource, currentChild, shader;

        shaderScript = document.getElementById(id);

        if (!shaderScript) {
            return null;
        }

        theSource = "";
        currentChild = shaderScript.firstChild;

        while (currentChild) {
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
            printShader(theSource);
            alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));

            return null;
        }

        return shader;
    }

    function createProgram(vertexShaderName, fragmentShaderName) {
        var shaderProgram = gl.createProgram();
        var fragmentShader = getShader(fragmentShaderName);
        var vertexShader = getShader(vertexShaderName);

        gl.attachShader(shaderProgram, vertexShader);

        gl.attachShader(shaderProgram, fragmentShader);

        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            console.error("Unable to initialize the shader program.");
        }
        return shaderProgram;
    }

    var shaderProgram = createProgram("shader-vs", "shader-fs");
    var lastProgram = createProgram("last-vs", "last-fs");

    this.gl.useProgram(shaderProgram);

    var shaders = [shaderProgram, lastProgram];
    var i, cShader;
    for (i = 0; i < shaders.length; ++i) {
        cShader = shaders[i];
        this.gl.useProgram(cShader);
        cShader.vertexPositionAttribute = this.gl.getAttribLocation(cShader, "aVertexPosition");
        cShader.normalAttribute = this.gl.getAttribLocation(cShader, "aNormal");
        this.gl.enableVertexAttribArray(cShader.vertexPositionAttribute);
        this.gl.enableVertexAttribArray(cShader.normalAttribute);
        if (cShader.vertexPositionAttribute === -1 || cShader.normalAttribute === -1) {
            console.log("Problem in shader:" + i);
        }

        cShader.pMatrixUniform = this.gl.getUniformLocation(cShader, "uPMatrix");
        cShader.mvMatrixUniform = this.gl.getUniformLocation(cShader, "uMVMatrix");
        cShader.lookat = this.gl.getUniformLocation(cShader, "uLookAt");
    }

    this.shaders = shaders;
    this.shaderProgram = shaderProgram;
};

Renderer.prototype.initFB = function() {
    "use strict";
    var gl = this.gl;
    var i;
    this.fbo = gl.createFramebuffer();
    this.intermediate = this.createFBTexture(gl.RGBA, gl.UNSIGNED_BYTE);
    this.depthText = this.createFBTexture(gl.DEPTH_STENCIL, this.extDepth.UNSIGNED_INT_24_8_WEBGL);
    this.depthPrec = this.createFBTexture(gl.RGBA, gl.FLOAT);
    this.normal = this.createFBTexture(gl.RGBA, gl.FLOAT);
    this.bufs = [];
    for (i = 0; i < 4; ++i) {
        this.bufs[i] = this.extDraw.COLOR_ATTACHMENT0_WEBGL + i;
    }
};

Renderer.prototype.drawBuffer = function(buffer) {
    "use strict";
    var gl = this.gl;

};

Renderer.prototype.setMatrixUniform = function() {
    "use strict";
    var gl = this.gl;
    gl.uniformMatrix4fv(this.shaderProgram.pMatrixUniform, false, this.pMatrix);
    gl.uniformMatrix4fv(this.shaderProgram.mvMatrixUniform, false, this.mvMatrix);
    gl.uniformMatrix4fv(this.shaderProgram.lookat, false, this.lookatMatrix);
    gl.uniform2fv(gl.getUniformLocation(this.shaderProgram, 'resolution'), [gl.canvas.width, gl.canvas.height]);
};

Renderer.prototype.renderObject = function() {
    "use strict";

};

Renderer.prototype.createFBTexture = function(type, size, type2) {
    "use strict";
    var gl = this.gl;
    var texture = gl.createTexture();
    if (!type2) {
        type2 = type;
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, type, gl.canvas.width, gl.canvas.height, 0, type2, size, null);
    return texture;
};

Renderer.prototype.drawFullScreenQuad = function() {
    "use strict";
    var gl = this.gl;
    if (!this.quad_vertex_buffer) {
        this.quad_vertex_buffer = gl.createBuffer();
        var quad_vertex_buffer_data = new Float32Array([
            -1.0, -1.0, 0.0,
            1.0, -1.0, 0.0,
            -1.0, 1.0, 0.0,
            -1.0, 1.0, 0.0,
            1.0, -1.0, 0.0,
            1.0, 1.0, 0.0]);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quad_vertex_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, quad_vertex_buffer_data, gl.STATIC_DRAW);
    }

    var quad_vertex_buffer = this.quad_vertex_buffer;

    gl.bindBuffer(gl.ARRAY_BUFFER, quad_vertex_buffer);
    gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
};

Renderer.prototype.drawScene = function() {
    "use strict";

    var gl = this.gl;

    if (!this.currScene) {
        return;
    }

    gl.enable(gl.DEPTH_TEST);
    this.shaderProgram = this.shaders[0];
    gl.useProgram(this.shaderProgram);


    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    this.extDraw.drawBuffersWEBGL(this.bufs);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, this.bufs[0], gl.TEXTURE_2D, this.intermediate, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, this.bufs[1], gl.TEXTURE_2D, this.depthPrec, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, this.bufs[2], gl.TEXTURE_2D, this.normal, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.TEXTURE_2D, this.depthText, 0);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT); //jshint ignore:line

    this.currCamera.animate();

    this.setMatrixUniform();

    this.timer.start(1);
    this.currScene.draw(this.shaderProgram, mat4.clone(this.mvMatrix));
    this.timer.stop(1);

    this.shaderProgram = this.shaders[1];
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    //this.extDraw.drawBuffersWEBGL(null);
    gl.disable(gl.DEPTH_TEST);
    //gl.disable(gl.STENCIL_TEST);
    //gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    gl.useProgram(this.shaderProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.intermediate);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.depthText);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.depthPrec);

    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, this.normal);
    var i;
    for (i = 0; i < 4; ++i) {
        gl.uniform1i(gl.getUniformLocation(this.shaderProgram, "uSampler" + i), i);
    }

    this.setMatrixUniform();

    this.drawFullScreenQuad();
};
