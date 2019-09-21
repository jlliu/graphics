#version 300 es        // NEWER VERSION OF GLSL
precision highp float; // HIGH PRECISION FLOATS

uniform float uTime;   // TIME, IN SECONDS
in vec3 vPos;          // POSITION IN IMAGE
out vec4 fragColor;    // RESULT WILL GO HERE

const int NS = 2;	// Number of Spheres 

const int NL = 2; //Number of Light Sources

vec3 Ldir[NL], Lcol[NL], Ambient[NS], Diffuse[NS];
vec4 Sphere[NS], Specular[NS];
const float fl = 2.;


//Calculate the distance along a ray to a sphere.
//If the ray misses the sphere, returns -1
float raySphere(vec3 V, vec3 W, vec4 S) {
	vec3 VPrime = V - S.xyz;
	float r = S.w;
	float t;
	float discriminant = pow(dot(W,VPrime),2.) -dot(VPrime,VPrime)+pow(r,2.);
	if (discriminant < 0.){
		t = -1.;
	} else {
		t = -1. * dot(W,VPrime)-sqrt(discriminant);
	}
	return t;
}

bool isInShadow(vec3 P, vec3 L){
	//Loop through all spheres
	for (int k=0;k<NS; k++){
		if (raySphere(P,L,Sphere[k])> 0.001){
			return true;
		}
	}
	return false;
}
void main() {

 	Ldir[0] = normalize(vec3(2.5,1.,.5));
    Lcol[0] = vec3(1.,1.,1.);

    Ldir[1] = normalize(vec3(-1.,-.1,-.3));
    Lcol[1] = vec3(0.,.8,.2);

   // Pink Ball
    Sphere[0]   = vec4(.2,0.,0.,.3);
    Ambient[0]  = vec3(.3,0.0,.2);
    Diffuse[0]  = vec3(1.,.2,1.);
    Specular[0] = vec4(0.,1.,0.,10.); // 4th value is specular power

   // Purple ball
    Sphere[1]   = vec4(-.35,0.124,-.1,.2);
    Ambient[1]  = vec3(.2,.0,.8);
    Diffuse[1]  = vec3(.5,.5,0.);
    Specular[1] = vec4(0.,1.,.0,20.); // 4th value is specular power
	
    vec3 N;
    vec3 P;
    vec3 V = vec3(0,0,fl);
    vec3 W = normalize(vec3(vPos.x, vPos.y, -fl));
    vec3 E = -W;
    float tMin = 9000.;

    // R,G,B EACH RANGE FROM 0.0 TO 1.0  
    vec3 color = vec3(0.,0.,0.);

    //Loop through all the spheres
	for(int i=0;i<NS; i++){
	  float thisT = raySphere(V,W,Sphere[i]); 
	  if (thisT > 0. && thisT<tMin){
	  	P = V + thisT * W;
	  	N = normalize(P - Sphere[i].xyz);
	  	tMin = thisT;
	  	//Loop through all the lighting sources
	  	color = Ambient[i];
	  	for (int j=0;j< NL; j++){
	  		vec3 R = 2.* dot(N,Ldir[j]) * N - Ldir[j];
	  		if (!isInShadow(P,Ldir[j])){
	  			color += Lcol[j] * (Diffuse[i]*max(0.,dot(N,Ldir[j])) + Specular[i].xyz * pow(max(0.,dot(E,R)), Specular[i].w));
	  		}
	  	}
	  }
	}
	// THIS LINE OUTPUTS THE FRAGMENT COLOR
    fragColor = vec4(sqrt(color), 1.0);
    
}
