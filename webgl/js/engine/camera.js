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


}

Camera.prototype.animate = function (time) { //FIXME: Probably wrong name for the function
    "use strict";
    var temp;

    //noinspection StatementWithEmptyBodyJS
    if (this.input.action('forward')) {
        temp = vec3.create();
        vec3.subtract(temp, this.eye,this.center); // move twords center
        console.log(temp.toString());

        vec3.normalize(temp, temp);
        vec3.scale(temp, temp, 7);
        vec3.subtract(this.eye, this.eye, temp);

    }
    if (this.input.action('backward')) {
        temp = vec3.create();
        vec3.subtract(temp, this.eye,this.center); // move twords center
        vec3.normalize(temp, temp);
        vec3.scale(temp, temp, 7);
        vec3.add(this.eye, this.eye, temp);
        console.log(temp.toString());
    }
    mat4.lookAt(this.renderer.lookatMatrix, this.eye, this.center, this.up);

};
