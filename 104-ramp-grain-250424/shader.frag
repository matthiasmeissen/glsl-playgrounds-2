#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D   u_doubleBuffer0;
uniform vec2        u_resolution;
uniform float       u_time;
uniform vec2        u_mouse;

#define PI 3.14159265359

#include "../lygia/space/ratio.glsl"
#include "../lygia/space/center.glsl"
#include "../lygia/distort/grain.glsl"

vec3 rampTOP(in vec2 uv, in int type) {
    float d = 0.0;

    if (type == 0) {
        d = uv.x;
    } else if (type == 1) {
        d = length(uv);
    } else if (type == 2) {
        d = (atan(uv.y, uv.x) + PI) / (2.0 * PI);
    }

    vec3 c1 = vec3(0.1, 0.0, 0.8);
    vec3 c2 = vec3(1.0, 1.0, 1.0);

    return mix(c1, c2, fract(d + u_time * 0.4));
}

void main(void) {
    vec3 color = vec3(0.0);
    vec2 pixel = 1.0/u_resolution.xy;
    vec2 st = gl_FragCoord.xy * pixel;
    vec2 uv = ratio(st, u_resolution);
    uv = center(uv);

    float g = grain(uv, u_resolution / 2.0, 1.0, 20.0);

    vec3 ramp1 = rampTOP(uv, int(st.x * 3.0));
    vec3 ramp2 = rampTOP(clamp(uv * 2.0, -1.0, 1.0), 1);

    vec3 ramps = mix(ramp1, ramp2, 0.5);

    color = ramps + vec3(g) * 0.2;

    gl_FragColor = vec4(color, 1.0);
}