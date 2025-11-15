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

vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise2d(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439); vec2 i  = floor(v + dot(v, C.yy)); vec2 x0 = v - i + dot(i, C.xx); vec2 i1; i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0); vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1; i = mod(i, 289.0); vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 )); vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0); m = m*m; m = m*m ; vec3 x = 2.0 * fract(p * C.www) - 1.0; vec3 h = abs(x) - 0.5; vec3 ox = floor(x + 0.5); vec3 a0 = x - ox; m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h ); vec3 g; g.x  = a0.x  * x0.x  + h.x  * x0.y; g.yz = a0.yz * x12.xz + h.yz * x12.yw; return 130.0 * dot(m, g);
}

vec2 displace(vec2 uv, float source, vec2 mid, vec2 scale) {
    vec2 displacement_map = vec2(source);
    vec2 offset = (displacement_map - mid) * scale;
    return uv + offset;
}

float ramplinear(float dir, float num) {
    return abs(sin(dir * num));
}

float rampcircular(vec2 uv, float num, float offset) {
    return abs(sin(length(uv * num) - offset));
}

void main() {
    vec2 uv = v_uv;
    vec2 p = uv - 0.5;
    p.x *= u_resolution.x / u_resolution.y;

    float rep = mix(10.0, 80.0, uParam1);
    float pos = uParam2;
    float fold = mix(uv.x, abs(p.x * p.x), uParam3);

    uv.x = fold;

    float noise = snoise2d(vec2(uv.x, uv.y - u_time * 0.2) * 4.0) * 0.1;
    uv = displace(uv, noise, vec2(0.0, 0.1), vec2(0.1, 0.04));

    float d1 = rampcircular(vec2(uv.x + sin(u_time * 0.4), uv.y - pos), 10.0 * uv.y, u_time);
    float d2 = ramplinear(uv.x, d1 * rep);
    float d = mix(d2, step(uParam4 * 0.9, d2), uParam4);

    vec3 col = vec3(d);

    out_color = vec4(col, 1.0);
}