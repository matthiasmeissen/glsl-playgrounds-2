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

// Constants for ray marching
const int MAX_MARCHING_STEPS = 128;
const float MIN_DIST = 0.001;
const float MAX_DIST = 1000.0;

// --- Refraction Specific Constants ---
const float IOR_MATERIAL = 1.5; // Index of Refraction (e.g., 1.0 air, 1.33 water, 1.5 glass)
const float IOR_AIR = 1.1;
const vec3 ABSORPTION_COLOR = vec3(0.08, 0.08, 0.08); // Light absorption tint as it passes through
const float ABSORPTION_STRENGTH = 0.4; // Strength of absorption
const int MAX_MARCHING_STEPS_INTERNAL = 32; // Max steps for rays inside the material
const float MAX_DIST_INTERNAL = 50.0;     // Max distance for rays inside the material


float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

vec3 applyGrain(vec3 color, vec2 uv, float time, float strength) {
    float noise = random(uv + fract(time * 10.0));
    float grain = (noise - 0.5) * strength;
    return color + vec3(grain);
}

float vmax(vec3 v) {
	return max(max(v.x, v.y), v.z);
}

mat3 rotationY(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat3(
        c, 0, s,
        0, 1, 0,
        -s, 0, c
    );
}

mat3 rotationX(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat3(
        1, 0, 0,
        0, c, -s,
        0, s, c
    );
}

mat3 rotationZ(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat3(
        c, -s, 0,
        s, c, 0,
        0, 0, 1
    );
}

vec3 mapColorSmooth(float gray) {
    vec3 c1 = vec3(0.15, 0.10, 0.30);     
    vec3 c2 = vec3(0.70, 0.20, 0.30);     
    vec3 c3 = vec3(1.00, 0.45, 0.35);     
    vec3 c4 = vec3(1.00, 0.70, 0.60);     
    vec3 c5 = vec3(1.00, 0.90, 0.80);     
    vec3 c6 = vec3(1.00, 0.98, 0.85);  

    vec3 col = c1;
    col = mix(col, c2, smoothstep(0.0, 0.2, gray));
    col = mix(col, c3, smoothstep(0.2, 0.4, gray));
    col = mix(col, c4, smoothstep(0.4, 0.6, gray));
    col = mix(col, c5, smoothstep(0.6, 0.8, gray));
    col = mix(col, c6, smoothstep(0.8, 1.0, gray));
    
    return col;
}
// --- SDF Primitives ---

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


// ----------------------------------------------------------------------------
// Scene Definition
// ----------------------------------------------------------------------------

float sceneSDF(vec3 p) {
    float dist = MAX_DIST;

    float height = mix(0.0, 2.0, uParam2);
    float size = mix(1.0, 2.0, uParam4);

    vec3 p1 = p;
    p1 *= rotationY(radians(u_time * 20.0));

    float box = fBoxRound(p1, vec3(0.2, 2.0, abs(p.y) + height), 0.2);
    dist = fOpUnionRound(dist, box, 0.2);

    p1 *= rotationX(radians(u_time * 20.0));
    float box2 = fBoxRound(p1, vec3(abs(p.y) + height, 1.6, 0.2), 0.2);
    dist = fOpUnionRound(dist, box2, 0.2);

    float box3 = fBoxRound(p1, vec3(size, 0.1, size), 0.1);
    dist = fOpUnionRound(dist, box3, 0.2);

    return dist;
}


