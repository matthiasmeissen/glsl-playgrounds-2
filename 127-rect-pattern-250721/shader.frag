#ifdef GL_ES
precision mediump float;
#endif


uniform sampler2D   u_doubleBuffer0;
uniform vec2        u_resolution;       // In Pixels
uniform float       u_time;
uniform vec2        u_mouse;            // In Pixels


float circlePattern(vec2 uv, float num) {
    vec2 s = fract(uv * num);
    float d = distance(s, vec2(0.5));
    return 1.0 - smoothstep(0.2, 0.21, d);
}

float sdRoundedBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

vec2 computeRefractOffset(float normalizedSDF) {
    if (normalizedSDF < 0.1) return vec2(0.0);
    vec2 grad = normalize(vec2(dFdx(normalizedSDF), dFdy(normalizedSDF)));
    float offsetAmount = pow(normalizedSDF, 12.0) * -0.1;
    return grad * offsetAmount;
}


void main(void) {
    vec3 color = vec3(0.0);
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    vec2 uv = (2.0 * gl_FragCoord.xy - u_resolution.xy) / u_resolution.y;

#ifdef DOUBLE_BUFFER_0
    // Base Image
    float d = circlePattern(uv, 8.0);
    d = step(fract(uv.x * 8.0 + uv.y * 12.0 + u_time), 0.2);
    color = vec3(d);

#else
    // Postprocessing
    vec2 mouse = (2.0 * u_mouse - u_resolution.xy) / u_resolution.y;
    mouse = (u_mouse.x <= 0.0) ? vec2(0.0) : mouse; 
    
    // Define Shape
    vec2 boxSize = vec2(0.6 + sin(u_time) * 0.2, 0.3 + sin(u_time * 0.4) * 0.1);
    float cornerRadius = 0.2;
    float sdf = sdRoundedBox(uv - mouse, boxSize, cornerRadius);
    float normalizedInside = sdf / cornerRadius + 1.0;

    // Effect

    // Refraction
    vec3 baseTex = texture2D(u_doubleBuffer0, st).rgb;
    vec2 distortedUV = st + computeRefractOffset(normalizedInside);

    // Chromatic Aberration
    float chromaStrength = pow(normalizedInside, 4.0) * 0.005;
    vec2 chromaDirection = normalize(distortedUV - uv);

    float r = texture2D(u_doubleBuffer0, distortedUV + chromaDirection * chromaStrength).r;
    float g = texture2D(u_doubleBuffer0, distortedUV).g; // Green channel is our "center"
    float b = texture2D(u_doubleBuffer0, distortedUV - chromaDirection * chromaStrength).b;

    // Recombine the shifted channels. This is our final glass texture.
    vec3 glassTex = vec3(r, g, b);
    
    // Optional Brightness Adjustment for Shape
    // glassTex = glassTex * 0.8 + 0.2;
    
    // Combine Shape and Base Image
    float mask = 1.0 - smoothstep(0.0, 2.0 / u_resolution.y, sdf);
    color = mix(baseTex, glassTex, mask);

#endif

    gl_FragColor = vec4(color, 1.0);
}