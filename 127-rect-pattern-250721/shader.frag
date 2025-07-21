#ifdef GL_ES
precision mediump float;
#endif


uniform sampler2D   u_doubleBuffer0;
uniform vec2        u_resolution;       // In Pixels
uniform float       u_time;
uniform vec2        u_mouse;            // In Pixels


float repeat_lines(vec2 uv, vec2 grid, float s) {
    // Quantize input shape to match grid
    float q = floor(s * grid.x) / grid.x;
    // Create uv grid
    vec2 uv1 = fract(uv * grid);
    // Draw lines from the center of each grid based on quantized input value
    return step(abs(uv1.y - 0.5), q * 0.5);
}

float reference(vec2 uv) {
    float s = 4.0 * uv.x;
    float d = abs(sin(uv.x * s * u_time + sin(uv.y * s + u_time)));
    return d;
}

float quantized_lines(vec2 uv, vec2 grid) {
    // Create quantized grid uv
    vec2 cell_id = floor(uv * grid);
    vec2 cell_center_uv = (cell_id + 0.5) / grid;

    // Get reference shape function
    float q = reference(cell_center_uv);

    // Create uv grid
    vec2 uv1 = fract(uv * grid);

    // Draw lines from the center of each grid based on quantized input value
    return step(abs(uv1.y - 0.5), q * 0.5);
}

float quantized_lines1(vec2 uv, vec2 grid) {
    // Create quantized grid uv
    vec2 cell_id = floor(uv * grid);
    vec2 cell_center_uv = (cell_id + 0.5) / grid;

    // Get reference shape function
    float q = reference(cell_center_uv);

    // Create uv grid
    vec2 uv1 = fract(uv * grid);

    // Draw lines from the center of each grid based on quantized input value
    float d = mix(uv.y, q, sin(u_time * 0.4));
    float lines = smoothstep(abs(uv1.y - 0.5),d , q * 0.5);
    return step(cell_center_uv.y + q, lines);
}


void main(void) {
    vec3 color = vec3(0.0);
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    vec2 uv = (2.0 * gl_FragCoord.xy - u_resolution.xy) / u_resolution.y;

#ifdef DOUBLE_BUFFER_0
    // Base Image
    float d = quantized_lines1(uv, vec2(10.0, 8.0));
    color = vec3(d);

#else
    // Postprocessing
    vec3 baseTex = texture2D(u_doubleBuffer0, st).rgb;
    
    color = baseTex;

#endif

    gl_FragColor = vec4(color, 1.0);
}