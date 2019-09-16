#version 300 es
precision highp float;

uniform float uTime;   // TIME, IN SECONDS
in vec3 vPos;     // -1 < vPos.x < +1
// -1 < vPos.y < +1
//      vPos.z == 0

out vec4 fragColor; 
 
void main() {

  // HERE YOU CAN WRITE ANY CODE TO
  // DEFINE A COLOR FOR THIS FRAGMENT

  
  float timeA = cos(uTime*1.4)*3.;
  float timeB = cos(uTime*1.4 + 3.14*.25)*3.;
  float timeC = cos(uTime*1.4 + 3.14*.5)*3.;


  float a = pow(vPos.x,2.)+pow(vPos.y * 1.2 + .4- pow(pow(vPos.x,2.),.25),2.)-timeA;
  float b = pow(vPos.x,2.)+pow(vPos.y * 1.2 + .4- pow(pow(vPos.x,2.),.25),2.)-timeB;
  float c = pow(vPos.x,2.)+pow(vPos.y * 1.2 + .4- pow(pow(vPos.x,2.),.25),2.)-timeC;

  float red = 2.-a;
  float green = 2.-b;
  float blue = 2.-c;


  // R,G,B EACH RANGE FROM 0.0 TO 1.0  
  vec3 color = vec3(red  ,green, blue );
    
  // THIS LINE OUTPUTS THE FRAGMENT COLOR
  fragColor = vec4(sqrt(color), 1.0);
}