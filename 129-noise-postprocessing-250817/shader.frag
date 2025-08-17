#ifdef GL_ES
precision mediump float;
#endif


uniform sampler2D   u_doubleBuffer0;
uniform vec2        u_resolution;       // In Pixels
uniform float       u_time;
uniform vec2        u_mouse;            // In Pixels


float m(float x){return x-floor(x/289.)*289.;}
vec4 m(vec4 x){return x-floor(x/289.)*289.;}
vec4 p(vec4 x){return m(((x*34.)+1.)*x);}
float noise(vec3 P){
    vec3 a=floor(P),d=P-a;
    d=d*d*(3.-2.*d);
    vec4 b=a.xxyy+vec4(0,1,0,1),k1=p(b.xyxy),k2=p(k1.xyxy+b.zzww);
    vec4 c=k2+a.zzzz,k3=p(c),k4=p(c+1.);
    vec4 o1=fract(k3/41.),o2=fract(k4/41.);
    vec4 o3=o2*d.z+o1*(1.-d.z);
    vec2 o4=o3.yw*d.x+o3.xz*(1.-d.x);
    return o4.y*d.y+o4.x*(1.-d.y);
}

vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ){
    return a + b*cos( 6.28318*(c*t+d) );
}

vec2 repeat_uv_square(vec2 uv, float num) {
    return fract(uv * num);
}

float circle(vec2 uv, float s, float a) {
    float d = distance(vec2(0.5), uv);
    return mix(step(d, s * 0.5), step(d, s * 0.5) - step(d, s * 0.5 - 0.02), a);
}


void main(void) {
    vec3 color = vec3(0.0);
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    vec2 uv = (2.0 * gl_FragCoord.xy - u_resolution.xy) / u_resolution.y;

#ifdef DOUBLE_BUFFER_0
    // Base Image
    vec2 uv1 = repeat_uv_square(uv, 4.0);
    vec2 s = vec2(12.0, 8.0);
    float n = noise(vec3(st.x * s.x, st.y * s.y + u_time, u_time * 0.5));
    float d = circle(uv1, n * 1.2, sin(uv1.x * uv.y + u_time * 0.4));
    vec3 col = pal( d, vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(1.0,1.0,1.0),vec3(0.0,0.10,0.20) );
    color = col * vec3(d);

#else
    // Postprocessing
    vec3 baseTex = texture2D(u_doubleBuffer0, st).rgb;
    
    color = baseTex;

#endif

    gl_FragColor = vec4(color, 1.0);
}