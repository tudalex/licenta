precision highp float;
attribute vec3 aVertexPosition;

uniform mat4 uMmat;
uniform mat4 uPmat;
uniform mat4 uVmat;

void main(void) {
    gl_Position = uPmat * uVmat * uMmat * vec4(aVertexPosition, 1.0);
}
