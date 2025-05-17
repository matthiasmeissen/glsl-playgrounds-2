#ifdef GL_ES
precision mediump float;
#endif

uniform mat4 u_projectionMatrix; // Converts view space to clip space (perspective)
uniform mat4 u_viewMatrix;       // Positions the camera (world space to view space)
uniform mat4 u_modelMatrix;      // Base model transformation (model space to world space)
uniform float u_time;

attribute vec4 a_position;       // Vertex position in model space
attribute vec4 a_color;

varying vec4 v_color;            // Send point color to fragment shader

#include "../lygia/math/rotate4d.glsl"
#include "../lygia/math/translate4d.glsl"
#include "../lygia/math/scale4d.glsl"
#include "../lygia/generative/cnoise.glsl"


void main(void) {
    vec3 p = a_position.xyz * 0.8;
    vec3 period = vec3(2.0, 0.8, 0.4);
    float speed = u_time * 0.2;

    vec4 displace = vec4(1.0);
    displace.x = cnoise(p + vec3(speed, 0.0, 0.0) * period);
    displace.y = cnoise(p + vec3(0.0, speed, 0.0));
    displace.z = cnoise(p + vec3(0.0, 0.0, speed));

    mat4 translationMatrix = translate4d(vec3(0.0));
    mat4 rotationMatrix = rotate4d(vec3(0.0, 1.0, 1.0), speed) * rotate4d(vec3(1.0, 0.0, 0.0), 1.4);
    mat4 scaleMatrix = scale4d(vec3(1.4));

    vec4 pm = vec4(1.0) * u_viewMatrix;

    vec4 displaced_position = mix(a_position + displace, a_position + atan(displace * 40.0), 0.6);

    vec4 local_position = translationMatrix * rotationMatrix * scaleMatrix * displaced_position;

    gl_Position = u_projectionMatrix * u_viewMatrix * u_modelMatrix * local_position;

    gl_PointSize = 1.0;

    v_color = a_color;
}