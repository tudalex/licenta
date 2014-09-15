function createGlUniformObjectFactories(gl) {
    "use strict";

    function UniformFactory(program, name, path) {
        path = path ? path + '.' + name : name;


        console.log('binding on ' + path);
        var loc = gl.getUniformLocation(program, path);
        if (loc == -1) {
            console.error('getUniformLocation failed for ' + path);
            return;
        }

        function Uniform(props) {
            this.val = this.prepVal(props[name]);
        }

        Uniform.prototype.loc = loc;
        return Uniform;
    }

    function createUniformFactory(upload, prepVal) {
        prepVal = prepVal || function(val) { return val; };
        function ExtendedUniformFactory() {
            var clz = UniformFactory.apply(this, arguments);
            clz.prototype.upload = upload;
            clz.prototype.prepVal = prepVal;
            return clz;
        }

        return ExtendedUniformFactory;
    }

    gl.uniformFactories = {
        u1f: createUniformFactory(
            function() {
                gl.uniform1f(this.loc, this.val);
            },
            function(val) {
                return val || 0.;
            }),
        u3f: createUniformFactory(
            function() {
                gl.uniform3fv(this.loc, this.val);
            },
            function(val) {
                val = val || [0, 0, 0];
                return vec3.fromValues(val[0], val[1], val[2]);
            })
    };
}







/*
 struct BaseLight {
     vec3 color;
     float ambientIntensity;
     float diffuseIntensity;
 };
 */
function BaseLightFactory(gl, program, name, path) {
    "use strict";

    path = path ? path + '.' + name : name;

    var color = initU3f('color'),
        ambientIntensity = initU1f('ambientIntensity'),
        diffuseIntensity = initU1f('diffuseIntensity');

    function BaseLight(props) {
        props = props[name];
        this.color = new color(props);
        this.ambientIntensity = new ambientIntensity(props);
        this.diffuseIntensity = new diffuseIntensity(props);
    }

    BaseLight.prototype.upload = function() {
        this.color.upload();
        this.ambientIntensity.upload();
        this.diffuseIntensity.upload();
    };

    return BaseLight;

    function initU3f(name) {
        return gl.uniformFactories.u3f(program, name, path);
    }

    function initU1f(name) {
        return gl.uniformFactories.u1f(program, name, path);
    }
}









/*
 struct DirectionalLight {
     BaseLight base;
     vec3 direction;
 };
 */
function DirectionalLightFactory(gl, program, name, path) {
    "use strict";

    path = path ? path + '.' + name : name;

    var base = BaseLightFactory(gl, program, 'base', path),
        direction = gl.uniformFactories.u3f(program, 'direction', path);


    function DirectionalLight(props) {
        props = props[name];
        this.base = new base(props);
        this.direction = new direction(props);
    }

    DirectionalLight.prototype.upload = function() {
        this.base.upload();
        this.direction.upload();
    };

    return DirectionalLight;

}


/*
 struct Attenuation {
     float constant;
     float linear;
     float exp;
 };
 */
function AttenuationFactory(gl, program, name, path) {
    "use strict";

    path = path ? path + '.' + name : name;

    var constant = initU1f('constant'),
        linear = initU1f('linear'),
        exp = initU1f('exp');

    function Attenuation(props) {
        props = props[name];
        this.constant = new constant(props);
        this.linear = new linear(props);
        this.exp = new exp(props);
    }

    Attenuation.prototype.upload = function() {
        this.constant.upload();
        this.linear.upload();
        this.exp.upload();
    };

    return Attenuation;

    function initU1f(name) {
        return gl.uniformFactories.u1f(program, name, path);
    }
}


/*
 struct PointLight {
     BaseLight base;
     vec3 position;
     Attenuation atten;
 };
 */
function PointLightFactory(gl, program, name, path) {
    "use strict";

    path = path ? path + '.' + name : name;

    var base = BaseLightFactory(gl, program, 'base', name),
        position = gl.uniformFactories.u3f(program, 'position', name),
        atten = AttenuationFactory(gl, program, 'atten', name);

    function PointLight(props) {
        props = props[name];
        this.base = new base(props);
        this.position = new position(props);
        this.atten = new atten(props);
    }

    PointLight.prototype.upload = function() {
        this.base.upload();
        this.position.upload();
        this.atten.upload();
    };

    return PointLight;
}


/*
 struct SpotLight {
     PointLight base;
     vec3 direction;
     float cutoff;
 };
 */
function SpotLightFactory(gl, program, name, path) {
    "use strict";

    path = path ? path + '.' + name : name;

    var base = PointLightFactory(gl, program, 'base', name),
        direction = gl.uniformFactories.u3f(program, 'direction', name),
        cutoff = AttenuationFactory(gl, program, 'cutoff', name);

    function SpotLight(props) {
        props = props[name];
        this.base = new base(props);
        this.direction = new direction(props);
        this.cutoff = new cutoff(props);
    }

    SpotLight.prototype.upload = function() {
        this.base.upload();
        this.direction.upload();
        this.cutoff.upload();
    };

    return SpotLight;
}


/*
 struct Material {
     float specularIntensity;
     float specularPower;
 };
 */

function MaterialFactory(gl, program, name, path) {
    "use strict";

    path = path ? path + '.' + name : name;

    var specularIntensity = gl.uniformFactories.u1f(program, 'specularIntensity', name),
        specularPower = gl.uniformFactories.u1f(program, 'specularPower', name);

    function Material(props) {
        props = props[name];
        this.specularIntensity = new specularIntensity(props);
        this.specularPower = new specularPower(props);
    }

    Material.prototype.upload = function() {
        this.specularIntensity.upload();
        this.specularPower.upload();
    };

    return Material;
}
