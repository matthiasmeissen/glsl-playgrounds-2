#version 330 core
precision mediump float;

in vec2 v_uv;
uniform vec2 u_resolution;
uniform float u_time;
uniform float uParam1;
uniform float uParam2;
uniform float uParam3;
uniform float uParam4;

out vec4 out_color;

#define rot(a) mat2(cos(a), -sin(a), sin(a), cos(a))
#define PI 3.1415926535

// iq 2d sdf
float sdCircle( vec2 p, float r ){ return length(p) - r; }
float sdBox( in vec2 p, in vec2 b ){ vec2 d = abs(p)-b; return length(max(d,0.0)) + min(max(d.x,d.y),0.0); }
float sdRoundedBox( in vec2 p, in vec2 b, in vec4 r ){ r.xy = (p.x>0.0)?r.xy : r.zw; r.x  = (p.y>0.0)?r.x  : r.y; vec2 q = abs(p)-b+r.x; return min(max(q.x,q.y),0.0) + length(max(q,0.0)) - r.x; }

// quadratic polynomial iq
float smin( float a, float b, float k )
{
    k *= 4.0;
    float x = (b-a)/k;
    float g = (x> 1.0) ? x :
              (x<-1.0) ? 0.0 :
              (x*(2.0+x)+1.0)/4.0;
    return b - k * g;
}


float column(vec2 p) {
    float blend = mix(0.03, 0.1, uParam4);

    float b1 = sdBox(p, vec2(0.1, 0.25));
    b1 = sdRoundedBox(p, vec2(0.1, 0.25), vec4(0.04));
    float b2 = sdBox(p - vec2(0.2, 0.45), vec2(0.1, 0.2));
    float d = smin(b1, b2, blend);
    float b3 = sdBox(p - vec2(0.2, -0.45), vec2(0.1, 0.2));
    d = smin(d, b3, blend);
    float b4 = sdBox(p - vec2(0.4, 0.0), vec2(0.3, 0.1));
    d = smin(d, b4, 0.01);
    float c1 = sdCircle(p - vec2(0.4, -0.75), 0.1);
    d = smin(d, c1, blend);
    float c2 = sdCircle(p - vec2(0.4, +0.75), 0.1);
    d = smin(d, c2, blend);

    return d;
}

void main() {
    vec2 uv = v_uv;
    vec2 p = uv - 0.5;
    p.x *= u_resolution.x / u_resolution.y;


    float zoom = 8.0;

    p *= zoom;

    float d = 1.0;

    for (float i = 0.0; i < 6.0; i ++) {
        p *= rot(p.y * mix(-0.2, 0.2, uParam2));
        p.x = mix(p.x, p.y * p.x, uParam3);
        float col = column(p + vec2(i * 0.4 + 0.4, 0.0));
        float colInverse = column(-p + vec2(i * 0.4 + 0.4, 0.0));
        d = min(d, min(col, colInverse));
    }

    float d1 = step(d, 0.0);
    float d2 = step(d, 0.01) - step(d, 0.0);

    d = mix(d1, d2, uParam1);

    vec3 col = vec3(d);

    out_color = vec4(col, 1.0);
}