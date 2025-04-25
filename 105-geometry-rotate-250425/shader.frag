#ifdef GL_ES
precision mediump float;
#endif

uniform vec2        u_resolution;
uniform float       u_time;
uniform vec2        u_mouse;


#include "../lygia/space/ratio.glsl"
#include "../lygia/space/center.glsl"
#include "../lygia/space/rotate.glsl"
#include "../lygia/distort/grain.glsl"

void main(void) {
    vec3 color = vec3(0.0);
    vec2 pixel = 1.0/u_resolution.xy;
    vec2 st = gl_FragCoord.xy * pixel;
    vec2 uv = ratio(st, u_resolution);
    uv = center(uv);

    float g = grain(uv, u_resolution, u_time, 20.0);

    uv = rotate(uv, u_time);

    uv = fract(uv * 4.0);

    float c1 = 1.0 - uv.x;

    color = vec3(c1) - g * 0.8;

    gl_FragColor = vec4(color, 1.0);
}