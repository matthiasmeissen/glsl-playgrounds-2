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

float fractal(vec2 uv, float fac, float a) {
    float d = 0.0;
    
    uv.y *= 2.0;

    for (int i = 0; i < 4; i++) {
        uv *= fac * fac;
        uv += sin(uv.yx * fac) * fac + u_time * 0.1;
        d += mix(sin(uv.x + uv.y), cos(uv.x - uv.y), a);
    }

    return d;
}

vec3 mapColorSmooth(float gray) {
    vec3 c1 = vec3(0.15, 0.1, 0.05);
    vec3 c2 = vec3(1.0, 0.4, 0.2);
    vec3 c3 = vec3(0.6, 0.5, 0.7);
    vec3 c4 = vec3(0.0, 0.5, 0.6);
    vec3 c5 = vec3(0.2, 0.7, 0.8);
    vec3 c6 = vec3(0.85, 0.87, 0.88);
    
    vec3 col = c1;
    col = mix(col, c2, smoothstep(0.0, 0.2, gray));
    col = mix(col, c3, smoothstep(0.15, 0.35, gray));
    col = mix(col, c4, smoothstep(0.3, 0.5, gray));
    col = mix(col, c5, smoothstep(0.5, 0.7, gray));
    col = mix(col, c6, smoothstep(0.7, 1.0, gray));
    
    return col;
}

void main() {
    vec2 uv = v_uv;
    vec2 p = uv - 0.5;
    p.x *= u_resolution.x / u_resolution.y;

    float shape = mix(0.0, 1.0, uParam1);
    float fac = mix(1.4, 1.5, uParam2);
    float blend = mix(0.0, 1.0, uParam3);
    float fade = mix(0.0, 1.0, uParam4);

    uv *= rot(PI * 0.25);

    float d1 = fractal(uv, fac, shape);
    float d2 = smoothstep(0.3, 0.0, length(vec2(p.x, p.y * 0.6)));
    float d = mix(0.0, d1, d2);

    float shift = mix(cos(p.x * 4.0), tan(p.y * 4.0 + u_time * 0.2), 0.7);
    shift = mix(1.0, shift, fade);
    d += abs(shift);
    d = mix(d, 1.0 - d, blend);

    vec3 col = mapColorSmooth(d);

    out_color = vec4(col, 1.0);
}