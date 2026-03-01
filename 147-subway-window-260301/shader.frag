#version 330 core
precision mediump float;

in vec2 v_uv;
uniform vec2 u_resolution;
uniform float u_time;
uniform float uParam1;
uniform float uParam2;
uniform float uParam3;
uniform float uParam4;

// 0, 81, 222
uniform vec3 uColor1; // color

out vec4 out_color;

#define rot(a) mat2(cos(a), -sin(a), sin(a), cos(a))
#define PI 3.1415926535

// By iq
float sdRoundedBox( in vec2 p, in vec2 b, in vec4 r )
{
    r.xy = (p.x>0.0)?r.xy : r.zw;
    r.x  = (p.y>0.0)?r.x  : r.y;
    vec2 q = abs(p)-b+r.x;
    return min(max(q.x,q.y),0.0) + length(max(q,0.0)) - r.x;
}

float fluidNoise(vec2 p, float time) {
    vec2 n = vec2(0.0);
    vec2 q = p + vec2(time * 0.4, 0.0); // Move in X
    
    for (float i = 1.0; i < 4.0; i++) {
        // Warp coordinates based on previous result
        n += vec2(sin(i * q.y + time * 0.5), cos(i * q.x + time * 0.2));
        q += n * 0.5; // Add warp to position
    }
    
    return length(n) * 0.2; 
}

float tri(float x) { return abs(fract(x) - 0.5); }

float triNoise(vec2 p, float time) {
    p.y -= time * 0.1;
    
    // Rotate coordinate slightly to avoid orthogonal grid look
    float c = cos(1.0), s = sin(1.0);
    p *= mat2(c, -s, s, c);
    
    // Combine two triangle waves
    float n = tri(p.x + tri(p.y * 1.5));
    n += tri(p.y + tri(p.x * 2.5));
    
    return n; // Returns range approx 0.0 to 1.0
}

float starSDF(vec2 uv, float strength) {
    float d = length(vec2(uv.x * uv.y, uv.y * uv.x)) * strength;
    d += length(uv) * 1.0;
    return d;
}

float borderConstant(float d, float size, float pixelThickness) {
    float distToLine = abs(d - size);
    float pixelWidth = fwidth(d); 
    return step(distToLine, pixelWidth * pixelThickness);
}

vec2 star(vec2 p, float spikes) {
    float base = starSDF(vec2(p.x, p.y), spikes);

    float lines = borderConstant(base, 0.4, 6.0);
    float fill = step(base, 0.4);
    return vec2(lines, fill);
}

void main() {
    vec2 uv = v_uv;
    vec2 p = uv - 0.5;
    p.y *= u_resolution.y / u_resolution.x;

    vec2 p1 = p * mix(8.0, 2.0, uParam1);

    float intensity = mix(0.8, 2.0, uParam2);

    float x1 = mix(0.8, fluidNoise(p, u_time + 10.0) * 4.0, uParam3);
    float x2 = mix(0.8, fluidNoise(p, u_time + 20.0) * 4.0, uParam3);

    float window_mask = sdRoundedBox(p1 + vec2(1.1, 0.0), vec2(x1, 1.8), vec4(0.2));
    window_mask *= sdRoundedBox(p1 - vec2(1.1, 0.0), vec2(x2, 1.8), vec4(0.2));
    //window_mask = step(window_mask, 0.0);
    window_mask = 0.4 - window_mask;

    float sky_base = fluidNoise(p, u_time);
    vec3 sky = mix(vec3(1.0), uColor1, sky_base);
    sky /= triNoise(p * 0.2, u_time) * intensity;

    float d = starSDF(p, 20.0) * mix(0.1, 2.0, uParam4);

    float mask = mix(window_mask, window_mask - d, uParam4);

    vec3 col = mix(vec3(0.4 * uv.y), sky, mask);

    out_color = vec4(col, 1.0);
}