#version 300 es        // NEWER VERSION OF GLSL
precision highp float; // HIGH PRECISION FLOATS

uniform vec3  uColor;
uniform vec3  uCursor; // CURSOR: xy=pos, z=mouse up/down
uniform float uTime;   // TIME, IN SECONDS

in vec2 vXY;           // POSITION ON SCREEN IMAGE
in vec3 vPos;          // POSITION IN SPACE
in vec3 vNor;          // SURFACE NORMAL
in vec2 vUV;           // U,V PARAMETRIC COORDINATES

vec3 Ldir[2];
vec3 Lrgb[2];

uniform int uTexIndex;

uniform sampler2D uTex0;
uniform sampler2D uTex1;
uniform sampler2D uTex2;

out vec4 fragColor;    // RESULT WILL GO HERE

void main() {
   
    vec4 texture0 = texture(uTex0, vUV);
    vec4 texture1 = texture(uTex1, vUV);
    vec4 texture2 = texture(uTex2, vUV);

    // I hardwired in Phong shading parameters and lights here
    // because I threw together this example quickly.
    // You should probably continue to define lights on the CPU
    // as you have been doing in previous weeks.

    vec3 ambient = .1 * uColor;
    vec3 diffuse = .5 * uColor;
    vec3 specular = vec3(.4,.4,.4);
    float p = 30.;

    Ldir[0] = normalize(vec3(1.,1.,2.));
    Ldir[1] = normalize(vec3(-1.,-1.,-1.));
    Lrgb[0] = vec3(1.,1.,1.);
    Lrgb[1] = vec3(1.,0,1.);

    vec3 normal = normalize(vNor);

    vec3 color = ambient;
    for (int i = 0 ; i < 2 ; i++) {
       float d = dot(Ldir[i], normal);
       if (d > 0.)
          color += diffuse * d * Lrgb[i];
       vec3 R = 2. * normal * dot(Ldir[i], normal) - Ldir[i];
       float s = dot(R, normal);
       if (s > 0.)
          color += specular * pow(s, p) * Lrgb[i];
    }

    if (uCursor.z > 0. && min(abs(uCursor.x - vXY.x), abs(uCursor.y - vXY.y)) < .005)
          color *= 2.;

   
    fragColor = vec4(sqrt(color), 1.0);



    // This isn't the only thing you can do with textures. For example,
    // you can use them to modify the values in the Phong shading algorithm,
    // including things like the value of the surface normal vector.
    // Feel free to experiment. WebGL allows you up to 8 textures at once.

    if (uTexIndex == 0) fragColor *= texture0;
    if (uTexIndex == 1) fragColor *= texture1;
    if (uTexIndex == 2) fragColor *= texture2;



}


