#ifdef GL_ES
precision mediump float;
#endif

uniform mat4 u_projectionMatrix; // Converts view space to clip space (perspective)
uniform mat4 u_viewMatrix;       // Positions the camera (world space to view space)
uniform mat4 u_modelMatrix;      // Base model transformation (model space to world space)
uniform float u_time;

attribute vec4 a_position;       // Vertex position in model space

mat4 translate(vec3 t) {
    return mat4(
        1.0, 0.0, 0.0, 0.0,  // Column 1
        0.0, 1.0, 0.0, 0.0,  // Column 2
        0.0, 0.0, 1.0, 0.0,  // Column 3
        t.x, t.y, t.z, 1.0   // Column 4 (Translation components)
    );
}

mat4 rotateX(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat4(1.0, 0.0, 0.0, 0.0, 0.0, c, s, 0.0, 0.0, -s, c, 0.0, 0.0, 0.0, 0.0, 1.0);
}

mat4 rotateY(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat4(c, 0.0, -s, 0.0, 0.0, 1.0, 0.0, 0.0, s, 0.0, c, 0.0, 0.0, 0.0, 0.0, 1.0);
}

mat4 rotateZ(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat4(c, s, 0.0, 0.0, -s, c, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0);
}

mat4 rotate(vec3 angles) {
    mat4 rX = rotateX(angles.x);
    mat4 rY = rotateY(angles.y);
    mat4 rZ = rotateZ(angles.z);
    // Order matters! This applies Z, then X, then Y rotation.
    return rY * rX * rZ;
}

void main(void) {
    mat4 translationMatrix = translate( vec3(0.0, 0.0, 0.0) );
    mat4 rotationMatrix = rotate(vec3(u_time * 1.2, 0.2, u_time * 0.6));

    // Apply transformations in the correct order:
    // a_position -> rotate -> translate -> model -> view -> projection
    // (Matrix multiplication is read right-to-left)
    gl_Position = u_projectionMatrix * u_viewMatrix * u_modelMatrix * translationMatrix * rotationMatrix * a_position;
}