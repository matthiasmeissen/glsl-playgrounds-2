#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;

const int MAX_MARCHING_STEPS = 100;
const float MIN_HIT_DISTANCE = 0.001;
const float MAX_TRACE_DISTANCE = 100.0;

float sdSphere( vec3 p, float s ) {
    return length(p) - s;
}

vec3 sphereColor() {
    return vec3(0.4, u_mouse.y / u_resolution.y, 0.8);
}

float pMod1(inout float p, float size) {
	float halfsize = size*0.5;
	float c = floor((p + halfsize)/size);
	p = mod(p + halfsize, size) - halfsize;
	return c;
}

float smin( float a, float b, float k )
{
    float h = clamp( 0.5 + 0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}


float sceneSDF(vec3 p) {
    pMod1(p.x, 3.0);
    vec3 mouse = vec3(0.0, u_mouse.y / u_resolution.y - 0.5, 0.0);
    float sphere1 = sdSphere(p + mouse, 1.0);
    float sphere2 = sdSphere(p - vec3(0.0, 1.0 * sin(u_time), 0.0) + mouse, 0.8);

    return smin(sphere1, sphere2, 0.2);
}

vec3 calcNormal(vec3 p) {
    vec2 e = vec2(MIN_HIT_DISTANCE, 0.0);
    return normalize(vec3(
        sceneSDF(p + e.xyy) - sceneSDF(p - e.xyy),
        sceneSDF(p + e.yxy) - sceneSDF(p - e.yxy),
        sceneSDF(p + e.yyx) - sceneSDF(p - e.yyx)
    ));
}

float rayMarch(vec3 ro, vec3 rd) {
    float totalDistanceTraveled = 0.0;
    for (int i = 0; i < MAX_MARCHING_STEPS; ++i) {
        vec3 currentPos = ro + totalDistanceTraveled * rd;
        float distToScene = sceneSDF(currentPos);
        if (distToScene < MIN_HIT_DISTANCE) {
            return totalDistanceTraveled;
        }
        totalDistanceTraveled += distToScene;
        if (totalDistanceTraveled >= MAX_TRACE_DISTANCE) {
            return MAX_TRACE_DISTANCE;
        }
    }
    return MAX_TRACE_DISTANCE;
}

void main (void) {
    vec2 uv = (2.0 * gl_FragCoord.xy - u_resolution.xy) / u_resolution.y;

    vec3 ro = vec3(0.0, 0.0, 5.0);
    vec3 lookAt = vec3(0.0, 0.0, 0.0);
    vec3 rd = normalize(vec3(uv, -1.5));

    vec3 camForward = normalize(lookAt - ro);
    vec3 camRight = normalize(cross(vec3(0.0, 1.0, 0.0), camForward));
    vec3 camUp = normalize(cross(camForward, camRight));
    float focalLength = 1.5;
    rd = normalize(uv.x * camRight + uv.y * camUp + camForward * focalLength);

    float dist = rayMarch(ro, rd);

    vec3 color;
    if (dist < MAX_TRACE_DISTANCE) {
        vec3 hitPoint = ro + dist * rd;
        vec3 normal = calcNormal(hitPoint);

        vec3 lightPos = vec3(2.0 * cos(u_time * 0.5), 2.0, 2.0 * sin(u_time * 0.5));
        vec3 lightDir = normalize(lightPos - hitPoint);
        float diffuse = max(0.0, dot(normal, lightDir));
        float ambient = 0.2;

        vec3 surfaceColor = sphereColor();
        color = surfaceColor * (ambient + diffuse);

    } else {
        vec3 skyColor = vec3(uv.y, 0.8, 1.0);
        vec3 groundColor = vec3(0.1, 0.05, 0.0);
        color = mix(groundColor, skyColor, max(0.0, rd.y * 0.5 + 0.5));
    }

    color = clamp(color, 0.0, 1.0);
    gl_FragColor = vec4(color, 1.0);
}