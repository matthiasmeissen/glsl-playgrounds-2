#ifdef GL_ES
precision mediump float;
#endif

// attribute: input vertex data from model buffer (only in vertex shader)
// varying: data sent from vertex to fragment shader
// uniform: constant data for the whole draw call, set by cpu (available in multiple stages)

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
#include "../lygia/generative/curl.glsl"

void main(void) {
    vec3 color = vec3(0.0);
    vec2 pixel = 1.0/u_resolution.xy;
    vec2 st = gl_FragCoord.xy * pixel;
    vec2 uv = ratio(st, u_resolution);
    uv = center(uv);

    vec3 c = curl(vec3(uv.x, uv.y, u_time * 0.2));

#ifdef BACKGROUND
    // Background
    float d = step(0.78, c.x) - step(0.8, c.x);
    color = vec3(d);

#elif defined(POSTPROCESSING)
    // Postprocessing
    c = c * 0.04;
    st += c.xy;
    vec3 inputPass = texture2D(u_scene, st).rgb;
    color = inputPass;

#else
    // Material
    float d = fract(v_texcoord.y + u_time);
    color = vec3(d);

#endif

    gl_FragColor = vec4(color, 1.0);
}