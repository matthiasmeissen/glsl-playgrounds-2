#ifdef GL_ES
precision mediump float;
#endif

// attribute: input vertex data from model buffer (only in vertex shader)
// varying: data sent from vertex to fragment shader
// uniform: constant data for the whole draw call, set by cpu (available in multiple stages)

uniform sampler2D   u_scene;
uniform vec2        u_resolution;
uniform float       u_time;
uniform vec2        u_mouse;

varying vec4 v_color;
varying vec4 v_pos;

#include "../lygia/space/ratio.glsl"
#include "../lygia/space/center.glsl"


void main(void) {
    vec3 color = vec3(0.0);
    vec2 pixel = 1.0/u_resolution.xy;
    vec2 st = gl_FragCoord.xy * pixel;
    vec2 uv = ratio(st, u_resolution);
    uv = center(uv);

#ifdef BACKGROUND
    // Background
    float d = 0.2;
    color = vec3(d);

#else
    // Material
    float c = fract((v_pos.x - u_time) * 1.2);
    color = vec3(c);

#endif

    color = mix(color, 1.0 - color, uv.x * uv.y);

    gl_FragColor = vec4(color, 1.0);
}