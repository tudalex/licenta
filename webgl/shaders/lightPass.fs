precision highp float;

struct BaseLight {
    vec3 color;
    float ambientIntensity;
    float diffuseIntensity;
};

struct DirectionalLight {
    BaseLight base;
    vec3 direction;
};

struct Attenuation {
    float constant;
    float linear;
    float exp;
};

struct PointLight {
    BaseLight base;
    vec3 position;
    Attenuation atten;
};

struct SpotLight {
    PointLight base;
    vec3 direction;
    float cutoff;
};

struct Material {
    float specularIntensity;
    float specularPower;   
};


vec4 calcLightInternal(
                BaseLight light,
                vec3 lightDirection,
                vec3 fragEyePos,
                vec3 normal,
                Material mat)
{
    vec4 ambientColor = vec4(light.color, 1.0) * light.ambientIntensity;
    float diffuseFactor = dot(normal, -lightDirection);

    vec4 diffuseColor  = vec4(0);
    vec4 specularColor = vec4(0);

    if (diffuseFactor > 0.0) {
        diffuseColor = vec4(light.color, 1.0) * light.diffuseIntensity * diffuseFactor;

        vec3 fragToEye = normalize(-fragEyePos);
        vec3 lightReflect = normalize(reflect(lightDirection, normal));
        float specularFactor = dot(fragToEye, lightReflect);
        specularFactor = pow(specularFactor, mat.specularPower);
        if (specularFactor > 0.0) {
            specularColor = vec4(light.color, 1.0) * mat.specularIntensity * specularFactor;
        }
    }

    return ambientColor + diffuseColor + specularColor;
}

vec4 calcDirectionalLight(
                DirectionalLight directionalLight,
                vec3 fragEyePos,
                vec3 normal,
                Material mat)
{
    return calcLightInternal(
                directionalLight.base,
			    directionalLight.direction,
	    		fragEyePos,
    			normal,
    			mat);
}

vec4 calcPointLight(
                PointLight pointLight,
                vec3 fragEyePos,
                vec3 normal,
                Material mat)
{
    vec3 lightDirection = fragEyePos - pointLight.position;
    float distance = length(lightDirection);
    lightDirection = normalize(lightDirection);

    vec4 color = calcLightInternal(
                pointLight.base,
                lightDirection,
                fragEyePos,
                normal,
                mat);

    float attenuation =
                pointLight.atten.constant +
                pointLight.atten.linear * distance +
                pointLight.atten.exp * distance * distance;

    attenuation = max(1.0, attenuation);

    return color; // / attenuation;
}


vec4 calcSpotLight(
                SpotLight spotLight,
                vec3 fragEyePos,
                vec3 normal,
                Material mat)                            
{                                                                                           
    vec3 lightToPixel = normalize(fragEyePos - spotLight.base.position);                             
    float spotFactor = dot(lightToPixel, spotLight.direction);                                      
                                                                                            
    if (spotFactor > spotLight.cutoff) {                                                            
        vec4 color = calcPointLight(
                spotLight.base,
                fragEyePos,
                normal,
                mat);
                                         
        return color * (1.0 - (1.0 - spotFactor) * 1.0/(1.0 - spotLight.cutoff));                   
    }                                                                                       
                                                                                    
    return vec4(0);                                                                                       
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


varying vec2 vRay;

uniform sampler2D uSampler0;
uniform sampler2D uSampler1;
uniform sampler2D uSampler2;
uniform sampler2D uSampler3;

#define depthSampler        uSampler1
#define normalSampler       uSampler3
#define textureSampler      uSampler0
#define worldPosSampler     uSampler2



uniform mat4 uPmat;
uniform vec2 resolution;

uniform Material uMat;
uniform DirectionalLight uDirectionalLight;
uniform PointLight uPointLight;
uniform SpotLight uSpotLight;




uniform vec3 lightPos;

void main(void) {
    vec4 normalTex = vec4(texture2D(normalSampler, gl_FragCoord.xy / resolution));
    vec3 normal = decode(vec4(unpack2(normalTex.xy), unpack2(normalTex.zw), 0, 0));
    gl_FragColor = vec4(normal, 1.0);
	

    // Sample from depth buffer
    float depth = texture2D(depthSampler, gl_FragCoord.xy / resolution).x;
    // Transform to ndc coords
    depth = 2.0 * depth - 1.0;

    // Invert projection
    depth = (depth * uPmat[3][3] - uPmat[3][2]) / (uPmat[2][2] - depth * uPmat[2][3]);
    //depth = -uPmat[3][2] / (uPmat[2][2] + depth);

    // Reconstruct eye position
    vec3 eyePos = vec3(vRay, 1.0) * depth;// / 50.;

    
	//gl_FragColor = vec4(1., 1., 1., 1.);

    depth = 1. - (-depth - 1.0) / 1000.;
    //gl_FragColor = vec4(vec3(depth), 1.0);
    
    vec3 worldPos = texture2D(worldPosSampler, gl_FragCoord.xy / resolution).xyz;
    //gl_FragColor = vec4(worldPos / 100., 1.); // / 100.;

    vec4 texture = vec4(texture2D(textureSampler, gl_FragCoord.xy / resolution));
	gl_FragColor = texture * calcPointLight(uPointLight, eyePos, normal, uMat);
	//gl_FragColor = texture;
	gl_FragColor.a = 1.0;
	
	//gl_FragColor = vec4(normal, 1.0);
	
	//gl_FragColor = vec4(worldPos, 1.0);
	
	//gl_FragColor = vec4(eyePos / 50., 1.0);
	
	
	//gl_FragColor = vec4(pow(eyePos - worldPos, vec3(10.)), 1.0);
	
	//float dist = length(worldPos - uPointLight.position);
	//gl_FragColor = vec4(vec3(dist) / 100., 1.0);
}
