#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D   u_doubleBuffer0;
uniform vec2        u_resolution;
uniform float       u_time;
uniform vec2        u_mouse;

#include "../lygia/space/ratio.glsl"
#include "../lygia/space/rotate.glsl"
#include "../lygia/filter/boxBlur.glsl"

void main(void) {
    vec3 color = vec3(0.0);
    vec2 pixel = 1.0/u_resolution.xy;
    vec2 st = gl_FragCoord.xy * pixel;
    vec2 uv = ratio(st, u_resolution) - 0.5;

#ifdef DOUBLE_BUFFER_0
    // Base Image

    float t = length(uv);
    st = rotate(st, u_time + uv.x * 40.0);
    t += fract(st.x * 14.0 + u_time);
    t = step(t, 0.4);

    color = vec3(t);

#else
    // Postprocessing

    vec3 inputPass = texture2D(u_doubleBuffer0, st).rgb;

    vec3 blur =  boxBlur(u_doubleBuffer0, st, pixel, int(80.0)).rgb;

    blur = step(vec3(0.4), blur);

    st = rotate(st, u_time + st.x * 20.0);
    color = st.y > 0.6 ? inputPass : blur;

#endif

    gl_FragColor = vec4(color, 1.0);
}