#version 330 core
precision mediump float;

in vec2 v_uv;
uniform vec2 u_resolution;
uniform float u_time;
uniform float uParam1;
uniform float uParam2;
uniform float uParam3;
uniform float uParam4;

out vec4 out_color;

#define rot(a) mat2(cos(a), -sin(a), sin(a), cos(a))
#define PI 3.1415926535

float shape(vec2 uv, float border, float rotate) {
    vec2 uv1 = uv;
    float frame = step(border, uv1.x);
    frame *= step(border, 1.0 - uv1.x);
    frame *= step(border, uv1.y);
    frame *= step(border, 1.0 - uv1.y);

    uv -= 0.5;
    uv *= rot(PI * 0.5 * floor(rotate * 4.0));
    uv += 0.5;

    float curve = length(uv);
    curve = step(curve, 1.0 - border);

    return frame * curve;
}

float mask(vec2 uv, vec2 size) {
    vec2 centered = uv - 0.5;

    float maskX = step(abs(centered.x), 0.5 - 1.0 / size.x);
    float maskY = step(abs(centered.y), 0.5 - 1.0 / size.y);
    return maskX * maskY;
}

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}


void main() {
    vec2 uv = v_uv;
    vec2 p = uv - 0.5;
    p.x *= u_resolution.x / u_resolution.y;

    float repx = floor(uParam1 * 10.0) + 3.0;
    float repy = floor(uParam2 * 10.0) + 3.0;

    vec2 gridUV = uv * vec2(repx, repy);
    vec2 cell = floor(gridUV);
    vec2 uv1 = fract(gridUV);

    float r = hash(cell);
    float d = shape(uv1, 0.025, r);

    float m = mask(uv, vec2(repx, repy));
    d = mix(1.0, d, m);

    vec3 col = mix(vec3(0.0), vec3(1.0, 0.286, 0.067), d);

    out_color = vec4(col, 1.0);
}