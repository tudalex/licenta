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
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttrib, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer);
    gl.vertexAttribPointer(shaderProgram.normalAttrib, 3, gl.FLOAT, false, 0, 0);

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

    if (!node)
        node = this.data.rootnode;
    else {
        mat4.transpose(temp, node.transformation);
        mat4.mul(mvMatrix, mvMatrix, temp);
    }

    if (node.meshes) {
        this.gl.uniformMatrix4fv(shaderProgram.mMatUniform, false, mvMatrix);
        for (i = 0; i < node.meshes.length; ++i)
            this.drawMesh(node.meshes[i], shaderProgram);
    }

    if (node.children) {
        var cloneMatrix = mat4.create();
        for (i = 0; i < node.children.length; ++i) {
            mat4.copy(cloneMatrix, mvMatrix);
            this.draw(shaderProgram, cloneMatrix, node.children[i]);
        }
    }
};

function Renderer(canvas_id, stats, timer, engine) {
    "use strict";

    window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
        window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    this.canvas = document.getElementById(canvas_id);

    if (!this.initGL(this.canvas)) {
        return;
    }

    this.timer = timer;
    if (stats)
        this.stats = stats;

    this.manager = new ResourceManager();
    engine.renderer = this;

    this.pMat = mat4.create();
    this.pInvMatrix = mat4.create();
    this.mMat = mat4.create();
    this.vMat = mat4.create();

    mat4.identity(this.vMat);
    mat4.perspective(this.pMat, 45, this.gl.canvas.width / this.gl.canvas.height, 1.0, 1001.0);
    mat4.invert(this.pInvMatrix, this.pMat);
    mat4.identity(this.mMat);
    mat4.lookAt(this.vMat, [0, 0, 120], [0, 0, 0], [0, 1, 0]);

    this.initFullScreenQuad();
    this.initFB();


    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.enable(this.gl.DEPTH_TEST);

    this.currCamera = new Camera(engine);
}

Renderer.prototype.initGL = function(canvas) {
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
            WebGLDebugUtils.glFunctionArgsToString(functionName, args) + ")");
    }

    this.gl = this.rawgl;
//    this.gl = WebGLDebugUtils.makeDebugContext(this.rawgl, undefined, logGLCall);
//    this.gl = WebGLDebugUtils.makeDebugContext(this.rawgl);

    console.dir(this.gl.getSupportedExtensions());
    this.extDepth = this.gl.getExtension("WEBGL_depth_texture");
    this.extDraw = this.gl.getExtension("WEBGL_draw_buffers");
    this.extFloat = this.gl.getExtension("OES_texture_float");

    return this.gl;
};


Renderer.prototype.createShader = function(name, type) {
    "use strict";
    var gl = this.gl;

    var url = 'shaders/' + name + '.' + (type == gl.VERTEX_SHADER ? 'vs' : 'fs');

    return ajax(url, 'text')
        .then(function(e) {
            var shader = gl.createShader(type);
            gl.shaderSource(shader, e.target.response);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                var msg = "An error occurred compiling '" + url + "'\n" + gl.getShaderInfoLog(shader);
                throw new Error(msg);
            }
            return shader;
        });
};

Renderer.prototype.createProgram = function(vsName, fsName) {
    "use strict";
    var gl = this.gl;

    if (!fsName)
        fsName = vsName;

    var vsPromise = this.createShader(vsName, gl.VERTEX_SHADER),
        fsPromise = this.createShader(fsName, gl.FRAGMENT_SHADER);

    return Promise.join(vsPromise, fsPromise,
        function(vertexShader, fragmentShader) {
            var program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);

            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                var msg = "An error occurred linking '"
                    + vsName + "' and '"
                    + fsName + "' \n"
                    + gl.getProgramInfoLog(program);
                throw new Error(msg);
            }
            return program;
        }).bind(this);
};


Renderer.prototype.loadGeometryPassProg = function() {
    "use strict";
    var gl = this.gl;
    return this.createProgram('geometryPass')
        .then(function(program) {
            gl.useProgram(program);

            program.vertexPositionAttrib = gl.getAttribLocation(program, "aVertexPosition");
            program.normalAttrib = gl.getAttribLocation(program, "aNormal");

            gl.enableVertexAttribArray(program.vertexPositionAttrib);
            gl.enableVertexAttribArray(program.normalAttrib);

            program.pMatUniform = gl.getUniformLocation(program, "uPmat");
            program.mMatUniform = gl.getUniformLocation(program, "uMmat");
            program.vMatUniform = gl.getUniformLocation(program, "uVmat");

            this.geometryPassProg = program;
            return program;
        });
};

