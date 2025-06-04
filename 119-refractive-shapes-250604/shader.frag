#ifdef GL_ES
precision mediump float; // Can be highp for better quality if performance allows
#endif

uniform sampler2D   u_doubleBuffer0;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse; // u_mouse.xy are pixel coordinates

// Constants for ray marching
const int MAX_MARCHING_STEPS = 256;
const float MIN_DIST = 0.001;
const float MAX_DIST = 1000.0;

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
    // 'b' is the half-extents of the inner sharp box
    // 'r' is the rounding radius
    vec3 q = abs(p) - b;
    return length(max(q, vec3(0.0))) + min(vmax(q), 0.0) - r;
}

float fOpUnionRound(float a, float b, float r) {
	vec2 u = max(vec2(r - a,r - b), vec2(0));
	return max(r, min (a, b)) - length(u);
}

float sawSigned(float x) {
    // wrap x into [−1..1)
    return mod(x + 1.0, 2.0) - 1.0;
}

float triSigned(float x) {
    float s = mod(x + 1.0, 2.0) - 1.0;     // saw-tooth in [−1..1)
    return 1.0 - abs(s) * 2.0;        // remap |s|∈[0..1] to [1..−1]
}

// --- End of minimal SDF primitives ---


// ----------------------------------------------------------------------------
// Scene Definition (Signed Distance Function - SDF)
// ----------------------------------------------------------------------------
float sceneSDF(vec3 p) {
    float dist = MAX_DIST;

    vec3 p1 = p;

    p1 *= rotationX(1.0);
    p1 *= rotationY(p1.x * 0.1);

    float blend = 0.2;

    p1.x = sawSigned(p1.x);
    p1.y = sawSigned(p1.y);

    float box = fBoxRound(p1, vec3(0.4, 0.1, 0.1), 0.2);
    dist = fOpUnionRound(dist, box, blend);

    vec3 p2 = p;
    p2.y += 2.0;

    float box2 = fBoxRound(p2 * rotationX(p2.x * 4.0 + u_time), vec3(3.0, 0.1, 0.1), 0.2);
    dist = fOpUnionRound(dist, box2, blend);

    return dist;
}
// ----------------------------------------------------------------------------
// Calculate Normal
// ----------------------------------------------------------------------------
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
// Ray Marching (Sphere Tracing)
// ----------------------------------------------------------------------------
float rayMarch(vec3 ro, vec3 rd, out vec3 pHit) {
    float t = 0.0;
    for (int i = 0; i < MAX_MARCHING_STEPS; i++) {
        vec3 p = ro + t * rd;
        float d = sceneSDF(p);

        if (d < MIN_DIST) {
            pHit = p;
            return t;
        }
        if (t > MAX_DIST || d > MAX_DIST) { // Also check if d itself is huge
            break;
        }
        t += d;
    }
    pHit = ro + t * rd;
    return MAX_DIST;
}

// ----------------------------------------------------------------------------
// Basic Shading
// ----------------------------------------------------------------------------
vec3 shade(vec3 pHit, vec3 normal, vec3 rayDir, vec3 ro) {
    vec3 col = vec3(0.4, 0.4, 0.8); // Ambient color

    vec3 lightPos = vec3(3.0, sin(u_time) * 3.0, 2.0);
    vec3 lightDir = normalize(lightPos - pHit);
    float factor = 0.0; // Usually this is 0.0
    float diffuse = max(factor, dot(normal, lightDir));

    col += vec3(0.2, 0.9, 0.7) * diffuse;

    // Specular highlight (Phong)
    vec3 viewDir = normalize(ro - pHit); // Or just -rayDir if rayDir is normalized camera ray
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
    col += vec3(1.0) * spec * 0.1;

    return col;
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

    // Camera Position
    vec3 initialCamPos = vec3(0.0, 0.0, -8.0);

    // Camera Rotation
    // ro = rotationX(0.0) * rotationY(0.0) * initialCamPos;
    ro = initialCamPos;

    vec3 lookAt = vec3(0.0, 0.0, 5.0);
    float fov = 1.8; // Field of view (lower is more zoom)

    vec3 camForward = normalize(lookAt - ro);
    vec3 camRight = normalize(cross(vec3(0.0, 1.0, 0.0), camForward));
    vec3 camUp = normalize(cross(camForward, camRight));

    rd = normalize(uv.x * camRight + uv.y * camUp + fov * camForward);


    // --- Ray Marching & Shading ---
    vec3 pHit; // Will store the hit position
    float t = rayMarch(ro, rd, pHit);

    if (t < MAX_DIST) {
        vec3 normal = calcNormal(pHit);
        finalColor = shade(pHit, normal, rd, ro);

    } else {
        finalColor = vec3(0.1);
    }

#else
    // Postprocessing

    vec2 mid = vec2(0.5, 0.5);
    vec2 scale = vec2(0.0, 0.02);

    // Calculate displacement values
    float map = smoothstep(0.5, 1.0, fract(st.y * 20.0));

    // Calculate the actual displacement offset using scale and midpoint
    vec2 offset = (vec2(map) - mid) * scale;

    // Calculate the new UV coordinate for sampling the source image
    vec2 disp = st + offset;

    // Sample the source image at the displaced UV
    //finalColor = texture2D(u_doubleBuffer0, disp).rgb;
    finalColor = texture2D(u_doubleBuffer0, st).rgb;

    // Add displace texture to visualise
    // finalColor += vec3(map);

#endif

    // Gamma correction (approximate)
    // finalColor = pow(finalColor, vec3(1.0/2.2));

    // Output to screen
    gl_FragColor = vec4(finalColor, 1.0);
}
