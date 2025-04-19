#ifdef GL_ES
precision mediump float;
#endif

uniform vec2    u_resolution;
uniform float   u_time;
uniform vec2    u_mouse;
uniform float    u_input;

#define RESOLUTION          u_resolution
#define RAYMARCH_MULTISAMPLE 4
#define RAYMARCH_BACKGROUND (RAYMARCH_AMBIENT + rayDirection.y * 0.8)
#define RAYMARCH_AMBIENT    vec3(0.6, 0.8, 1.0)

#include "../lygia/space/ratio.glsl"
#include "../lygia/sdf.glsl"
#include "../lygia/lighting/raymarch.glsl"
#include "../lygia/color/space/linear2gamma.glsl"
#include "../lygia/generative/pnoise.glsl"
#include "../lygia/space/rotate.glsl"
#include "../lygia/space/scale.glsl"

float noiseFloor(vec2 uv, float scale) {
    float n = pnoise(vec3(uv.x, uv.y + u_time, u_time * 0.2), vec3(4.0, 2.4, 8.0));
    float s = (step(n, 0.5) - step(n, 0.48)) + 0.01;
    return s;
}

Material raymarchMap( in vec3 pos ) {
    // Material(color, metallic, roughness, sdf_distance)
    vec3 groundPlaneTexture = vec3(noiseFloor(pos.xz, 1.0));
    float groundPlaneDistance = planeSDF(pos);
    Material plane = materialNew(groundPlaneTexture, 0.1, 1.0, groundPlaneDistance);

    vec3 sphereTexture = vec3(1.0);
    float sphereDistance = sphereSDF(pos - vec3( 0.0, 0.60, sin(u_time)), 0.5);
    float sphereDistance1 = sphereSDF(pos - vec3(sin(u_time), 0.60, 0.0), 0.5);
    float spheresDistance = opUnion(sphereDistance, sphereDistance1, 0.2);
    Material spheres = materialNew(sphereTexture, 0.0, 0.2, spheresDistance);

    Material scene = opUnion( plane, spheres );
    
    return scene;
}

float pattern(vec2 st) {
    st = ratio(st, u_resolution.xy);

    st = scale(st, abs(sin(u_time * 0.4))+ 0.2);

    vec2 stf = rotate(st, u_time * 0.4);

    float d = sin(u_time * 0.8) * 0.3;

    float s1 = circleSDF(stf + vec2(d, 0.0));
    float s2 = circleSDF(st - vec2(d, 0.0));
    float s3 = circleSDF(st + vec2(0.0, d));
    float s4 = circleSDF(st - vec2(0.0, d));

    float s12 = opUnion(s1, s2, 0.1);
    float s34 = opUnion(s3, s4, 0.1);
    float s = opUnion(s12, s34, 0.1);

    s = step(s, 0.4) - step(s, 0.2);

    return s;
}

void main(void) {
    vec3 color = vec3(0.0);
    vec2 pixel = 1.0/u_resolution.xy;
    vec2 st = gl_FragCoord.xy * pixel;
    vec2 uv = ratio(st, u_resolution);
    vec2 mo = u_mouse * pixel;

    vec3 cam = vec3(0.0, 2.0, mod(u_time * st.y * 4.0, 8.0) + 2.0);
    
    color = raymarch(cam, vec3(0.0, 1.0, 0.0), uv).rgb;
    color = mix(color, 1.0 - color, u_input);
    color /= pattern(st);
    color = linear2gamma(color);

    gl_FragColor = vec4(color, 1.0);
}