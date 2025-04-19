#ifdef GL_ES
precision mediump float;
#endif

uniform vec2    u_resolution;
uniform float   u_time;

#include "../lygia/generative/pnoise.glsl"

void main(void) {
    vec3 color = vec3(0.0);
    vec2 pixel = 1.0/u_resolution.xy;
    vec2 st = gl_FragCoord.xy * pixel;

    float s = pnoise(vec3(st * 5.0, u_time), vec3(1.0, 1.2, 4.2));

    s = step(s, 0.4) - step(s, 0.38);

    color = vec3(s);

    gl_FragColor = vec4(color, 1.0);
}