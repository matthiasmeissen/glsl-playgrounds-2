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

float ramp(float dir, float num) {
    return abs(sin(dir * num));
}

float circle(vec2 uv, float r) {
    return length(uv) - r;
}

float bias(float d, float bias) { 
    return d / ((1.0 / bias - 2.0) * (1.0 - d) + 1.0); 
}

float circularGradient(vec2 uv, float rep) { 
    return abs(sin(length(uv) * rep)); 
}

void main() {
    vec2 uv = v_uv;
    vec2 p = uv - 0.5;
    p.x *= u_resolution.x / u_resolution.y;
    
    uv *= mix(1.0, 4.0, uParam3);
    p *= mix(1.0, 4.0, uParam3);

    p *= rot(PI * 0.5);

    float rep = mix(2.0, 40.0, uParam1);

    float d1 = ramp(uv.x, 20.0 * uParam2);
    float d2 = circularGradient(vec2(p.x * d1 * p.y, p.y), rep);

    float blend = mix(d2, d2 * d1, uParam4);
    float d = circle(vec2(p.x + sin(u_time * 0.8) * 1.4, p.y) / vec2(1.0, uParam2), blend);
    d = step(0.0, d) - step(0.4, d);

    vec3 col = vec3(d);

    out_color = vec4(col, 1.0);
}