Renderer.prototype.loadLightPassProg = function() {
    "use strict";
    var gl = this.gl;
    return this.createProgram('lightPass')
        .then(function(program) {
            gl.useProgram(program);

            program.vertexPositionAttrib = gl.getAttribLocation(program, "aVertexPosition");
            program.rayAttrib = gl.getAttribLocation(program, "aRay");

            gl.enableVertexAttribArray(program.vertexPositionAttrib);
            gl.enableVertexAttribArray(program.rayAttrib);

            program.pMatUniform = gl.getUniformLocation(program, "uPmat");
            program.resolutionUniform = gl.getUniformLocation(program, "resolution");

            this.lightPassProg = program;
            return program;
        });
};

Renderer.prototype.loadShaderPrograms = function() {
    "use strict";
    var programs = [
        this.loadGeometryPassProg(),
        this.loadLightPassProg()
    ];

    return Promise.all(programs);
}

Renderer.prototype.initFB = function() {
    "use strict";

    var gl = this.gl;
    this.fbo = gl.createFramebuffer();
    this.intermediate = this.createFBTexture(gl.RGBA, gl.UNSIGNED_BYTE);
    this.depthText = this.createFBTexture(gl.DEPTH_COMPONENT, gl.UNSIGNED_INT);
    this.depthPrec = this.createFBTexture(gl.RGBA, gl.FLOAT);
    this.normal = this.createFBTexture(gl.RGBA, gl.FLOAT);

    this.bufs = [];
    var i;
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
    gl.uniformMatrix4fv(this.shaderProgram.pMatUniform, false, this.pMat);
    gl.uniformMatrix4fv(this.shaderProgram.mMatUniform, false, this.mMat);
    gl.uniformMatrix4fv(this.shaderProgram.vMatUniform, false, this.vMat);
    gl.uniform2fv(this.shaderProgram.resolutionUniform, [gl.canvas.width, gl.canvas.height]);
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


Renderer.prototype.initFullScreenQuad = function() {
    "use strict";
    var gl = this.gl;

    var quadBufferData = new Float32Array([
        -1., 1., 0.,    // lower right
        -1., -1., 0.,   // lower left
        1., 1., 0.,     // upper right
        1., -1., 0.]);  // upper left

    this.quadVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadBufferData, gl.STATIC_DRAW);


    var quadRayData = new Float32Array(4 * 2);

    var i, j, k = 0, l = 0;

    for (i = 0; i < 4; ++i) {
        var corner = vec4.create();
        corner[3] = 1.0;
        for (j = 0; j < 3; ++j, ++k) {
            corner[j] = quadBufferData[k];
        }

        var ray = vec4.create();
        //console.log(corner);
        vec4.transformMat4(ray, corner, this.pInvMatrix);
        //console.log(ray);

        vec4.scale(ray, ray, 1.0 / ray[3]);
        vec4.scale(ray, ray, 1.0 / ray[2]);


        for (j = 0; j < 2; ++j, ++l) {
            quadRayData[l] = ray[j];
        }
    }



    this.quadRayBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadRayBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadRayData, gl.STATIC_DRAW);
};

Renderer.prototype.drawFullScreenQuad = function() {
    "use strict";
    var gl = this.gl;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadRayBuffer);
    gl.vertexAttribPointer(this.shaderProgram.rayAttrib, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVertexBuffer);
    gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttrib, 3, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

};

Renderer.prototype.drawScene = function() {
    "use strict";
    var gl = this.gl;

    if (!this.currScene) {
        return;
    }

    gl.enable(gl.DEPTH_TEST);
    this.shaderProgram = this.geometryPassProg;
    gl.useProgram(this.shaderProgram);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    this.extDraw.drawBuffersWEBGL(this.bufs);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, this.bufs[0], gl.TEXTURE_2D, this.intermediate, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, this.bufs[1], gl.TEXTURE_2D, this.depthPrec, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, this.bufs[2], gl.TEXTURE_2D, this.normal, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depthText, 0);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.currCamera.animate();

    this.setMatrixUniform();

    this.timer.start(1);
    this.currScene.draw(this.shaderProgram, mat4.clone(this.mMat));
    this.timer.stop(1);

    this.shaderProgram = this.lightPassProg;
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
        var location = gl.getUniformLocation(this.shaderProgram, "uSampler" + i);
        //console.log("" + i + " " + location );
        gl.uniform1i(location, i);
    }

    this.setMatrixUniform();
    this.drawFullScreenQuad();
};
