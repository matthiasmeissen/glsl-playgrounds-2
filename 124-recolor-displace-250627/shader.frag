#ifdef GL_ES
precision mediump float; // Can be highp for better quality if performance allows
#endif

uniform sampler2D   u_doubleBuffer0;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse; // u_mouse.xy are pixel coordinates

#define rot2(a) mat2(cos(a), sin(a), -sin(a), cos(a))

// Constants for ray marching
const int MAX_MARCHING_STEPS = 256;
const float MIN_DIST = 0.001;
const float MAX_DIST = 1000.0;

// --- Refraction Specific Constants ---
const float IOR_MATERIAL = 1.5; // Index of Refraction (e.g., 1.0 air, 1.33 water, 1.5 glass)
const float IOR_AIR = 1.0;
const float ABSORPTION_STRENGTH = 0.4; // Strength of absorption
const int MAX_MARCHING_STEPS_INTERNAL = 64; // Max steps for rays inside the material
const float MAX_DIST_INTERNAL = 50.0;     // Max distance for rays inside the material

const vec3 ABSORPTION_COLOR = vec3(0.251, 0.188, 0.961);
const vec3 SKY_TOP = vec3(0.251, 0.188, 0.961);
const vec3 SKY_BOTTOM = vec3(0.482, 0.486, 0.196);


float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

vec3 applyGrain(vec3 color, vec2 uv, float time, float strength) {
    float noise = random(uv + fract(time * 10.0));
    float grain = (noise - 0.5) * strength;
    return color + vec3(grain);
}

// --- Minimal SDF primitives ---
float vmax(vec3 v) {
	return max(max(v.x, v.y), v.z);
}

// Helper function to create a Y-axis rotation matrix
mat3 rotationY(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat3(
        c, 0, s,
        0, 1, 0,
        -s, 0, c
    );
}

// Helper function to create an X-axis rotation matrix
mat3 rotationX(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat3(
        1, 0, 0,
        0, c, -s,
        0, s, c
    );
}

// Helper function to create a Z-axis rotation matrix
mat3 rotationZ(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat3(
        c, -s, 0,
        s, c, 0,
        0, 0, 1
    );
}

float fSphere(vec3 p, float r) {
    return length(p) - r;
}

float fBox(vec3 p, vec3 b) {
	vec3 d = abs(p) - b;
	return length(max(d, vec3(0))) + vmax(min(d, vec3(0)));
}

float fBoxRound(vec3 p, vec3 b, float r) {
    vec3 q = abs(p) - b;
    return length(max(q, vec3(0.0))) + min(vmax(q), 0.0) - r;
}

float fOpUnionRound(float a, float b, float r) {
	vec2 u = max(vec2(r - a,r - b), vec2(0));
	return max(r, min (a, b)) - length(u);
}

float sawSigned(float x) {
    return mod(x + 1.0, 2.0) - 1.0;
}

float starCircleSDF( in vec3 p, in float size, in float thickness ) {
    vec2 d = vec2(p.x * p.y * p.z * sin(p.y * 2.0), length(p) - size);
    return length(d) - thickness;
}

// --- End of minimal SDF primitives ---


// ----------------------------------------------------------------------------
// Scene Definition
// ----------------------------------------------------------------------------
float sceneSDF(vec3 p) {
    float dist = MAX_DIST;

    float d = mix(p.x, p.y, sin(u_time * 0.82));
    float size = mix(1.0, p.y * 0.4, sin(u_time * 0.35) * 0.8);

    p *= rotationY(d + u_time);
    vec3 p1 = vec3(p.x * sin(p.y * 4.0 + u_time), p.y, p.z);
    p1 *= rotationY(u_time);

    float s = fBoxRound(p1, vec3(0.4, 2.0, 0.4) * size, 0.2);
    dist = fOpUnionRound(dist, s, 0.4);

    return dist;
}
// ----------------------------------------------------------------------------
// Calculate Normal
// ----------------------------------------------------------------------------
vec3 calcNormal(vec3 p) {
    const float eps = 0.001; // Should be smaller than MIN_DIST
    vec2 h = vec2(eps, 0);
    return normalize(vec3(
        sceneSDF(p + h.xyy) - sceneSDF(p - h.xyy),
        sceneSDF(p + h.yxy) - sceneSDF(p - h.yxy),
        sceneSDF(p + h.yyx) - sceneSDF(p - h.yyx)
    ));
}

