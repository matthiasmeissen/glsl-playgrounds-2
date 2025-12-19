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

vec2 circle(vec2 uv, float rotate) {
    uv -= 0.5;
    uv *= rot(PI * rotate * 0.5);
    
    float d = length(uv);
    float fw = fwidth(d);
    float thickness = fw * 2.0;
    
    float f = step(d, 0.5);
    float o = smoothstep(0.5 - thickness, 0.5, d) - smoothstep(0.5, 0.5 + thickness, d);
    
    for(int i = 0; i < 3; i++) {
        uv = uv * vec2(1.0, 2.0) + vec2(0.0, 0.5);
        d = length(uv);
        fw = fwidth(d);
        thickness = fw * 2.0;
        
        f += step(d, 0.5);
        o += smoothstep(0.5 - thickness, 0.5, d) - smoothstep(0.5, 0.5 + thickness, d);
    }
    
    return vec2(f, 1.0 - clamp(o, 0.0, 1.0));
}

vec3 colorCircle(vec2 uv, vec3 c1, vec3 c2, float rotate) {
    vec2 circle = circle(uv, rotate);
    float mask = clamp(circle.x, 0.0, 1.0);

    float lines = circle.y;

    vec3 c = mix(c1, c2, mask);
    c = mix(vec3(0.0), c, lines);
    return c;
}

vec3 colors[6] = vec3[6](
    vec3(0.141, 0.380, 0.286),  // green bg
    vec3(0.204, 0.412, 0.851),  // blue bg
    vec3(0.961, 0.729, 0.812),  // pink fg
    vec3(0.710, 0.745, 0.722),  // gray-green fg
    vec3(0.922, 0.298, 0.173),  // red bg
    vec3(0.969, 0.761, 0.227)   // yellow fg
);


void main() {
    vec2 uv = v_uv;
    vec2 p = uv - 0.5;
    p.x *= u_resolution.x / u_resolution.y;

    float x = floor(mix(1.0, 8.0, uParam1));
    float y = floor(mix(1.0, 8.0, uParam2));
    float colorOffset1 = mix(2.0, 8.0, uParam3);
    float colorOffset2 = mix(0.0, 20.0, uParam4);

    // Grid details
    // rep      Number of columns and rows
    // repUV    The UV for each cell
    // cell     Cell id starting at 0 and counting +1
    vec2 rep = vec2(x, y);
    vec2 gridUV = uv * rep;
    vec2 repUV = fract(gridUV);
    vec2 cell = floor(gridUV);

    int iX = int(mod(cell.x + floor(colorOffset2 * 0.4), colorOffset1));
    int iY = int(mod(cell.y + cell.x + floor(colorOffset2 * 0.8), colorOffset1));
    float steps = floor(mod(length(cell) + u_time, 4.0));

    vec3 col = colorCircle(repUV, colors[iX], colors[iY], steps);

    out_color = vec4(col, 1.0);
}