#version 300 es        // NEWER VERSION OF GLSL
precision highp float; // HIGH PRECISION FLOATS

uniform float uTime;   // TIME, IN SECONDS
in vec3 vPos;          // POSITION IN IMAGE
out vec4 fragColor;    // RESULT WILL GO HERE

const int NS = 5;	// Number of Spheres 

const int NL = 2; //Number of Light Sources

struct Material {
	vec3 ambient;
	vec3 diffuse;
	vec3 specular;
	float power;
	vec3 reflect;
	vec3 transparent;
	float indexOfRefraction;
};

uniform Material uMaterials[NS];


struct Shape {
	int type;
	vec3 center;
	float size;
};

uniform Shape uShapes[NS];

struct Light {
	vec3 dir;
	vec3 col;
};

uniform Light uLights[NL];

const float fl = 2.;


vec3 PolyhedraSurfaceNormal;

//Calculate the distance along a ray to a sphere.
//If the ray misses the sphere, returns [-1.,-1.]
//If the ray has one root, returns [firstRoot,-1]
//If the ray has two roots, returns [firstRoot, secondRoot]
vec2 rayShape(vec3 V, vec3 W, Shape shape) {
	// Draw rays for Spheres
	if (shape.type == 0){
		vec3 VPrime = V - shape.center;
		float r = shape.size;
		float firstRoot, secondRoot;
		float discriminant = pow(dot(W,VPrime),2.) - dot(VPrime,VPrime)+pow(r,2.);
		if (discriminant < 0.){
			firstRoot = -1.;
			secondRoot = -1.;
		} 
		else if (discriminant == 0.) {
			firstRoot = -1. * dot(W,VPrime)-sqrt(discriminant);
			secondRoot = -1. ;
		} else {
			firstRoot = -1. * dot(W,VPrime)-sqrt(discriminant);
			secondRoot = -1. * dot(W,VPrime)+sqrt(discriminant);
		}
		return vec2(firstRoot,secondRoot);

	} 
	else if (shape.type == 1 ) {
		float r = shape.size;
	 	vec3 V = V - shape.center;
	 	vec4 CubePlanes[6];
		
		CubePlanes[0] = vec4(-1., 0., 0., -r/2.);
		CubePlanes[1] = vec4(1., 0., 0., -r/2.);
		CubePlanes[2] = vec4(0., -1., 0., -r/2.);
		CubePlanes[3] = vec4(0., 1., 0., -r/2.);
		CubePlanes[4] = vec4(0., 0., -1., -r/2.);
		CubePlanes[5] = vec4(0., 0., 1., -r/2.);
		float tMin = -1000.;
		float tMax = 1000.;
		bool missed = false;
		//Iterate through the planes to find which plane it hits
		for (int i = 0; i < 6; i++){
			vec4 P = CubePlanes[i];
			vec4 VPrime = vec4(V,1);
			vec4 WPrime = vec4(W,0);
			float thisT = - dot(P,VPrime) / dot(P,WPrime);
			//If ray origin is outside of the halfspace
			if (dot(P,VPrime) > 0.){
				//Case 1 - ray has missed halfspace
				if (thisT < 0.){
					missed = true;
				}
				//Case 2 - ray entering halfspace at point V+tW
				if (thisT > 0. && thisT > tMin){
					vec3 frontSurfaceNormal = P.xyz;
					PolyhedraSurfaceNormal = frontSurfaceNormal;
					tMin = thisT;
				}
			}
			else if (dot(P,VPrime)<0.){
				//Case 3 - ray exiting halfspace at point V+tw
				if (thisT > 0. && thisT<tMax){
					tMax = thisT;
				}
			}
		}
		//The range has intersected the polyhedra
		if (!missed && tMin <= tMax ){
				return vec2(tMin,tMax);
		} else {
			return vec2(-1.,-1.);
		}
	}
	else if (shape.type == 2 ) {
		float r = shape.size;
	 	vec3 V = V - shape.center;

		/* Octahedron */
		vec4 OctahedronPlanes[8];
		const float r3 = 1. / sqrt(3.);
		OctahedronPlanes[0]= vec4(-r3, -r3, -r3,-r/2.);
		OctahedronPlanes[1] = vec4(r3, -r3, -r3, -r/2.);
		OctahedronPlanes[2] = vec4(-r3, r3, -r3, -r/2.);
		OctahedronPlanes[3] = vec4(r3, r3, -r3, -r/2.);
		OctahedronPlanes[4] = vec4(-r3, -r3, r3, -r/2.);
		OctahedronPlanes[5] = vec4(r3, -r3, r3, -r/2.);
		OctahedronPlanes[6] = vec4(-r3, r3, r3, -r/2.);
		OctahedronPlanes[7] = vec4(r3, r3, r3, -r/2.);

		float tMin = -1000.;
		float tMax = 1000.;
		bool missed = false;
		//Iterate through the planes to find which plane it hits
		for (int i = 0; i < 8; i++){
			vec4 P = OctahedronPlanes[i];
			vec4 VPrime = vec4(V,1);

			vec4 WPrime = vec4(W,0);
			float thisT = - dot(P,VPrime) / dot(P,WPrime);
			//If ray origin is outside of the halfspace
			if (dot(P,VPrime) > 0.){
				//Case 1 - ray has missed halfspace
				if (thisT < 0.){
					missed = true;
				}
				//Case 2 - ray entering halfspace at point V+tW
				if (thisT > 0. && thisT > tMin){
					vec3 frontSurfaceNormal = P.xyz;
					PolyhedraSurfaceNormal = frontSurfaceNormal;
					tMin = thisT;
				}
			}
			else if (dot(P,VPrime)<0.){
				//Case 3 - ray exiting halfspace at point V+tw
				if (thisT > 0. && thisT<tMax){
					tMax = thisT;
				}
			}
		}
		//The range has intersected the polyhedra
		if (!missed && tMin <= tMax ){
				return vec2(tMin,tMax);
		} else {
			return vec2(-1.,-1.);
		}
	}

}




