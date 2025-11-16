#version 330 core
precision mediump float;

in vec2 v_uv;
uniform vec2 u_resolution;
uniform float u_time;
uniform float uParam1;
uniform float uParam2;

out vec4 out_color;

#define rot(a) mat2(cos(a), -sin(a), sin(a), cos(a))
#define PI 3.1415926535

// From iq
vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) {
    return a + b*cos( 6.283185*(c*t+d) );
}

float hash(float n) {
    return fract(sin(n) * 43758.5453123);
}

float gradient(vec2 uv, float scale) {
    // Rotate space
    uv *= rot(0.2);
    // Set width of gradient
    uv.x /= scale;
    float s = uv.x - scale * 0.1;
    // Clamp output to stay in 0.0 to 1.0 range
    float d = clamp(s, 0.0, 1.0);
    return d;
}

float steps(vec2 uv, float num, float spread) {
    float index = floor((uv.y + floor(u_time)) * num);
    float steps = hash(index);
    steps = mix(0.4 - spread, 0.8 + spread, steps);
    return steps;
}

void main() {
    vec2 uv = v_uv;
    vec2 p = uv - 0.5;
    p.x *= u_resolution.x / u_resolution.y;

    float num = floor(mix(4.0, 8.0, uParam1));
    float spread = mix(0.0, 0.2, uParam2);

    float steps = steps(uv, num, spread);

    float d = gradient(uv, steps);

    vec3 col = palette(d, vec3(0.4), vec3(0.9, 0.8, 1.0), vec3(1.0), vec3(0.4, 0.6, 0.7));
    col = mix(col, vec3(0.0), d);

    //col = vec3(d);

    out_color = vec4(col, 1.0);
}