#extension  GL_EXT_draw_buffers : require
precision highp float;

varying vec2 vTextureCoord;
varying float fs_Depth;
uniform sampler2D uSampler;

varying vec3 fs_Normal;
varying vec4 fs_WorldPos;


highp vec4 encode32(highp float f) {
    highp float e = 5.0;
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


vec2 pack2(float val) {
    vec2 pack = vec2(1.0, 255.0) * val;
    pack = fract(pack);
    pack -= vec2(pack.y / 255.0, 0.0);
    return pack;
}

vec4 encode(vec3 n) {
    vec2 enc = normalize(n.xy) * (sqrt(-n.z*0.5 + 0.5));
    enc = enc * 0.5 + 0.5;
    vec4 ret;
    ret.xy = pack2(enc.x);
    ret.zw = pack2(enc.y);
    return ret;
}

void main(void) {
    //fs_Normal = normalize(fs_Normal);
    //gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));vec4(1.0,1.0, 1.0, 1.0);
    //gl_FragData[0] = vec4(1.0, 1.0, 1.0, 1.0);
	gl_FragData[0] = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
    //gl_FragData[1] = encode32(fs_Depth);

    gl_FragData[2] = encode(fs_Normal);
    gl_FragData[3] = fs_WorldPos;
    //gl_FragData[2] = vec4(fs_Normal, 1.0);
}
