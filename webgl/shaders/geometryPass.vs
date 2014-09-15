precision highp float;


attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;
attribute vec3 aNormal;

uniform mat4 uMmat;
uniform mat4 uPmat;
uniform mat4 uVmat;

varying vec2 vTextureCoord;
varying vec3 vNormal;

// varying float vDepth;
 varying vec3 vWorldPos;

void main(void) {
    gl_Position = uMmat * vec4(aVertexPosition, 1.0);
    gl_Position = uVmat * gl_Position;
    
    vWorldPos = gl_Position.xyz;
    
    // vDepth = gl_Position.z / gl_Position.w;
    // vDepth = 1. - (-fs_Depth - 1.0) / 1000.;

    gl_Position = uPmat * gl_Position;
    
    
    vTextureCoord = aTextureCoord;
    vNormal = (uVmat *  uMmat * vec4(aNormal, 0.0)).xyz;
}
