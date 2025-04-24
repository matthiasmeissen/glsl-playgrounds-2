#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D   u_doubleBuffer0;
uniform vec2        u_resolution;
uniform float       u_time;
uniform vec2        u_mouse;

#include "../lygia/space/ratio.glsl"
#include "../lygia/space/scale.glsl"
#include "../lygia/sdf.glsl"
#include "../lygia/generative/snoise.glsl"

void main(void) {
    vec3 color = vec3(0.0);
    vec2 pixel = 1.0/u_resolution.xy;
    vec2 st = gl_FragCoord.xy * pixel;
    vec2 uv = ratio(st, u_resolution);

    float d = length(uv);

    color = vec3(d);

    gl_FragColor = vec4(color, 1.0);
}