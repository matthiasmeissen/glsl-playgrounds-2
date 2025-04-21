#ifdef GL_ES
precision mediump float;
#endif

uniform vec2        u_resolution;
uniform float       u_time;
uniform vec2        u_mouse;

#include "../lygia/space/ratio.glsl"
#include "../lygia/space/rotate.glsl"
#include "../lygia/filter/boxBlur.glsl"

void main(void) {
    vec3 color = vec3(0.0);
    vec2 pixel = 1.0/u_resolution.xy;
    vec2 st = gl_FragCoord.xy * pixel;
    vec2 uv = ratio(st, u_resolution) - 0.5;

    gl_FragColor = vec4(color, 1.0);
}