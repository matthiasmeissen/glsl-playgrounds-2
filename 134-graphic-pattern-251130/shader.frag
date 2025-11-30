#version 330 core
precision mediump float;

in vec2 v_uv;
uniform vec2 u_resolution;
uniform float u_time;
uniform float uParam1;
uniform float uParam2;
uniform float uParam3;
uniform float uParam4;
uniform float uParam5;

out vec4 out_color;

#define rot(a) mat2(cos(a), -sin(a), sin(a), cos(a))
#define PI 3.1415926535


float circle(vec2 uv, float r) {
    return length(uv) * r;
}

float opSmoothUnion(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}

float sdSegment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
}


void main() {
    vec2 uv = v_uv;
    vec2 p = uv - 0.5;
    // Fix resolution to have correct aspect
    p.x *= u_resolution.x / u_resolution.y;

    float size = mix(0.4, 0.6, uParam3); // 0.52
    float smooth_factor = 0.068;
    float offset = 0.5 * uParam1;
    float dist = uParam2 * 0.1; // 0.04
    float shift = mix(0.0, offset, uParam4);
    int num = 6;

    vec2 p1 = p * abs(p * rot(u_time) * 2.0) * 2.0;

    p = mix(p, p1, uParam5);

    float d = circle(p, size / 2.0); // size / 2.0

    for (int i = 1; i < num + 1; i++) {
        p *= rot(PI * 2.0 / float(num));
        float d1 = circle(p - vec2(offset, 0.0), size);
        d = opSmoothUnion(d, d1, smooth_factor);
    
        d1 = sdSegment(p, vec2(0.0, 0.0), vec2(shift, 0.0));
        d1 *= 2.0;
        d = opSmoothUnion(d, d1, smooth_factor);
    }

    d = step(d, dist);

    vec3 col = vec3(d);

    out_color = vec4(col, 1.0);
}