#extension  GL_EXT_draw_buffers : require
precision highp float;

vec2 pack2(float val) {
    vec2 pack = vec2(1.0, 255.0) * val;
    pack = fract(pack);
    pack -= vec2(pack.y / 255.0, 0.0);
    return pack;
}

vec4 encode(vec3 n) {
    vec2 enc = normalize(n.xy) * sqrt(-n.z * 0.5 + 0.5);
    enc = enc * 0.5 + 0.5;
    
    vec4 ret;
    ret.xy = pack2(enc.x);
    ret.zw = pack2(enc.y);
    return ret;
}


varying vec2 vTextureCoord;
varying vec3 vNormal;
//varying float vDepth;
varying vec3 vWorldPos;

uniform sampler2D uSampler;


#define normalData      gl_FragData[2]
#define textureData     gl_FragData[0]

#define worldPosData    gl_FragData[1]


void main(void) {
    vec3 normal = normalize(vNormal);	
    normalData = encode(normal);
    
    textureData = texture2D(uSampler, vTextureCoord.st);
    textureData = vec4(1.);
    
    worldPosData = vec4(normal, 1.);
}
