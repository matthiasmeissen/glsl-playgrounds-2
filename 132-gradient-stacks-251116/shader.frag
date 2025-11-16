#version 330 core
precision mediump float;

in vec2 v_uv;
uniform vec2 u_resolution;
uniform float u_time;
uniform float uParam1;

out vec4 out_color;

#define rot(a) mat2(cos(a), -sin(a), sin(a), cos(a))
#define PI 3.1415926535

// From iq
vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) {
    return a + b*cos( 6.283185*(c*t+d) );
}

float gradient(vec2 uv, float scale) {
    uv *= rot(0.2);
    uv.x /= scale;
    return uv.x;
}

void main() {
    vec2 uv = v_uv;
    vec2 p = uv - 0.5;
    p.x *= u_resolution.x / u_resolution.y;

    float d = gradient(uv, 1.0);

    vec3 col = palette(d, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.5, 0.6, 0.7));
    col = mix(col, vec3(0.0), d);

    out_color = vec4(col, 1.0);
}