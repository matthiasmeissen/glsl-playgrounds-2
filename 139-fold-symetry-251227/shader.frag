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

float shape(vec2 p, float rep) {
    vec2 p1 = p;

    float inv = 0.5 - abs(p.y);
    float rate = log(rep) / 0.5;
    float rep_y = exp(inv * rate);
    p1.y = fract(rep_y);

    float d = length(vec2(p1.x * 1.1, p1.y * 0.35));

    float mask = 1.0 - smoothstep(0.45, 0.5, abs(p.y));

    return mix(0.5, d, mask);
}

vec3 addColors(float base, float top, float top_mask) {
    vec3 blue  = vec3(0.00, 0.38, 0.88);
    vec3 white = vec3(0.91, 0.90, 0.89);
    vec3 deepOrange = vec3(0.95, 0.25, 0.05);
    vec3 coral      = vec3(1.00, 0.45, 0.20);
    vec3 hotPink    = vec3(0.4, 0.2, 1.0);
    vec3 magenta    = vec3(0.95, 0.35, 0.85);
    
    vec3 c1 = mix(blue, white, base);
    
    float t = clamp(top * 4.0, 0.0, 1.0);
    vec3 c2 = magenta;
    c2 = mix(c2, hotPink, smoothstep(0.0, 0.35, t));
    c2 = mix(c2, coral, smoothstep(0.3, 0.65, t));
    c2 = mix(c2, deepOrange, smoothstep(0.6, 1.0, t));
    
    c2 = mix(vec3(0.0), c2, top_mask);
    
    return mix(c1, c2, top_mask);
}

void main() {
    vec2 uv = v_uv;
    vec2 p = uv - 0.5;
    p.x *= u_resolution.x / u_resolution.y;

    float rep = floor(mix(3.0, 8.0, uParam1));
    float rotation = mix(0.0, PI, uParam3);

    p *= rot(rotation);
    uv.y = fract(mix(p.x, p.y * p.x, uParam4) + u_time * 0.4);
    float s = shape(mix(p, p / uv, uParam2), rep);
    float d = step(0.4, s);
    float base = mix(d, 1.0 - d, floor(p.y + 1.0));
    float top = mix(0.0, mix(s, 0.0, d), floor(p.y + 1.0));
    float top_mask = mix(0.0, 1.0 - d, floor(p.y + 1.0));

    //float dots = step(0.9, length(fract(abs(exp(abs(p) * 4.0)))));

    float dots = step(0.2, length(fract(p * 120.0) - 0.5));
    dots = mix(0.9, 1.0, dots);

    vec3 col = addColors(base, top, top_mask);
    col *= dots;

    out_color = vec4(col, 1.0);
}