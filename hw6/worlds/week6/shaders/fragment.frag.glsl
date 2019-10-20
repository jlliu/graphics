#version 300 es        // NEWER VERSION OF GLSL
precision highp float; // HIGH PRECISION FLOATS

uniform vec3  uColor;
uniform vec3  uCursor; // CURSOR: xy=pos, z=mouse up/down
uniform float uTime;   // TIME, IN SECONDS

in vec2 vXY;           // POSITION ON IMAGE
in vec3 vPos;          // POSITION
in vec3 vNor;          // NORMAL

out vec4 fragColor;    // RESULT WILL GO HERE

struct Material {
	vec3 ambient;
	vec3 diffuse;
	vec3 specular;
	float power;
	vec3 reflect;
	vec3 transparent;
	float indexOfRefraction;
};

uniform Material uMaterial;

const int NL = 4; //Number of Light Sources

struct Light {
	vec3 dir;
	vec3 col;
};

uniform Light uLights[NL];

uniform float uFishTexture;

const float fl = 2.;



bool isInShadow(vec3 P, vec3 L){
	//Loop through all shapes

	// for (int k=0;k<NS; k++){
	// 	if (rayShape(P,L,uShapes[k]).x> 0.001){
	// 		return true;
	// 	}
	// }
	return false;
}

vec3 phongShading(vec3 N, Material M, vec3 E){

	vec3 thisColor = M.ambient;
	//Loop through lights
  	for (int j=0;j< NL; j++){
		Light thisLight = uLights[j];
		vec3 L = normalize(thisLight.dir);
		vec3 R = 2.* dot(N,L) * N - L;
		thisColor += thisLight.col * (M.diffuse*max(0.,dot(N,L)) + M.specular * pow(max(0.,dot(E,R)), M.power));

		if (uFishTexture == 1.){
			if (!(cos((5.*vPos.x+20.*vPos.z)*.6) < .9)){
				thisColor = vec3(1.,1.,1.);
			}
		}
	
	}




	return  thisColor;

}

void main() {

    // vec3 lDir  = vec3(.57,.57,.57);
    // vec3 shade = vec3(.1,.1,.1) + vec3(1.,1.,1.) * max(0., dot(lDir, normalize(vNor)));
    vec3 color = vec3(0.,0.,0.);

    vec3 N = vNor;
 	vec3 V = vec3(0,0,fl);
    vec3 W = normalize(vec3(vPos.x, vPos.y, -fl));
    vec3 E = -W;

  	//Do normal Phong Reflection on this shape
  	color += phongShading(N, uMaterial, E);


	if (uFishTexture == 1.){
		if (!(cos((5.*vPos.x+20.*vPos.z)*.6) < .9)){
			color += vec3(.8,.8,.8);
		}
	}

    fragColor = vec4(sqrt(color), 1.0);
}


