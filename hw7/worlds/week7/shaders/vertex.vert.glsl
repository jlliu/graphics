#version 300 es
precision highp float;

// Input vertex. Values are set by the CPU.

in  vec3 aPos;
in  vec3 aNor;
in  vec2 aUV;

// Interpolated values to send to the fragment shader

out vec3 vPos;    // Position
out vec3 vNor;    // Surface normal
out vec2 vUV;     // Parametric U,V coordinates
out vec3 vCursor; // Cursor
out vec2 vXY;     // Position on screen image

// Matrices

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProj;

uniform float uTime; // Time. Value is set by the CPU.

void main(void) {
    vec4 pos = uProj * uView * uModel * vec4(aPos, 1.);
    gl_Position = pos;
    vXY = pos.xy / pos.z;
    vPos = aPos;
    vNor = (vec4(aNor, 0.) * inverse(uModel)).xyz;
    vUV = vec2(aUV.x, 1. - aUV.y); // FLIP V
}