bool isInShadow(vec3 P, vec3 L){
	//Loop through all shapes
	for (int k=0;k<NS; k++){
		if (rayShape(P,L,uShapes[k]).x> 0.001){
			return true;
		}
	}
	return false;
}

vec3 phongShading(vec3 P, vec3 N, Shape S, Material M, vec3 E){

	vec3 thisColor = M.ambient;
	//Loop through lights
  	for (int j=0;j< NL; j++){
		Light thisLight = uLights[j];
		//L is vector that points from point P to the direction of light source
		vec3 L = normalize(thisLight.dir);
		vec3 R = 2.* dot(N,L) * N - L;
		if (!isInShadow(P,L)){
			thisColor += thisLight.col * (M.diffuse*max(0.,dot(N,L)) + M.specular * pow(max(0.,dot(E,R)), M.power));
		}
	}
	
	return  thisColor;

}

//Computes surface normal on a shape given point P and shape S
vec3 computeSurfaceNormal(vec3 P, Shape shape){
	if (shape.type == 0){
		return normalize(P - shape.center);	
	}
	else if (shape.type == 1 || shape.type == 2){
		return PolyhedraSurfaceNormal;
	}
	
}

//Refracts ray given incoming ray W, surface normal N, and index of refraction
vec3 refractRay(vec3 W, vec3 N, float indexOfRefraction ){
	vec3 W_c = dot(W,N)*N;
	vec3 W_s = W - W_c;
	vec3 W_s_Prime = W_s/indexOfRefraction;
	vec3 W_c_Prime = - N * sqrt(1.- dot(W_s_Prime,W_s_Prime));
	vec3 W_Prime = W_c_Prime+W_s_Prime;
	return W_Prime;

}

