
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

    for (i = 0; i < this.data.meshes.length; ++i) { //jshint ignore:line
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

        mesh.uvBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.uvBuffer);
        if (mesh.texturecoors) {
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.texturecoords[0]), gl.STATIC_DRAW);
        } else {
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.vertices.length / 3 * 2), gl.STATIC_DRAW);
        }
    }

    for (i = 0; i < this.data.materials.length; ++i) {
        material = this.data.materials[i];
        material.mat = {};
        material.tex = {};
        material.clr = {};
        for (j in material.properties) {
            key = material.properties[j].key.slice(1).split('.');
            material[key[0]][key[1]] = material.properties[j].value;
        }
        delete material.properties;
    }
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

    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.uvBuffer);
    gl.vertexAttribPointer(shaderProgram.texAttrib, 2, gl.FLOAT, false, 0, 0);

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
