#ifdef GL_ES
precision mediump float;
#endif

// attribute: input vertex data from model buffer (only in vertex shader)
// varying: data sent from vertex to fragment shader
// uniform: constant data for the whole draw call, set by cpu (available in multiple stages)

uniform sampler2D   u_doubleBuffer0;
uniform sampler2D   u_scene;
uniform vec2        u_resolution;
uniform float       u_time;
uniform vec2        u_mouse;

varying vec4 v_color;

#include "../lygia/space/ratio.glsl"
#include "../lygia/space/center.glsl"

void main(void) {
    vec3 color = vec3(1.0);
    vec2 pixel = 1.0/u_resolution.xy;
    vec2 st = gl_FragCoord.xy * pixel;
    vec2 uv = ratio(st, u_resolution);
    uv = center(uv);

#if defined ( BACKGROUND )
    color = vec3(0.9);

#elif defined ( DOUBLE_BUFFER_0 )
    // Double Buffer
    color = texture2D(u_doubleBuffer0, st * 0.99).rgb;
    float d = step(length(vec2(uv.x + sin(u_time), uv.y)), 0.4);
    color = mix(color, vec3(d), 0.1);

#else
    // Main Buffer
    color = texture2D(u_doubleBuffer0, st).rgb + v_color.rgb;

#endif

    gl_FragColor = vec4(color, 1.0);
}