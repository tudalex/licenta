precision highp float;
attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;
attribute vec3 aNormal;

uniform mat4 uMmat;
uniform mat4 uPmat;
uniform mat4 uVmat;


varying vec2 vTextureCoord;
varying vec3 fs_Normal;
varying vec4 fs_WorldPos;

varying float fs_Depth;

void main(void) {
    fs_WorldPos = uMmat * vec4(aVertexPosition, 1.0);
    gl_Position = uVmat * fs_WorldPos;

    fs_Depth = gl_Position.z / gl_Position.w;
    fs_Depth = 1. - (-fs_Depth - 1.0) / 1000.;

    gl_Position = uPmat * gl_Position;

    vTextureCoord = aTextureCoord;
    fs_Normal = (uMmat * uVmat * vec4(aNormal, 0.0)).xyz;
    fs_Normal = normalize(fs_Normal);
}
