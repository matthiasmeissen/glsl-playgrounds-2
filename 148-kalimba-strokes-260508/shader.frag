#version 330 core
precision mediump float;

// =========================================================================
// INPUTS & UNIFORMS
// =========================================================================
in vec2 v_uv;
uniform vec2 u_resolution;
uniform float u_time;

// Control Parameters mapped to Material/Shape
uniform float uParam1; // Shape Repetition X
uniform float uParam2; // Shape Repetition Y
uniform float uParam3; // Material: Metallic (0.0 = Glass/Plastic, 1.0 = Metal)
uniform float uParam4; // Material: Roughness / IOR mix

out vec4 out_color;

// =========================================================================
// CONSTANTS & DEFINES
// =========================================================================
#define PI 3.1415926535
#define MAX_STEPS 128
#define MAX_DIST 100.0
#define SURF_DIST 0.001

// Internal marching (expensive, only used for glass)
#define MAX_STEPS_INTERNAL 32 
#define MAX_DIST_INTERNAL 20.0

// Rotation Helper
#define rot(a) mat2(cos(a), -sin(a), sin(a), cos(a))

// =========================================================================
// STRUCTURES
// =========================================================================
// Defines surface properties similar to a Standard Surface shader
struct Material {
    vec3 albedo;        // Base color
    float metallic;     // 0.0 = Dielectric, 1.0 = Metal
    float roughness;    // 0.0 = Smooth, 1.0 = Rough
    float transmission; // 0.0 = Opaque, 1.0 = Glass/Liquid
    float ior;          // Index of Refraction
    vec3 absorption;    // Color absorbed inside the object (Volume color)
};

// =========================================================================
// SDF PRIMITIVES LIBRARY
// (Standard signed distance functions)
// =========================================================================

// 1. Sphere: p = point, s = radius
float sdSphere(vec3 p, float s) {
    return length(p) - s;
}

// 2. Box: p = point, b = bound dimensions
float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

// 3. Rounded Box: r = corner radius
float sdRoundBox(vec3 p, vec3 b, float r) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}

// 4. Torus: t.x = major radius, t.y = thickness radius
float sdTorus(vec3 p, vec2 t) {
    vec2 q = vec2(length(p.xz) - t.x, p.y);
    return length(q) - t.y;
}

// 5. Cylinder: h.x = radius, h.y = height
float sdCylinder(vec3 p, vec2 h) {
    vec2 d = abs(vec2(length(p.xz), p.y)) - h;
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

// 6. Capsule: a = start pos, b = end pos, r = radius
float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
    vec3 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h) - r;
}

// 7. Plane: n = normalized normal, h = height/distance from origin
float sdPlane(vec3 p, vec3 n, float h) {
    return dot(p, n) + h;
}

// =========================================================================
// BOOLEAN OPERATORS
// =========================================================================

// Union: joins two shapes
float opUnion(float d1, float d2) { return min(d1, d2); }

// Subtraction: subtracts d1 from d2
float opSubtraction(float d1, float d2) { return max(-d1, d2); }

// Intersection: only where both exist
float opIntersection(float d1, float d2) { return max(d1, d2); }

// Smooth Union: blends shapes together like liquid
float opSmoothUnion(float d1, float d2, float k) {
    float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
    return mix(d2, d1, h) - k * h * (1.0 - h);
}

// =========================================================================
// UTILITIES
// =========================================================================

// Rotate Y
mat3 rotationY(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat3(c, 0, s, 0, 1, 0, -s, 0, c);
}

// Rotate X
mat3 rotationX(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat3(1, 0, 0, 0, c, -s, 0, s, c);
}

// Rotate Z
mat3 rotationZ(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat3(c, -s, 0, s, c, 0, 0, 0, 1);
}

// Domain Repetition
vec3 opRep(vec3 p, vec3 c) {
    return mod(p + 0.5 * c, c) - 0.5 * c;
}

// =========================================================================
// 2D Functions
// =========================================================================

float starSDF(vec2 uv, float strength) {
    float d = length(vec2(uv.x * uv.y, uv.y * uv.x)) * strength;
    d += length(uv) * 1.0;
    return d;
}

