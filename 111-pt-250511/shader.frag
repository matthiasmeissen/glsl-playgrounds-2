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
    float d = 1.0 - abs(uv.y + 0.4);
    d *= 1.0 - abs(uv.x + sin(u_time * 0.4)) * 2.0;
    color = mix(vec3(0.0, 0.25, 0.94), vec3(1.0), d);

#else
    // Material
    color = vec3(v_color.r);

#endif

    gl_FragColor = vec4(color, 1.0);
}