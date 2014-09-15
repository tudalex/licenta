/**
 * Created by tudalex on 07.03.2014.
 */

function Renderer(canvas_id, stats, timer, engine) {
    "use strict";

    window.requestAnimationFrame = window.requestAnimationFrame
        || window.mozRequestAnimationFrame
        || window.webkitRequestAnimationFrame
        || window.msRequestAnimationFrame;

    this.canvas = document.getElementById(canvas_id);
    if (!this.canvas) {
        throw new Error("Could not find canvas");
    }

    this.initGL(this.canvas);

    this.timer = timer;
    if (stats) {
        this.stats = stats;
    }

    this.manager = new ResourceManager();
    engine.renderer = this;

    this.initMat();
    this.initFullScreenQuad();
    this.initFB();

    this.initLightVolumes();

    this.currCamera = new Camera(engine);
    this.currScene = {
        draw: function() {}
    };

    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.enable(this.gl.DEPTH_TEST);
}

Renderer.prototype.initMat = function() {
    this.pMat = mat4.create();
    this.pInvMatrix = mat4.create();
    this.mMat = mat4.create();
    this.vMat = mat4.create();

    mat4.identity(this.vMat);
    mat4.perspective(this.pMat, 45, this.gl.canvas.width / this.gl.canvas.height, 1.0, 1001.0);
    mat4.invert(this.pInvMatrix, this.pMat);
    mat4.identity(this.mMat);
    mat4.lookAt(this.vMat, [0, 0, 120], [0, 0, 0], [0, 1, 0]);
}

Renderer.prototype.initGL = function(canvas) {
    "use strict";
    this.rawgl = canvas.getContext("experimental-webgl")
        || canvas.getContext("webgl");

    if (!this.rawgl) {
        throw new Error("Unable to load webgl");
    }

    function logGLCall(functionName, args) {
        console.log("gl." + functionName + "(" +
            WebGLDebugUtils.glFunctionArgsToString(functionName, args) + ")");
    }

    this.gl = this.rawgl;//.rawgl;
//    this.gl = WebGLDebugUtils.makeDebugContext(this.rawgl, undefined, logGLCall);
//    this.gl = WebGLDebugUtils.makeDebugContext(this.rawgl);

    //console.dir(this.gl.getSupportedExtensions());
    this.extDepth = this.gl.getExtension("WEBGL_depth_texture");
    this.extDraw = this.gl.getExtension("WEBGL_draw_buffers");
    this.extFloat = this.gl.getExtension("OES_texture_float");
    this.extFloatLinear = this.gl.getExtension("OES_texture_float_linear");

    createGlUniformObjectFactories(this.gl);

    window.gl = this.gl;
    return this.gl;
};


Renderer.prototype.initFB = function() {
    "use strict";

    var gl = this.gl;
    this.fbo = gl.createFramebuffer();
    this.intermediate = this.createFBTexture(gl.RGBA, gl.FLOAT);
    this.depthText = this.createFBTexture(gl.DEPTH_COMPONENT, gl.UNSIGNED_INT);
    this.depthPrec = this.createFBTexture(gl.RGBA, gl.FLOAT);
    this.normal = this.createFBTexture(gl.RGBA, gl.FLOAT);

    this.bufs = [];
    var i;
    for (i = 0; i < 4; ++i) {
        this.bufs[i] = this.extDraw.COLOR_ATTACHMENT0_WEBGL + i;
    }
};



Renderer.prototype.setMatrixUniform = function() {
    "use strict";
    var gl = this.gl;
    gl.uniformMatrix4fv(this.shaderProgram.pMatUniform, false, this.pMat);
    gl.uniformMatrix4fv(this.shaderProgram.mMatUniform, false, this.mMat);
    gl.uniformMatrix4fv(this.shaderProgram.vMatUniform, false, this.vMat);
    gl.uniform2fv(this.shaderProgram.resUniform, [gl.canvas.width, gl.canvas.height]);
};