// =========================================================================
// SCENE DEFINITION (GEOMETRY)
// =========================================================================

float map(vec3 p) {
    float d = MAX_DIST;
    
    vec3 q = p;
    q.xz *= rot(u_time * 0.4);
    q.yx *= rot(u_time * 0.2);
    
    float sphere = sdSphere(q, 0.6);
    
    vec3 q1 = q * rotationZ(PI * 0.5);
    float cylinder = sdCylinder(q1, vec2(0.15, 1.4));

    d = opSmoothUnion(sphere, cylinder, 0.2); 

    vec3 q2 = q * rotationZ(PI * 0.5);
    float torus1 = sdTorus(q2, vec2(0.9, 0.1));

    d = opSmoothUnion(d, torus1, 0.2);

    float torus2 = sdTorus(q, vec2(1.0, 0.1));

    d = opSmoothUnion(d, torus2, 0.4);

    return d;
}

// =========================================================================
// MATERIAL SYSTEM
// =========================================================================

Material getMaterial(vec3 p) {
    Material mat;
    
    mat.albedo = vec3(0.8); 
    mat.metallic = uParam2;           
    mat.roughness = uParam1;
    mat.transmission = 1.0 - uParam3;
    mat.ior = mix(1.1, 2.4, uParam4); // 1.1 Air/Water, 2.4 Diamond
    mat.absorption = vec3(0.08, 0.02, 0.15); 
    
    return mat;
}

// =========================================================================
// ENVIRONMENT / LIGHTING
// =========================================================================

// Generates the background color (Environment Map)
vec3 getEnvironment(vec3 rayDir, float roughness) {
    vec2 uv = rayDir.xy;
    
    vec3 bg = vec3(1.0, 0.0, 0.0);

    float d = sin(uv.y * 4.0 + u_time * 0.4);
    d *= fract(uv.x * 8.0 + u_time);
    d = step(0.2, d);
    bg *= d;
    
    // Sun (blurs with roughness)
    float specPower = mix(32.0, 1.0, roughness); 
    float sun = pow(max(0.0, dot(rayDir, normalize(vec3(0.5)))), specPower);
    //bg += vec3(0.1) * sun;
    
    return bg;
}

vec3 getNormal(vec3 p) {
    vec2 e = vec2(SURF_DIST, 0.0);
    vec3 n = vec3(
        map(p + e.xyy) - map(p - e.xyy),
        map(p + e.yxy) - map(p - e.yxy),
        map(p + e.yyx) - map(p - e.yyx)
    );
    return normalize(n);
}

// =========================================================================
// RENDERING LOGIC
// =========================================================================

// Schlick's approximation for Fresnel
// F0 = Surface reflection at 0 degrees (0.04 for dielectric, Albedo for Metal)
vec3 fresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

// Raymarch for calculating ray exit point (Volume Transmission)
float rayMarchInternal(vec3 ro, vec3 rd) {
    float t = 0.01; // Start slightly offset
    for(int i = 0; i < MAX_STEPS_INTERNAL; i++) {
        vec3 p = ro + rd * t;
        float d = -map(p); // Inverted SDF for inside
        
        if(d < SURF_DIST) return t; // Boundary hit
        if(t > MAX_DIST_INTERNAL) break;
        t += d;
    }
    return t;
}

// Primary Raymarcher
float rayMarch(vec3 ro, vec3 rd) {
    float t = 0.0;
    for(int i = 0; i < MAX_STEPS; i++) {
        vec3 p = ro + rd * t;
        float d = map(p);
        
        if(d < SURF_DIST) return t;
        if(t > MAX_DIST) return MAX_DIST;
        t += d;
    }
    return MAX_DIST;
}

