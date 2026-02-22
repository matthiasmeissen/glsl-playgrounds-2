/*
 * CMYK Halftone Shader
 *
 * Algorithm and logic adapted from "Shades of Halftone" by Maxime Heckel.
 * Source: https://blog.maximeheckel.com/posts/shades-of-halftone/
 *
 * Implements rotated grid sampling for individual C, M, Y, K channels
 * and subtractive color mixing to simulate offset printing.
 */

#version 330 core
precision mediump float;

in vec2 v_uv;
out vec4 out_color;

uniform sampler2D u_mainPass;
uniform vec2 u_resolution;

// Controls the size of the grid cells (The "LPI" or Lines Per Inch)
uniform float uDotDensity; 
// Controls the maximum size of a dot within a cell (0.8 - 1.5 is usually good)
uniform float uDotRadius; 

uniform float uBlend;

// --- Constants (Ink definitions) ---
const float CYAN_STRENGTH    = 0.95;
const float MAGENTA_STRENGTH = 0.95;
const float YELLOW_STRENGTH  = 0.95;
const float BLACK_STRENGTH   = 1.0;

// Standard Offset Angles for CMYK Printing to prevent Moiré patterns
const float ANGLE_C = 15.0;
const float ANGLE_M = 75.0;
const float ANGLE_Y = 0.0;
const float ANGLE_K = 45.0;

// --- Helper Functions ---

// 2D Rotation Matrix
mat2 rot(float deg) {
    float a = radians(deg);
    float c = cos(a), s = sin(a);
    return mat2(c, -s, s, c);
}

// Converts standard RGB to CMYK
vec4 RGBtoCMYK(vec3 rgb) {
    float r = rgb.r;
    float g = rgb.g;
    float b = rgb.b;
    float k = min(1.0 - r, min(1.0 - g, 1.0 - b));
    vec3 cmy = vec3(0.0);
    float invK = 1.0 - k;

    if (invK != 0.0) {
        cmy.x = (1.0 - r - k) / invK;
        cmy.y = (1.0 - g - k) / invK;
        cmy.z = (1.0 - b - k) / invK;
    }
    return clamp(vec4(cmy, k), 0.0, 1.0);
}

// Transform Screen UV to Rotated Grid UV
vec2 toGridUV(vec2 uv, float angleDeg, float pixelSize) {
    vec2 screenPixels = uv * u_resolution;
    return rot(angleDeg) * screenPixels / pixelSize;
}

// Find the center of the nearest grid cell in Normalized UV space (0-1)
// This is crucial: We must sample the texture at the CENTER of the dot,
// not the current pixel, otherwise the dots look noisy.
vec2 getCellCenterUV(vec2 uv, float angleDeg, float pixelSize) {
    vec2 gridUV = toGridUV(uv, angleDeg, pixelSize);
    vec2 cellGridIndex = floor(gridUV) + 0.5;
    
    // Rotate back to screen space
    vec2 centerScreenPixels = rot(-angleDeg) * cellGridIndex * pixelSize;
    return centerScreenPixels / u_resolution;
}

// Draw the specific dot for a channel
float halftoneDot(vec2 uv, float angleDeg, float pixelSize, float coverage) {
    // Coordinate within the grid cell (-0.5 to 0.5)
    vec2 gridUV = toGridUV(uv, angleDeg, pixelSize);
    vec2 gv = fract(gridUV) - 0.5;
    
    // Calculate radius based on coverage (amount of ink)
    // Sqrt is used to ensure area is proportional to value
    float r = uDotRadius * sqrt(clamp(coverage, 0.0, 1.0));
    
    float dist = length(gv);
    
    // Anti-aliasing using fwidth
    float aa = fwidth(dist);
    return 1.0 - smoothstep(r - aa, r + aa, dist);
}

void main() {
    vec2 uv = v_uv;
    // 1. Calculate Pixel Size
    // Map uDotDensity (0.0 - 1.0) to a grid size range (e.g. 12px to 4px)
    // Higher density = Smaller pixels
    float pixelSize = mix(12.0, 4.0, uDotDensity);
    
    // 2. Sample texture at 4 different locations
    // Because the grids are rotated differently, the "center" of the Cyan dot
    // is at a different UV coordinate than the "center" of the Magenta dot.
    vec2 uvC = getCellCenterUV(v_uv, ANGLE_C, pixelSize);
    vec2 uvM = getCellCenterUV(v_uv, ANGLE_M, pixelSize);
    vec2 uvY = getCellCenterUV(v_uv, ANGLE_Y, pixelSize);
    vec2 uvK = getCellCenterUV(v_uv, ANGLE_K, pixelSize);
    
    // 3. Convert samples to CMYK
    // We only care about the specific channel for that specific lookup
    vec4 cmykC = RGBtoCMYK(texture(u_mainPass, uvC).rgb);
    vec4 cmykM = RGBtoCMYK(texture(u_mainPass, uvM).rgb);
    vec4 cmykY = RGBtoCMYK(texture(u_mainPass, uvY).rgb);
    vec4 cmykK = RGBtoCMYK(texture(u_mainPass, uvK).rgb);
    
    // 4. Calculate Dot Presence (0.0 = no dot, 1.0 = full dot)
    float dotC = halftoneDot(v_uv, ANGLE_C, pixelSize, cmykC.x);
    float dotM = halftoneDot(v_uv, ANGLE_M, pixelSize, cmykM.y);
    float dotY = halftoneDot(v_uv, ANGLE_Y, pixelSize, cmykY.z);
    float dotK = halftoneDot(v_uv, ANGLE_K, pixelSize, cmykK.w);
    
    // 5. Subtractive Color Mixing
    vec3 finalColor = vec3(1.0);
    
    finalColor.r *= (1.0 - CYAN_STRENGTH * dotC);
    finalColor.g *= (1.0 - MAGENTA_STRENGTH * dotM);
    finalColor.b *= (1.0 - YELLOW_STRENGTH * dotY);
    finalColor *= (1.0 - BLACK_STRENGTH * dotK);

    finalColor = mix(texture(u_mainPass, uv).rgb, finalColor, uBlend);
    
    out_color = vec4(finalColor, 1.0);
}