// ----------------------------------------------------------------------------
// Ray Marching (Sphere Tracing) - For initial hit from outside
// ----------------------------------------------------------------------------
float rayMarch(vec3 ro, vec3 rd, out vec3 pHit) {
    float t = 0.0;
    for (int i = 0; i < MAX_MARCHING_STEPS; i++) {
        vec3 p = ro + t * rd;
        float d = sceneSDF(p);

        if (abs(d) < MIN_DIST) { // Check abs(d) for robustness, though d should be positive here
            pHit = p;
            return t;
        }
        if (t > MAX_DIST || d > MAX_DIST) {
            break;
        }
        t += d;
    }
    pHit = ro + t * rd;
    return MAX_DIST;
}

// ----------------------------------------------------------------------------
// Ray Marching for Exiting an Object (from inside)
// ----------------------------------------------------------------------------
float rayMarchExit(vec3 ro, vec3 rd, out vec3 pExit) {
    float t = MIN_DIST; // Start a tiny step away from ro to ensure we are not stuck on entry surface
    for (int i = 0; i < MAX_MARCHING_STEPS_INTERNAL; ++i) {
        vec3 p = ro + t * rd;
        float sdfVal = sceneSDF(p);

        // If sdfVal is positive, we have exited or are outside.
        if (sdfVal > -MIN_DIST && t > MIN_DIST*1.5) { // Crossed boundary, now outside or very near surface
            pExit = p - rd * sdfVal; // Attempt to step back onto the surface
            return t;
        }
        if (t > MAX_DIST_INTERNAL) {
            pExit = p;
            return MAX_DIST_INTERNAL;
        }
        // If inside (sdfVal < 0), distance to boundary is -sdfVal.
        // We step by at least MIN_DIST to ensure progress.
        t += max(MIN_DIST, abs(sdfVal));
    }
    pExit = ro + t * rd;
    return MAX_DIST_INTERNAL;
}


// ----------------------------------------------------------------------------
// Background Color (e.g., a simple sky gradient)
// ----------------------------------------------------------------------------
vec3 getBackgroundColor(vec3 rayDir) {
    float t = 0.5 * (normalize(rayDir).y + 1.0);
    return mix(SKY_TOP, SKY_BOTTOM, t);
}