// ----------------------------------------------------------------------------
// MAIN SHADING FUNCTION
// This combines Metal, Dielectric, and Glass workflows
// ----------------------------------------------------------------------------
vec3 renderSurface(vec3 p, vec3 n, vec3 rd, Material mat) {
    vec3 viewDir = -rd;
    float NdotV = max(dot(n, viewDir), 0.0);
    
    // 1. Calculate Base Reflection (F0) based on IOR
    float F0_dielectric = pow((1.0 - mat.ior) / (1.0 + mat.ior), 2.0);
    vec3 F0 = mix(vec3(F0_dielectric), mat.albedo, mat.metallic);
    
    // 2. Fresnel
    vec3 F = fresnelSchlick(NdotV, F0); 

    // 3. Reflection (Roughness Aware)
    vec3 refDir = reflect(rd, n);
    vec3 reflectionCol = getEnvironment(refDir, mat.roughness);
    
    // 4. Refraction (Glass)
    vec3 refractionCol = vec3(0.0);
    
    if (mat.transmission > 0.0) {
        float eta = 1.0 / mat.ior; 
        vec3 refractDir = refract(rd, n, eta);
        
        if (length(refractDir) > 0.0) {
            // March through volume
            vec3 pEnter = p - n * SURF_DIST * 2.0;
            float distThrough = rayMarchInternal(pEnter, refractDir);
            vec3 pExit = pEnter + refractDir * distThrough;
            
            // Beer's Law Absorption
            vec3 absorption = exp(-mat.absorption * distThrough);
            
            // Exit Refraction approximation
            vec3 nExit = -getNormal(pExit);
            vec3 exitDir = refract(refractDir, nExit, mat.ior); 
            
            // Handle Total Internal Reflection at exit
            if (length(exitDir) == 0.0) exitDir = reflect(refractDir, nExit); 
            
            refractionCol = getEnvironment(exitDir, mat.roughness) * absorption;
        } else {
            // Total Internal Reflection at entry
            refractionCol = reflectionCol; 
        }
    }
    
    // 5. Combine (Metal vs Dielectric vs Glass)
    vec3 finalColor = vec3(0.0);
    
    // Diffuse Lighting
    vec3 diffuse = mat.albedo * (dot(n, vec3(0,1,0)) * 0.5 + 0.5); 
    diffuse *= (1.0 - mat.metallic); 
    
    if (mat.transmission > 0.0 && mat.metallic < 1.0) {
        // Glass Workflow: Mix Refraction and Reflection
        finalColor = mix(refractionCol, reflectionCol, F);
        finalColor *= mat.albedo; 
    } else {
        // Solid/Metal Workflow
        vec3 kD = (vec3(1.0) - F) * (1.0 - mat.metallic);
        finalColor = kD * diffuse + reflectionCol * F; 
    }
    
    return finalColor;
}


// =========================================================================
// MAIN
// =========================================================================

void main() {
    // Normalized Coordinates (-0.5 to 0.5)
    vec2 uv = (v_uv - 0.5);
    uv.x *= u_resolution.x / u_resolution.y;
    
    // Camera Setup
    vec3 ro = vec3(0.0, 0.0, -1.2); // Ray Origin
    vec3 lookAt = vec3(0.0, 0.0, 0.0);
    
    vec3 fwd = normalize(lookAt - ro);
    vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), fwd));
    vec3 up = cross(fwd, right);
    
    // 4. FOV / Zoom Control
    // 1.0 = 90 degrees (Standard)
    // 2.0 = Telephoto
    // 0.5 = Wide Angle
    float zoom = 0.2;
    vec3 rd = normalize(uv.x * right + uv.y * up + fwd * zoom);
    
    // Initial Background
    vec3 col = getEnvironment(rd, 0.0);
    
    // Raymarch
    float d = rayMarch(ro, rd);
    
    if (d < MAX_DIST) {
        vec3 p = ro + rd * d;
        vec3 n = getNormal(p);
        
        // Get Material Properties for this pixel
        Material mat = getMaterial(p);
        
        // Calculate Shading
        col = renderSurface(p, n, rd, mat);
    }
    
    // Post Processing
    // Gamma correction
    col = pow(col, vec3(0.4545));
    
    // Simple Vignette
    col *= 1.0 - dot(v_uv - 0.5, v_uv - 0.5) * 0.5;
    
    out_color = vec4(col, 1.0);
}