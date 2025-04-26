#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D   u_scene;
uniform sampler2D   u_scene_depth;
uniform vec2        u_resolution;
uniform float       u_time;
uniform vec2        u_mouse;

varying vec4 v_position;
varying vec4 v_color;
varying vec3 v_normal;
varying vec2 v_texcoord;

#include "../lygia/space/ratio.glsl"
#include "../lygia/space/center.glsl"
#include "../lygia/filter/boxBlur.glsl"

void main(void) {
    vec3 color = vec3(0.0);
    vec2 pixel = 1.0/u_resolution.xy;
    vec2 st = gl_FragCoord.xy * pixel;
    vec2 uv = ratio(st, u_resolution);
    uv = center(uv);

#ifdef BACKGROUND
    // Background
    float d1 = length(uv * atan(uv) / sin(st.x + u_time));
    uv = mod(uv * 8.0, 1.0);
    float d2 = length(uv * atan(uv) / sin(st.x + u_time));
    float d = mix(step(0.8, d2), d1, d1*d2);

    color = vec3(d);

#elif defined(POSTPROCESSING)
    // Postprocessing

    vec2 size = mix(st, st * 4.0, uv.x);

    vec3 blur =  boxBlur(u_scene, size, pixel, int(80.0)).rgb;

    blur = step(0.4, blur);

    color = blur;

#else
    // Material
    color = vec3(1.0);

#endif

    gl_FragColor = vec4(color, 1.0);
}