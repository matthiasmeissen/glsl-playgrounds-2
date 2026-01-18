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

vec2 globe(vec2 p) {
    float base = length(vec2(p.x * 0.5, p.y));
    float d1 = borderConstant(base, 0.4, 6.0);

    float d2 = length(vec2(p.x * 0.7, p.y));
    d2 = borderConstant(d2, 0.4, 6.0);

    float d3 = length(vec2(p.x * 1.4, p.y));
    d3 = borderConstant(d3, 0.4, 6.0);

    float d4 = length(vec2(p.x * 0.8, p.y - 0.55));
    d4 = borderConstant(d4, 0.4, 6.0);

    float d5 = length(vec2(p.x * 0.8, p.y + 0.55));
    d5 = borderConstant(d5, 0.4, 6.0);

    float vLine = borderConstant(p.x, 0.0, 8.0);
    float hLine = borderConstant(p.y, 0.0, 8.0);
    float crossLines = vLine + hLine + d4 + d5;
    float mask = smoothstep(0.4, 0.395, base);
    crossLines *= mask;


    float lines = d1 + d2 + d3 + crossLines;
    float fill = step(base, 0.4);
    return vec2(lines, fill);
}

void main() {
    vec2 uv = v_uv;
    vec2 p = uv - 0.5;
    p.x *= u_resolution.x / u_resolution.y;
    p *= 2.0;

    float starSize = mix(0.6, 1.8, uParam1);
    float starX = mix(-0.8, 0.8, uParam2);
    float startRotation = PI * uParam3;
    float starSpikes = mix(20.0, 40.0, uParam4);
    float globeStretch = mix(1.1, 1.4, uParam4);

    // --- 1. Define Colors ---
    vec3 bgColor = vec3(0.890, 0.290, 0.145);
    vec3 fill = vec3(0.788, 0.769, 0.698);
    vec3 line = vec3(0.060, 0.060, 0.060);

    // --- 2. Calculate Shapes ---
    vec2 gData = globe(vec2(p.x * globeStretch, p.y + sin(u_time) * 0.3));
    vec2 sData = star(vec2(p.x - starX, p.y - sin(u_time) * 0.3) / starSize * rot(startRotation), starSpikes);

    // --- 3. Compositing ---
    vec3 col = bgColor;

    // LAYER 1: GLOBE
    vec3 gColor = mix(fill, line, gData.x);
    float gAlpha = clamp(gData.x + gData.y, 0.0, 1.0);
    col = mix(col, gColor, gAlpha);

    // LAYER 2: STAR
    vec3 sColor = mix(fill, line, sData.x);
    float sAlpha = clamp(sData.x + sData.y, 0.0, 1.0);
    col = mix(col, sColor, sAlpha);

    out_color = vec4(col, 1.0);
}