vec3 calcNormal(vec3 p) {
    const float eps = 0.001;
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

        if (abs(d) < MIN_DIST) {
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
    float t = MIN_DIST;
    for (int i = 0; i < MAX_MARCHING_STEPS_INTERNAL; ++i) {
        vec3 p = ro + t * rd;
        float sdfVal = sceneSDF(p);

        if (sdfVal > -MIN_DIST && t > MIN_DIST*1.5) {
            pExit = p - rd * sdfVal;
            return t;
        }
        if (t > MAX_DIST_INTERNAL) {
            pExit = p;
            return MAX_DIST_INTERNAL;
        }
        t += max(MIN_DIST, abs(sdfVal));
    }
    pExit = ro + t * rd;
    return MAX_DIST_INTERNAL;
}

vec3 getBackgroundColor(vec3 rayDir) {
    float d = rayDir.y + uParam1;
    vec3 c = mapColorSmooth(d);
    return c;
}



void main() {
    vec2 uv = v_uv - 0.5;
    float aspect = u_resolution.x / u_resolution.y;
    uv.x *= aspect;

    uv *= 2.0;

    vec3 finalColor = vec3(0.0);

    vec3 ro; // Ray Origin
    vec3 rd; // Ray Direction

    vec3 initialCamPos = vec3(0.0, 0.0, -4.0);
    ro = initialCamPos;

    vec3 lookAt = vec3(0.0, 0.0, 0.0);
    float fov = mix(0.4, 1.0, uParam3);

    vec3 camForward = normalize(lookAt - ro);
    vec3 camRight = normalize(cross(vec3(0.0, 1.0, 0.0), camForward));
    vec3 camUp = normalize(cross(camForward, camRight));

    rd = normalize(uv.x * camRight + uv.y * camUp + fov * camForward);

    vec3 pHit_entry;
    float t_entry = rayMarch(ro, rd, pHit_entry);

    if (t_entry < MAX_DIST) {
        vec3 normal_entry = calcNormal(pHit_entry);

        float NdotV = abs(dot(normal_entry, rd));
        float R0 = pow((IOR_AIR - IOR_MATERIAL) / (IOR_AIR + IOR_MATERIAL), 2.0);
        float fresnel = R0 + (1.0 - R0) * pow(1.0 - NdotV, 5.0);

        vec3 reflectedColor = vec3(0.0);
        if (fresnel > 0.001) {
            vec3 reflectDir = reflect(rd, normal_entry);
            reflectedColor = getBackgroundColor(reflectDir);
        }

        // --- Refracted component ---
        vec3 refractedColor = vec3(0.0);
        float eta_enter = IOR_AIR / IOR_MATERIAL;
        vec3 refractDir_enter = refract(rd, normal_entry, eta_enter);

        if (dot(refractDir_enter, refractDir_enter) > 0.0) {
            vec3 ro_internal = pHit_entry + refractDir_enter * MIN_DIST * 2.0;
            
            vec3 pHit_exit;
            float t_internal = rayMarchExit(ro_internal, refractDir_enter, pHit_exit);

            if (t_internal < MAX_DIST_INTERNAL) {
                vec3 normal_exit = calcNormal(pHit_exit);
                float eta_exit = IOR_MATERIAL / IOR_AIR;
                vec3 refractDir_exit = refract(refractDir_enter, normal_exit, eta_exit);

                if (dot(refractDir_exit, refractDir_exit) > 0.0) {
                    refractedColor = getBackgroundColor(refractDir_exit);
                    float dist_travelled_inside = length(pHit_exit - pHit_entry);
                    vec3 absorption = exp(-ABSORPTION_COLOR * ABSORPTION_STRENGTH * dist_travelled_inside);
                    refractedColor *= absorption;
                } else {
                    vec3 reflectDir_internal = reflect(refractDir_enter, normal_exit);
                    refractedColor = getBackgroundColor(reflectDir_internal);
                    refractedColor *= 0.3;
                }
            } else {
                refractedColor = getBackgroundColor(refractDir_enter) * 0.1;
            }
        }

        finalColor = mix(refractedColor, reflectedColor, fresnel);

    } else {
        finalColor = getBackgroundColor(rd);
    }

    finalColor = applyGrain(finalColor, uv, u_time, 0.2);

    vec3 col = finalColor;

    out_color = vec4(col, 1.0);
}