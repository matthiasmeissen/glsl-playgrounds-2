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

float angular_gradient(vec2 uv) {
    return (atan(uv.x, uv.y) + PI) / (2.0 * PI);
}

float angular_circle(vec2 uv, float size, float off) {
    float d = fract(angular_gradient(uv) + off);
    return mix(d, 0.0, step(size, length(uv)));
}

void main() {
    vec2 uv = v_uv;
    vec2 p = uv - 0.5;
    p.x *= u_resolution.x / u_resolution.y;

    float blend = uParam1;
    float size = mix(0.0, 0.5, uParam2);
    float dist = mix(0.0, 0.75, uParam3);
    float rotate = floor(uParam4 * 8.0) / 8.0;

    p *= rot(rotate * PI * 2.0);

    vec3 col = vec3(0.85, 0.85, 0.83);

    vec3 colors1[4];
    colors1[0] = vec3(0.24, 0.55, 0.84); // Cirlce 1
    colors1[1] = vec3(0.47, 0.87, 0.47); // Cirlce 2
    colors1[2] = vec3(0.98, 0.67, 0.0); // Circle 3
    colors1[3] = vec3(0.67, 0.58, 0.0); // Circle 4

    vec3 colors2[4];
    colors2[0] = vec3(0.24, 0.55, 0.84); // Circle 1
    colors2[1] = vec3(0.0, 0.27, 0.20); // Circle 2
    colors2[2] = vec3(0.47, 0.62, 0.91); // Circle 3
    colors2[3] = vec3(1.0, 0.47, 0.87); // Circle 4

    for(float i = 0.0; i < 4.0; i++) {
        float yPos = mix(-dist, dist, i / 3.0);
        vec2 circleUV = vec2(p.x, p.y - yPos);
        float circle = angular_circle(circleUV, size, u_time * 0.2 + i * 0.25);
        
        int index = int(i);
        vec3 circleColor = mix(colors1[3 - index], colors2[3 - index], circle);
        
        float mask = step(0.000001, circle);
        
        float m = mix(circle, mask, blend);
        col = mix(col, circleColor, m);
    }

    out_color = vec4(col, 1.0);
}