void main() {
	
    vec3 N;
    vec3 P;
    vec3 V = vec3(0,0,fl);
    vec3 W = normalize(vec3(vPos.x, vPos.y, -fl));
    vec3 E = -W;
    vec3 WPrime;
    float tMin = 9000.;

    // R,G,B EACH RANGE FROM 0.0 TO 1.0  
    vec3 color;

    //Loop through all the shapes
	for(int i=0;i<NS; i++){
	  	float thisT = rayShape(V,W,uShapes[i]).x; 
	  	//Is this shape closer than what we've seen before?
	  	if (thisT > 0. && thisT< tMin){
	  		//Reset color to black b/c we are considering a new shape
	  		color = vec3(0.,0.,0.);
		  	P = V + thisT * W;
		  	N = computeSurfaceNormal(P,uShapes[i]);
		  	tMin = thisT;

		  	Material thisMaterial = uMaterials[i];

		  	//Do normal Phong Reflection on this shape
		  	color += phongShading(P,N,uShapes[i],thisMaterial, E);

		  	// Do mirror reflection by seeing if there's reflection
		  	if (length(uMaterials[i].reflect)> 0.){
		  		vec3 WPrime = W - 2. * (dot(N,W)) * N;
		  		float mirrorTMin = 1000.;
		  		Shape S;
		  		Material M;
		  		vec3 PPrime, NPrime;
		  		//Loop through the shapes to find the relevant one
		  		for (int j = 0; j < NS; j++){
		  			float mirrorT = rayShape(P,WPrime,uShapes[j]).x;
		  			// if (mirrorT > 0. && mirrorT < mirrorTMin ) {
		  			if (mirrorT > 0. && mirrorT < mirrorTMin && !(uShapes[j]==uShapes[i])) {
		  				S = uShapes[j];
		  				M = uMaterials[j];
		  				PPrime = P + mirrorT * WPrime;
		  				NPrime = computeSurfaceNormal(PPrime, S);
		  				mirrorTMin = mirrorT;
		  			}
		  		}
		  		if (mirrorTMin < 1000.){
		  			vec3 rgb = phongShading(PPrime, NPrime, S, M, -WPrime);
		  			color += rgb * uMaterials[i].reflect;
		  		}
		  	}

		  	//Refraction

		  	if (length(uMaterials[i].transparent)> 0.){
		  		//Compute W' - ray that refracts into the shape
		  		vec3 WPrime = refractRay(W,N,uMaterials[i].indexOfRefraction);
		  		float tPrime = rayShape(P - WPrime/1000., WPrime, uShapes[i]).y;

		  		// If we see a second root, that is., if our ray hits the back of the shape
		  		if (tPrime > 0. ){
		  			//Compute second refracted ray that emerges back out of the shape
			  		vec3 PPrime = P + tPrime * WPrime;
			  		vec3 NPrime = computeSurfaceNormal(PPrime, uShapes[i]);
			  		vec3 WDoublePrime = refractRay(WPrime, NPrime, 1. / uMaterials[i].indexOfRefraction);

			  		//If emergent ray hits any shapes, do Phong shading on nearest one and add to color
			  		Shape S;
			  		Material M;
			  		float tMinRefract = 1000.;
			  		vec3 PDoublePrime, NDoublePrime;
			  		vec3 colorToAdd;
			  		//Loop through all the spheres to see if refracted ray hits any
			  		for (int k = 0; k < NS; k++){
			  			float thisT = rayShape(PPrime, WDoublePrime, uShapes[k]).x;
			  			//We find a shape that's closer than what we've seen
			  			if (thisT > .001 && thisT < tMinRefract && !(i == k) ){
			  			// if (thisT > .001 && thisT < tMinRefract ){
			  				S = uShapes[k];
			  				M = uMaterials[k];
			  				PDoublePrime = PPrime + thisT * WDoublePrime;
			  				NDoublePrime = computeSurfaceNormal(PDoublePrime, S);
			  				tMinRefract = thisT;
			  			}
			  		}
			  		if (tMinRefract < 1000.){
			  			vec3 rgb = phongShading(PDoublePrime, NDoublePrime, S,M,-WDoublePrime);
			  			color += rgb * uMaterials[i].transparent;
			  		}

		  		}

		  	}

	  	}

	  }
	
	// THIS LINE OUTPUTS THE FRAGMENT COLOR
    fragColor = vec4(sqrt(color), 1.0);
    
}
