precision highp float;
varying vec2 vRay;

uniform sampler2D uSampler0;
uniform sampler2D uSampler1;
uniform sampler2D uSampler2;
uniform sampler2D uSampler3;

#define intermSampler       uSampler0
#define depthSampler        uSampler1
#define depthPrecSampler    uSampler2
#define normalSampler       uSampler3

uniform mat4 uPmat;
uniform vec2 resolution;




vec4 packFloatToVec4 (const float value) {
    vec4 bitSh = vec4 ( 256.0 * 256.0 * 256.0, 256.0 * 256.0, 256.0, 1.0);
    vec4 bitMask = vec4(0.0, 1.0/256.0, 1.0/256.0, 1.0/256.0);
    vec4 res = fract(value * bitSh);
    res -= res.xxyz * bitMask;
    return res;
}

float unpackFloatFromVec4 (const vec4 value) {
    const vec4 bitSh = vec4(1.0/ (256.0 * 256.0 * 256.0), 1.0/(256.0 * 256.0), 1.0/256.0, 1.0);
    return dot(value, bitSh);
}

highp vec4 encode32(highp float f) {
    highp float e =5.0;

    highp float F = abs(f);
    highp float Sign = step(0.0,-f);
    highp float Exponent = floor(log2(F));
    highp float Mantissa = (exp2(- Exponent) * F);
    Exponent = floor(log2(F) + 127.0) + floor(log2(Mantissa));
    highp vec4 rgba;
    rgba[0] = 128.0 * Sign  + floor(Exponent*exp2(-1.0));
    rgba[1] = 128.0 * mod(Exponent,2.0) + mod(floor(Mantissa*128.0),128.0);
    rgba[2] = floor(mod(floor(Mantissa*exp2(23.0 -8.0)),exp2(8.0)));
    rgba[3] = floor(exp2(23.0)*mod(Mantissa,exp2(-15.0)));
    return rgba;
}

highp float decode32(highp vec4 rgba) {
    highp float Sign = 1.0 - step(128.0,rgba[0])*2.0;
    highp float Exponent = 2.0 * mod(rgba[0],128.0) + step(128.0,rgba[1]) - 127.0;
    highp float Mantissa = mod(rgba[1],128.0)*65536.0 + rgba[2]*256.0 +rgba[3] + float(0x800000);
    highp float Result =  Sign * exp2(Exponent) * (Mantissa * exp2(-23.0 ));
    return Result;
}

float unpack2(const vec2 pack) {
    return dot(pack, vec2(1.0, 1.0 / 255.0));
}

vec3 decode(vec4 enc) {
    vec4 nn = enc* vec4(2, 2, 0, 0) + vec4( -1, -1, 1, -1);
    float l = dot(nn.xyz, -nn.xyw);
    nn.z = l;
    nn.xy *= sqrt(l);
    return nn.xyz * 2.0 + vec3(0, 0, -1);
}

uniform vec3 lightPos;

void main(void) {
    vec4 normalTex = vec4(texture2D(normalSampler, gl_FragCoord.xy / resolution));
    vec3 normal = decode(vec4(unpack2(normalTex.xy), unpack2(normalTex.zw), 0, 0));
    gl_FragColor = vec4(normal, 1.0);
	vec4 texture = vec4(texture2D(intermSampler, gl_FragCoord.xy / resolution));
    highp float depth = decode32(texture2D(depthPrecSampler, gl_FragCoord.xy / resolution)) ;
    //depth = depth * 0.5 + 0.5;
    //depth = 2.0 * depth - 1.0;
    //depth = (depth - 1.0) / 1000.;
    float depth1 = depth;
    gl_FragColor = vec4(vec3(depth), 1.0);

    depth = texture2D(depthSampler, gl_FragCoord.xy / resolution).x;
    depth = 2.0 * depth - 1.0;

    //depth = (depth * uPmat[3][3] - uPmat[3][2]) / (uPmat[2][2] - depth * uPmat[2][3]);
    depth = - uPmat[3][2] / (uPmat[2][2] + depth);

    vec3 eyePos = vec3(vRay, 1.0) * depth / 50.;

    gl_FragColor = vec4(eyePos, 1.0);
	//gl_FragColor = vec4(1., 1., 1., 1.);

    depth = 1. - (-depth - 1.0) / 1000.;
    //gl_FragColor = vec4(vec3(depth), 1.0);
    //gl_FragColor = vec4(vec3(pow(depth1-depth, 200.)), 1.0);

    //gl_FragColor = vec4(normal, 1.0);
	gl_FragColor = texture;
}
