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

float sdCapsule(vec2 p, float h, float r) {
    p.y -= clamp(p.y, -h, h);
    return length(p) - r;
}

void main() {
    vec2 uv = v_uv;
    vec2 p = uv - 0.5;
    p.x *= u_resolution.x / u_resolution.y;

    float h = mix(0.2, 1.0, uParam2);
    float rep = mix(0.2, 40.0, uParam3);
    float r = 0.4 + sin(uv.y * rep + u_time) * 0.3;

    p *= 4.0;
    p = mix(p, p * p - uv, uParam4);
    float d = sdCapsule(p, h, r);

    float t = (-p.y + h + r) / (2.0 * (h + r));
    t = clamp(t, 0.0, 1.0);

    float mask = 1.0 - smoothstep(0.0, t * uParam1, d);

    float xNorm = p.x / r;
    t = t - (1.0 - t * uv.y - 0.2) * xNorm * xNorm * 0.1;
    
    vec3 c4 = vec3(0.15, 0.08, 0.25);  // coral
    vec3 c3 = vec3(0.15, 0.45, 0.6);   // pink
    vec3 c2 = vec3(0.85, 0.75, 0.9);   // teal
    vec3 c1 = vec3(1.0, 0.45, 0.35);   // deep purple

    vec3 c = mix(c1, c2, smoothstep(0.0, 0.4, t));
    c = mix(c, c3, smoothstep(0.4, 0.7, t));
    c = mix(c, c4, smoothstep(0.7, 1.0, t));

    vec3 col = mix(vec3(0.85, 0.82, 0.8), c, mask);

    out_color = vec4(col, 1.0);
}