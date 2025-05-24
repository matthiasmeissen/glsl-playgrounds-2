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
    // Background
    // Draw feedback buffer as background
    color = texture2D(u_doubleBuffer0, st).rgb;

#elif defined ( DOUBLE_BUFFER_0 )
    // Feedback Buffer
    // Get scene and mix with almost black color
    color = texture2D(u_scene, st * 0.996).rgb;
    color = color - vec3(0.01);

#elif defined ( POSTPROCESSING )
    // Postprocessing
    // Get main scene as texture
    color = texture2D(u_scene, st).rgb;

#else
    // Main Scene
    color = vec3(0.2, length(uv * uv), abs(sin(u_time * 0.2)) + 0.2);

#endif

    gl_FragColor = vec4(color, 1.0);
}