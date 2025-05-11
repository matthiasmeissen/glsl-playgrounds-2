#ifdef GL_ES
precision mediump float;
#endif

uniform mat4 u_projectionMatrix; // Converts view space to clip space (perspective)
uniform mat4 u_viewMatrix;       // Positions the camera (world space to view space)
uniform mat4 u_modelMatrix;      // Base model transformation (model space to world space)
uniform float u_time;

attribute vec4 a_position;       // Vertex position in model space

varying vec4 v_color;            // Send point color to fragment shader

#include "../lygia/math/rotate4d.glsl"
#include "../lygia/math/translate4d.glsl"
#include "../lygia/math/scale4d.glsl"


float steps(float speed, float num) {
    float s = u_time * speed * 0.2;
    return ceil(mod(s * 2.0, 1.0) * num) / num;
}

void main(void) {
    mat4 translationMatrix = translate4d(vec3(0.0));
    mat4 rotationMatrix = rotate4d(vec3(1.0, 0.4, 0.0), u_time);
    mat4 scaleMatrix = scale4d(vec3(1.8));

    // Apply transformations in the correct order:
    // a_position -> rotate -> translate -> model -> view -> projection
    // (Matrix multiplication is read right-to-left)
    gl_Position = u_projectionMatrix * u_viewMatrix * u_modelMatrix * translationMatrix * rotationMatrix * scaleMatrix * a_position;

    gl_PointSize = fract((u_viewMatrix * a_position + u_time).x) * 4.0;

    v_color = vec4(1.0);
}