// ----------------------------------------------------------------------------
// Main Function
// ----------------------------------------------------------------------------
void main(void) {
    vec2 pixel = 1.0/u_resolution.xy;
    vec2 st = gl_FragCoord.xy * pixel;
    vec2 uv = (2.0 * gl_FragCoord.xy - u_resolution.xy) / u_resolution.y;

    vec3 finalColor;

#ifdef DOUBLE_BUFFER_0
    // Base Image

    // --- Camera Setup ---
    vec3 ro; // Ray Origin
    vec3 rd; // Ray Direction

    vec3 initialCamPos = vec3(0.0, 0.0, -4.0);
    ro = initialCamPos;

    vec3 lookAt = vec3(0.0, 0.0, 0.0); // Look at origin
    float fov = 0.9; // Field of view

    vec3 camForward = normalize(lookAt - ro);
    vec3 camRight = normalize(cross(vec3(0.0, 1.0, 0.0), camForward));
    vec3 camUp = normalize(cross(camForward, camRight));

    rd = normalize(uv.x * camRight + uv.y * camUp + fov * camForward);

    // --- Ray Marching & Refractive Shading ---
    vec3 pHit_entry;
    float t_entry = rayMarch(ro, rd, pHit_entry);

    if (t_entry < MAX_DIST) {
        vec3 normal_entry = calcNormal(pHit_entry);

        // Fresnel calculation (Schlick's approximation)
        float NdotV = abs(dot(normal_entry, rd));
        float R0 = pow((IOR_AIR - IOR_MATERIAL) / (IOR_AIR + IOR_MATERIAL), 2.0);
        float fresnel = R0 + (1.0 - R0) * pow(1.0 - NdotV, 5.0);

        // --- Reflected component ---
        vec3 reflectedColor = vec3(0.0);
        if (fresnel > 0.001) { // Only compute if significant
            vec3 reflectDir = reflect(rd, normal_entry);
            // For simple reflections, sample background. Could also raymarch again.
            reflectedColor = getBackgroundColor(reflectDir);
        }

        // --- Refracted component ---
        vec3 refractedColor = vec3(0.0);
        float eta_enter = IOR_AIR / IOR_MATERIAL;
        vec3 refractDir_enter = refract(rd, normal_entry, eta_enter);

        if (dot(refractDir_enter, refractDir_enter) > 0.0) { // No Total Internal Reflection (TIR) on entry
            // Start internal ray slightly inside the surface along the refracted direction
            vec3 ro_internal = pHit_entry + refractDir_enter * MIN_DIST * 2.0;
            
            vec3 pHit_exit;
            float t_internal = rayMarchExit(ro_internal, refractDir_enter, pHit_exit);

            if (t_internal < MAX_DIST_INTERNAL) {
                vec3 normal_exit = calcNormal(pHit_exit);
                float eta_exit = IOR_MATERIAL / IOR_AIR; // Exiting from material to air
                vec3 refractDir_exit = refract(refractDir_enter, normal_exit, eta_exit);

                if (dot(refractDir_exit, refractDir_exit) > 0.0) { // No TIR on exit
                    refractedColor = getBackgroundColor(refractDir_exit);

                    // Beer's Law for absorption
                    float dist_travelled_inside = length(pHit_exit - pHit_entry); // Approximate actual distance, t_internal is along ray
                    vec3 absorption = exp(-ABSORPTION_COLOR * ABSORPTION_STRENGTH * dist_travelled_inside);
                    refractedColor *= absorption;

                } else {
                    // Total Internal Reflection on exit: reflect internally
                    vec3 reflectDir_internal = reflect(refractDir_enter, normal_exit);
                    refractedColor = getBackgroundColor(reflectDir_internal); // Simplified: reflected internal ray sees background
                    // Could also be made darker or trace further
                    refractedColor *= 0.3; // Dim internal reflection
                }
            } else {
                // Internal ray didn't find an exit (e.g., got lost, or object is "infinitely" thick for the ray)
                // Can set to black or a very dark color, or background along refractDir_enter
                 refractedColor = getBackgroundColor(refractDir_enter) * 0.1; // Ray lost inside, show highly dimmed background
            }
        } else {
            // Total Internal Reflection on entry - all light is reflected
            // fresnel should be 1.0 in this case, so reflectedColor will dominate.
            // refractedColor remains vec3(0.0)
        }

        finalColor = mix(refractedColor, reflectedColor, fresnel);

    } else {
        finalColor = getBackgroundColor(rd); // Ray missed all objects
    }

#else
    // Postprocessing
    
    vec2 mid = vec2(0.5, 0.5);
    vec2 scale = vec2(0.0, 0.02);

    // For water drop like effect use
    // vec2 scale = vec2(0.2, 0.1);
    // float map = smoothstep(0.5, 1.0, fract(length(uv) * 2.0 - u_time));

    // Displacement
    float map = smoothstep(0.5, 1.0, fract(uv.y * 2.0 - u_time * 0.8));
    

    // Calculate the actual displacement offset using scale and midpoint
    vec2 offset = (vec2(map) - mid) * scale;

    // Calculate the new UV coordinate for sampling the source image
    vec2 disp = st + offset;

    // Sample the source image at the displaced UV
    finalColor = texture2D(u_doubleBuffer0, disp).rgb;

    // Add grain to image
    finalColor = applyGrain(finalColor, uv, 0.0, 0.1);

#endif

    // Output to screen
    gl_FragColor = vec4(finalColor, 1.0);
}
