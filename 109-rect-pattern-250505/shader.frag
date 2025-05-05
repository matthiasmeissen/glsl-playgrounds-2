#ifdef GL_ES
precision mediump float;
#endif

uniform vec2        u_resolution;
uniform float       u_time;
uniform vec2        u_mouse;

#include "../lygia/space/ratio.glsl"
#include "../lygia/space/center.glsl"
#include "../lygia/sdf.glsl"

float circle_at_mouse(vec2 st, vec2 m) {
    float c = length((st - m) * 3.0);
    c = c - abs(sin(u_time));
    return clamp(c, 0.0, 1.0);
}

float pattern(vec2 st, float c, float num) {
    float r = mix(1.0, -0.6, c);
    vec2 pos = fract(st * num);
    float b = rectSDF(pos, 1.0, r);
    return step(b, 1.0);
}

void main(void) {
    vec3 color = vec3(0.0);
    vec2 pixel = 1.0/u_resolution.xy;
    vec2 st = gl_FragCoord.xy * pixel;
    vec2 m = u_mouse / u_resolution;
    vec2 uv = ratio(st, u_resolution);
    uv = center(uv);

    m = vec2(cos(u_time) * 0.5 + 0.5, sin(u_time * 1.8) * 0.5 + 0.5);
    
    float c = circle_at_mouse(st, m);

    float p = pattern(st, c, 8.0);

    color = vec3(p);

    gl_FragColor = vec4(color, 1.0);
}