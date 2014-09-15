/**
 * Created by tudalex on 17.03.2014.
 */


function Camera(engine) {
    "use strict";
    this.input = engine.input;
    this.gl = engine.renderer.gl;
    this.renderer = engine.renderer;
    this.speed = 3;
    this.eye = [0, 0, 120];
    this.center = [0, 0, 0];
    this.up = [0, 1, 0];

    this.quat = quat.create();
}

Camera.prototype.animate = function(time) { //FIXME: Probably wrong name for the function
    "use strict";
    var temp;
    var input = this.input;
    if (input.action('forward')) {
        temp = vec3.create();
        vec3.subtract(temp, this.eye, this.center); // move twords center

        if (vec3.sqrLen(temp) > 10) {
            vec3.normalize(temp, temp);
            vec3.scale(temp, temp, 7);
            vec3.subtract(this.eye, this.eye, temp);
        }
    }
    if (input.action('backward')) {
        temp = vec3.create();
        vec3.subtract(temp, this.eye, this.center); // move twords center
        vec3.normalize(temp, temp);
        vec3.scale(temp, temp, 7);
        vec3.add(this.eye, this.eye, temp);
    }

    if (input.action('left')) {
        quat.rotateY(this.quat, this.quat, 0.03);
    }
    if (input.action('right')) {
        quat.rotateY(this.quat, this.quat, -0.03);
    }

    if (input.action('up')) {
        quat.rotateX(this.quat, this.quat, 0.03);
    }

    if (input.action('down')) {
        quat.rotateX(this.quat, this.quat, -0.03);
    }

    // Mouse movement
    var d = input.getMouseMove();
    var scale = 1. / 100;
    quat.rotateY(this.quat, this.quat, d[0] * scale);
    quat.rotateX(this.quat, this.quat, d[1] * scale);

    var processed_eye = vec3.create();
    var processed_up = vec3.create();
    vec3.transformQuat(processed_eye, this.eye, this.quat);
    vec3.transformQuat(processed_up, this.up, this.quat);
    mat4.lookAt(this.renderer.vMat, processed_eye, this.center, processed_up);
};

function FreeRoamCamera(engine) {
    Camera.call(this, engine);
    this.forward = vec3.fromValues(0, 0, 1);
    this.pos = vec3.fromValues(0, 0, -120);
}
FreeRoamCamera.prototype = Object.create(FreeRoamCamera.prototype);
FreeRoamCamera.prototype.animate = function(time) {
    "use strict";
    var input = this.input;
    if (input.action('forward')) {
        vec3.add(this.pos, this.pos, vec3.transformQuat(vec3.create(), this.forward, this.quat));
    }

    if (input.action('backward')) {
        vec3.subtract(this.pos, this.pos, vec3.transformQuat(vec3.create(), this.forward, this.quat));
    }

    // Mouse movement
    var d = input.getMouseMove();
    var scale = 1.0 / 100;
    quat.rotateY(this.quat, this.quat, d[0] * scale);
    quat.rotateX(this.quat, this.quat, d[1] * scale);

    mat4.fromRotationTranslation(this.renderer.vMat, this.quat, this.pos);
};
