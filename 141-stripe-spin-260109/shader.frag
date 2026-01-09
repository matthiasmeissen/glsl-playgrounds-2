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

float hash(float n) {
    return fract(sin(n * 127.1) * 43758.5453);
}

float noise1D(float x) {
    float i = floor(x);
    float f = fract(x);
    return mix(hash(i), hash(i + 1.0), smoothstep(0.0, 1.0, f));
}

float stripes(vec2 p, float d) {
    float angle = atan(p.x, p.y);
    float dist = length(p);
    float aNorm = angle / (PI * 2.0) + 0.5;

    float s1 = floor(aNorm * 800.0);
    s1 = step(0.5, hash(s1));

    float s2 = noise1D(aNorm * 1200.0);
    s2 = step(0.8, s2);

    return mix(s1, s2, d);
}

float concentricCircles(vec2 p, float d) {
    float angle = atan(p.x, p.y);
    float dist = length(p);
    float aNorm = angle / (PI * 2.0) + 0.5;

    float c1 = dist - fract(u_time * 0.4);
    c1 = step(0.01, abs(c1));

    float c2 = fract(dist * 20.0 - u_time);
    c2 = step(0.4, abs(c2));

    return mix(c1, c2, d);
}

vec3 pal(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
}

void main() {
    vec2 uv = v_uv;
    vec2 p = uv - 0.5;
    p.x *= u_resolution.x / u_resolution.y;

    // The two polar components
    float angle = atan(p.x, p.y);
    float dist = length(p);
    float aNorm = angle / (PI * 2.0) + 0.5;

    p *= rot(u_time);

    float d1 = sin(angle + u_time * 0.5) * 0.5 + 0.5;
    float d2 = sin(angle * 2.0 - u_time * 0.4) * 0.5 + 0.5;
    float d3 = sin(angle * 1.0 + sin(dist * 8.0 - u_time) * 2.0) * 0.5 + 0.5;
    float d = d1 * 0.3 + d2 * 0.25 + d3 * 0.2;

    vec3 col1 = pal(d, 
        vec3(0.6),              // brightness
        vec3(0.4),              // contrast
        vec3(1.0, 1.0, 0.5),    // frequency
        vec3(0.8, 0.9, 0.3)     // phase offsets
    );

    //float s = stripes(p, 0.0);
    //float c = concentricCircles(p, 0.0);


    float localR = fract(dist * 2.0 - u_time * 0.4);
    float localA = fract(angle * 4.0);
    vec2 polarUV = vec2(localA - 0.5, localR - 0.5);
    vec2 targetUV = mix(polarUV * polarUV, p, uParam1);

    float inner = mix(0.01, 0.1, uParam2);
    float outer = mix(0.0, 0.4, uParam3);

    float mask = step(inner, abs(length(targetUV) - outer));


    vec3 col = mix(vec3(1.0), col1, mask);

    col = mix(col, 1.0 - col, uParam4);

    out_color = vec4(col, 1.0);
}