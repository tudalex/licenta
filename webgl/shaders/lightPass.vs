precision highp float;
attribute vec3 aVertexPosition;
attribute vec2 aRay;

varying vec2 vRay;

void main(void) {
    gl_Position = vec4(aVertexPosition, 1.0);
    vRay = aRay;
}
