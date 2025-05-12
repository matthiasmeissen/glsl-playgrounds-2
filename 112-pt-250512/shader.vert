#ifdef GL_ES
precision mediump float;
#endif

uniform mat4 u_projectionMatrix; // Converts view space to clip space (perspective)
uniform mat4 u_viewMatrix;       // Positions the camera (world space to view space)
uniform mat4 u_modelMatrix;      // Base model transformation (model space to world space)
uniform float u_time;

attribute vec4 a_position;       // Vertex position in model space

varying vec4 v_color;            // Send point color to fragment shader
varying vec4 v_pos;

#include "../lygia/math/rotate4d.glsl"
#include "../lygia/math/translate4d.glsl"
#include "../lygia/math/scale4d.glsl"
#include "../lygia/generative/pnoise.glsl"


float steps(float speed, float num) {
    float s = u_time * speed * 0.2;
    return ceil(mod(s * 2.0, 1.0) * num) / num;
}

void main(void) {
    mat4 translationMatrix = translate4d(vec3(0.0));
    mat4 rotationMatrix = rotate4d(vec3(0.0, 1.0, 0.0), u_time) * rotate4d(vec3(1.0, 0.0, 0.0), 1.4);
    mat4 scaleMatrix = scale4d(vec3(1.4));

    vec3 p = a_position.xyz;
    vec3 period = vec3(2.0, 1.0, 0.4);

    vec4 displace = vec4(1.0);

    displace.x = pnoise(p + vec3(u_time, 0.0, 0.0), period);
    displace.y = pnoise(p + vec3(0.0, u_time, 0.0), period);
    displace.z = pnoise(p + vec3(0.0, 0.0, u_time), period);

    vec4 displaced_position = a_position + displace * 0.4;

    vec4 local_position = translationMatrix * rotationMatrix * scaleMatrix * displaced_position;

    gl_Position = u_projectionMatrix * u_viewMatrix * u_modelMatrix * local_position;

    gl_PointSize = 2.0;
    
    v_pos = local_position;

    v_color = vec4(1.0);
}