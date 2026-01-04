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

vec2 rotate(vec2 p, float a){
	return p * mat2(cos(a), -sin(a), sin(a), cos(a));
}

vec3 mapColorSmooth(float gray) {
    vec3 c1 = vec3(0.01, 0.0, 0.02);      // Near black with slight purple
    vec3 c2 = vec3(0.55, 0.08, 0.0);      // Deep red-orange
    vec3 c3 = vec3(1.0, 0.35, 0.0);       // Pure vivid orange
    vec3 c4 = vec3(1.0, 0.7, 0.05);       // Golden yellow
    vec3 c5 = vec3(0.85, 0.95, 0.1);      // Electric yellow-green
    vec3 c6 = vec3(0.4, 1.0, 0.3);        // Toxic green highlights

    vec3 col = c1;
    col = mix(col, c2, smoothstep(0.0, 0.2, gray));
    col = mix(col, c3, smoothstep(0.2, 0.4, gray));
    col = mix(col, c4, smoothstep(0.4, 0.6, gray));
    col = mix(col, c5, smoothstep(0.6, 0.8, gray));
    col = mix(col, c6, smoothstep(0.8, 1.0, gray));
    
    return col;
}

void main() {
    vec2 uv = v_uv;
    vec2 p = uv - 0.5;
    p.x *= u_resolution.x / u_resolution.y;

    float scale = uParam1;
    float bend = uParam2;
    float shift = uParam3;
    float twist = uParam4;

    p *= mix(0.4, 8.0, scale);

    float p1 = p.x * mix(-1.0 * p.x, p.x, bend);
    p.x = mix(p.x, p1, shift);
    vec2 l = mix(vec2(p.x * p.y, p.x / p.y), p + atan(p), bend);
    p *= rot(twist * PI);
    
    float s = mix(sin(l.x - l.y), tan(p.y * p.x), shift);
    
    for (float i = 0.0; i < 6.0; i++) {
        l = l * rotate(s * i + p, u_time * 0.2);
        l = l * rotate(sin(s) * i + l, u_time * 0.4);
    }

    float d = abs(l.x / l.y);
    float offset = exp(mix(1.0, 4.0, twist));

    vec3 col = mapColorSmooth(d / offset);

    out_color = vec4(col, 1.0);
}