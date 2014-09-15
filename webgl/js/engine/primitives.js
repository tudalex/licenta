/**
 * Created by tudalex-G73 on 9/13/2014.
 */
function Scene(gl) {
    "use strict";
    this.objects = [];
    this.gl = gl;
}

Scene.prototype.addObject = function(object) {
    "use strict";
    object.initGl(this.gl);
    this.objects.push(object);
};

Scene.prototype.draw = function(shaderProgram, mMat) { // mMat is unused since these objects have physics attached to them :)
    "use strict";
    var gl = this.gl;


    this.objects.map(function (object) {
     object.draw(shaderProgram);
    });
};

function SceneObject(mesh, manager) {
    "use strict";
    this.manager = manager;
    this.mesh = mesh;
    this.rotation = quat.create();
    this.position = vec3.create();
    this.scale = vec3.create();
    this.scale[0] = 1;
    this.scale[1] = 1;
    this.scale[2] = 1;
    this.gl = undefined;
    this.physics = undefined;
    this.physicsBody = undefined;
    this.mMat = mat4.create();
    this.texture = -1;
    this.shape = undefined;
}

SceneObject.prototype.updateModelMat = function() {
    if (this.physics !== undefined) {
        var ret = this.physics.readObjectPosition(this.physicsBody);
        this.position = ret[0];
        this.rotation = ret[1];
    }
    mat4.fromRotationTranslation(this.mMat, this.rotation, this.position);
    mat4.scale(this.mMat, this.mMat, this.scale);
};

SceneObject.prototype.setPosition = function(newPosition) {
    "use strict";
    this.position = newPosition;
};

SceneObject.prototype.setRotation = function(newRotation) {
    "use strict";
    this.rotation = newRotation;
};

SceneObject.prototype.setScale = function(newScale) {
    "use strict";
    this.scale = newScale;
};
SceneObject.prototype.setShape = function(newShape) {
    "use strict";
    if (this.shape !== undefined) {
        Ammo.destroy(this.shape);
    }
    this.shape = newShape;
};

SceneObject.prototype.initPhysics = function (physics, mass) {
    "use strict";
    if (mass === undefined) {
        mass = 1;
    }
    this.physics = physics;
    var p = this.position;
    this.shape.setLocalScaling(new Ammo.btVector3(this.scale[0], this.scale[1], this.scale[2]));
    this.physicsBody = physics.createBody(mass, new Ammo.btVector3(p[0], p[1], p[2]), this.shape);
};

SceneObject.prototype.initGl = function(gl) {
    "use strict";
    var mesh = this.mesh;
    this.gl = gl;
    mesh.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.vertices), gl.STATIC_DRAW);

    mesh.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indexes), gl.STATIC_DRAW);

    mesh.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.normal), gl.STATIC_DRAW);

    mesh.textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.textureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.uv), gl.STATIC_DRAW);

    if (mesh.texture) {
        mesh.texture.then(function(e) {
            var img = e.target;
            this.texture = this.manager.getTexture(img, gl);
        }.bind(this));
    }
};


SceneObject.prototype.draw = function(shaderProgram) {
    "use strict";
    var gl = this.gl;
    var mesh = this.mesh;
    this.updateModelMat();

    gl.uniformMatrix4fv(shaderProgram.mMatUniform, false, this.mMat);

    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttrib, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer);
    gl.vertexAttribPointer(shaderProgram.normalAttrib, 3, gl.FLOAT, false, 0, 0);

    if (shaderProgram.texAttrib !== -1) {
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.textureCoordBuffer);
        gl.vertexAttribPointer(shaderProgram.texAttrib, 2, gl.FLOAT, false, 0, 0);
    }

    if (mesh.texture && this.texture !== -1) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(program.samplers[0], 0);

    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
    gl.drawElements(gl.TRIANGLES, mesh.indexes.length , gl.UNSIGNED_SHORT, 0);
};

var ObjectFactory = {}; //jshint ignore:line
ObjectFactory.getBox = function(img, manager, size) {
    "use strict";
    var mesh = {};
    if (size === undefined) {
        size = [1, 1, 1];
    }
    mesh.vertices = [-0.5,0,0.5,-0.5,0,-0.5,0.5,0,-0.5,0.5,0,0.5,-0.5,1,0.5,0.5,1,0.5,0.5,1,-0.5,-0.5,1,-0.5,-0.5,0,0.5,0.5,0,0.5,0.5,1,0.5,-0.5,1,0.5,0.5,0,0.5,0.5,0,-0.5,0.5,1,-0.5,0.5,1,0.5,0.5,0,-0.5,-0.5,0,-0.5,-0.5,1,-0.5,0.5,1,-0.5,-0.5,0,-0.5,-0.5,0,0.5,-0.5,1,0.5,-0.5,1,-0.5];
    mesh.indexes = [0,1,2,0,2,3,4,5,6,4,6,7,8,9,10,8,10,11,12,13,14,12,14,15,16,17,18,16,18,19,20,21,22,20,22,23];

    mesh.uv = [1,0,1,1,0,1,0,0,0,0,1,0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,0,1,1,0,1];
    mesh.normal = [0,-1,-0,0,-1,-0,0,-1,-0,0,-1,-0,0,1,-0,0,1,-0,0,1,-0,0,1,-0,0,0,1,0,0,1,0,0,1,0,0,1,1,0,-0,1,0,-0,1,0,-0,1,0,-0,0,0,-1,0,0,-1,0,0,-1,0,0,-1,-1,0,-0,-1,0,-0,-1,0,-0,-1,0,-0];
    if (img) {
        mesh.texture = img;
    }
    //ObjectFactory.computeNormals(mesh);
    var ret = new SceneObject(mesh, manager);
    ret.setScale(new Float32Array(size));
    ret.setShape(new Ammo.btBoxShape(new Ammo.btVector3(1, 1, 1)));
    return ret;
};

ObjectFactory.computeNormals = function(mesh) {
    "use strict";
    mesh.normal = [];
    var normal = vec3.create(), ab = vec3.create(), ac = vec3.create();
    var v = [vec3.create(), vec3.create(), vec3.create()];
    var i, j, k;
    for (i = 0; i < mesh.indexes.length; i+=3) {
        for (j = 0; j < 3; ++j) {
            for (k = 0; k < 3; ++k) {
                v[j][k] = mesh.vertices[mesh.indexes[i + j] * 3 + k];
            }
        }
        vec3.subtract(ab, v[1], v[0]);
        vec3.subtract(ac, v[2], v[0]);
        vec3.cross(normal, ab, ac);
        vec3.normalize(normal, normal);
        for (j = 0; j < 3; ++j) {
            for (k = 0; k < 3; ++k) {
                mesh.normal.push(normal[k]);
            }
        }
    }
    return mesh;
};
