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

vec2 displaceNoise(in vec2 st, in float size, in float strength) {
    vec2 uvs = scale(st, size);
    float noise = snoise(vec3(uvs.x, uvs.y, u_time)) * strength;
    return st + noise;
}

float edgeSdf(in float sdf, in float p, in float amount) {
    p = clamp(p, 0.0, 1.0);
    amount = clamp(amount, 0.0, 1.0);
    return step(sdf, p) - step(sdf, p - amount);
}

void main(void) {
    vec3 color = vec3(0.0);
    vec2 pixel = 1.0/u_resolution.xy;
    vec2 st = gl_FragCoord.xy * pixel;
    vec2 uv = ratio(st, u_resolution);

#ifdef DOUBLE_BUFFER_0
    // Base Image

    vec2 uvn = displaceNoise(uv, 4.0, 0.2);
    float d = edgeSdf(circleSDF(uvn), 0.4, 0.02);
    color = vec3(d);

#else
    // Postprocessing

    float n = snoise(vec3(st * 8.0, u_time)) * 0.2;
    vec3 inputPass = texture2D(u_doubleBuffer0, st + n).rgb;
    color = inputPass;

#endif

    gl_FragColor = vec4(color, 1.0);
}