Renderer.prototype.checkFramebufferStatus = function() {
    "use strict";
    var gl = this.gl;
    var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    switch (status) {
        case gl.FRAMEBUFFER_COMPLETE:
            break;
        case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
            console.log("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_ATTACHMENT");
            break;
        case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
            console.log("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT");
            break;
        case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
            console.log("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_DIMENSIONS");
            break;
        case gl.FRAMEBUFFER_UNSUPPORTED:
            throw("Incomplete framebuffer: FRAMEBUFFER_UNSUPPORTED");
            break;
        default:
            throw("Incomplete framebuffer: " + status);
    }
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
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, type === gl.FLOAT ? gl.LINEAR : gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, type === gl.FLOAT ? gl.LINEAR : gl.NEAREST);
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

    if (this.shaderProgram.rayAttrib !== -1) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadRayBuffer);
        gl.vertexAttribPointer(this.shaderProgram.rayAttrib, 2, gl.FLOAT, false, 0, 0);
    }

    if (this.shaderProgram.vertexPositionAttrib !== -1) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVertexBuffer);
        gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttrib, 3, gl.FLOAT, false, 0, 0);
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

};


Renderer.prototype.initLightVolumes = function() {
    "use strict";
    var gl = this.gl;

    var sphere = buildSphere(2);
    var cone = buildCone(64);

    this.lightVolumes = {
        sphere: createBuffers(sphere),
        cone: createBuffers(cone)
    };

    function createBuffers(mesh) {
        var vertBuff = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertBuff);
        gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW);

        var indBuff = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indBuff);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);

        return {
            vertexBuffer: vertBuff,
            indexBuffer: indBuff,
            indexLength: mesh.indices.length
        }
    }
};

Renderer.prototype.drawLightVolume = function(mesh) {
    "use strict";
    var gl = this.gl;

    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
    gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttrib, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
    gl.drawElements(gl.TRIANGLES, mesh.indexLength, gl.UNSIGNED_SHORT, 0);
};

Renderer.prototype.drawScene = function() {
    "use strict";
    var gl = this.gl;
    //console.log("Frame start");
    gl.enable(gl.DEPTH_TEST);
    this.shaderProgram = this.geometryPassProg;
    gl.useProgram(this.shaderProgram);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);

    this.extDraw.drawBuffersWEBGL(this.bufs);

    //this.checkFramebufferStatus();
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depthText, 0);
    //this.checkFramebufferStatus();
    gl.framebufferTexture2D(gl.FRAMEBUFFER, this.bufs[0] , gl.TEXTURE_2D, this.intermediate, 0);
    //this.checkFramebufferStatus();
    gl.framebufferTexture2D(gl.FRAMEBUFFER, this.bufs[1] , gl.TEXTURE_2D, this.depthPrec, 0);
    //this.checkFramebufferStatus();
    gl.framebufferTexture2D(gl.FRAMEBUFFER, this.bufs[2] , gl.TEXTURE_2D, this.normal, 0);


    //gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.currCamera.animate();

    this.setMatrixUniform();

    this.timer.start(1);
    this.currScene.draw(this.shaderProgram, mat4.clone(this.mMat));
    this.timer.stop(1);

    this.shaderProgram = this.lightPassProg;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.STENCIL_TEST);
    gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    gl.useProgram(this.shaderProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.intermediate);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.depthText);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.depthPrec);

    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, this.normal);

    this.shaderProgram.samplers.map(function(location, i) {
        gl.uniform1i(location, i);
    });

    this.setMatrixUniform();


    var worldpos = this.testPointLight.position.val;
    var origpos = vec3.clone(worldpos);
    vec3.transformMat4(worldpos, worldpos, this.vMat);

    this.testPointLight.upload();
    vec3.copy(worldpos, origpos);


    this.testMat.upload();


    this.drawFullScreenQuad();

    this.shaderProgram = this.nullPassProg;
    gl.useProgram(this.shaderProgram);
    this.drawLightVolume(this.lightVolumes.cone);
};

Renderer.prototype.drawBuffer = function(buffer) {
    "use strict";
    var gl = this.gl;
};


Renderer.prototype.renderObject = function() {
    "use strict";
};
