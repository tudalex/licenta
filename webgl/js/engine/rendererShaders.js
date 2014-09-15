Renderer.prototype.createShader = function(name, type) {
    "use strict";
    var gl = this.gl;

    var url = 'shaders/' + name + '.' + (type === gl.VERTEX_SHADER ? 'vs' : 'fs');

    return ajax(url, 'text')
        .then(function(e) {
            var shader = gl.createShader(type);
            gl.shaderSource(shader, e.target.response);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                var msg = "An error occurred compiling '"
                    + url + "'\n" + gl.getShaderInfoLog(shader);
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
            program.texAttrib = gl.getAttribLocation(program, "aTextureCoord");

            gl.enableVertexAttribArray(program.vertexPositionAttrib);
            gl.enableVertexAttribArray(program.normalAttrib);
            gl.enableVertexAttribArray(program.texAttrib);

            program.pMatUniform = gl.getUniformLocation(program, "uPmat");
            program.mMatUniform = gl.getUniformLocation(program, "uMmat");
            program.vMatUniform = gl.getUniformLocation(program, "uVmat");

            program.samplers = _.range(1).map(function(i) {
                return gl.getUniformLocation(program, "uSampler" + i);
            });

            this.geometryPassProg = program;
            return program;
        });
};


Renderer.prototype.loadNullPassProg = function() {
    "use strict";
    var gl = this.gl;
    return this.createProgram('nullPass')
        .then(function(program) {
            gl.useProgram(program);

            program.vertexPositionAttrib = gl.getAttribLocation(program, "aVertexPosition");

            gl.enableVertexAttribArray(program.vertexPositionAttrib);

            program.pMatUniform = gl.getUniformLocation(program, "uPmat");
            program.mMatUniform = gl.getUniformLocation(program, "uMmat");
            program.vMatUniform = gl.getUniformLocation(program, "uVmat");

            program.samplers = [];

            this.nullPassProg = program;
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
            program.resUniform = gl.getUniformLocation(program, "resolution");

            program.samplers = _.range(4).map(function(i) {
                return gl.getUniformLocation(program, "uSampler" + i);
            });

            this.lightPassProg = program;

            var lightFactory = PointLightFactory(gl, program, 'uPointLight');
            var materialFactory = MaterialFactory(gl, program, 'uMat');

            var props = {
                uPointLight: {
                    position: [ 0, 1000, -50 ],
                    base: {
                        color: [ 1, 0, 0 ],
                        ambientIntensity: 0.2,
                        diffuseIntensity: 0.9
                    },
                    atten: {
                        constant: 0,
                        linear: 0,
                        exp: 0.3
                    }
                },
                uMat: {
                    specularIntensity: 0.5,
                    specularPower: 40
                }
            };

            this.testPointLight = new lightFactory(props);
            this.testMat = new materialFactory(props);

            return program;
        });
};

Renderer.prototype.loadShaderPrograms = function() {
    "use strict";
    var programs = [
        this.loadNullPassProg(),
        this.loadGeometryPassProg(),
        this.loadLightPassProg()
    ];

    return Promise.all(programs);
};