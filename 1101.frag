// Author:CMH
// Title:BreathingGlow+noise

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

float pi = 3.1415926;

float glow(float d, float str, float thickness)
{
    return thickness / pow(d, str);
}

vec2 hash2(vec2 x) //亂數範圍 [-1,1]
{
    const vec2 k = vec2(0.3183099, 0.3678794);
    x = x * k + k.yx;
    return -1.0 + 2.0 * fract(16.0 * k * fract(x.x * x.y * (x.x + x.y)));
}
float gnoise(in vec2 p) //亂數範圍 [-1,1]
{
    vec2 i = floor(p);
    vec2 f = fract(p);
    
    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)), 
                   dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
               mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), 
                   dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(in vec2 uv) //亂數範圍 [-1,1]
{
    float f; //fbm - fractal noise (4 octaves)
    mat2 m = mat2(1.6,  1.2, -1.2,  1.6);
    f = 0.5000 * gnoise(uv); uv = m * uv;          
    f += 0.2500 * gnoise(uv); uv = m * uv;
    f += 0.1250 * gnoise(uv); uv = m * uv;
    f += 0.0625 * gnoise(uv); uv = m * uv;
    
    return f;
}

//Gradient Noise 3D
vec3 hash(vec3 p) // replace this by something better
{
    p = vec3( dot(p, vec3(127.1, 311.7, 74.7)),
              dot(p, vec3(269.5, 183.3, 246.1)),
              dot(p, vec3(113.5, 271.9, 124.6)));

    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise(in vec3 p)
{
    vec3 i = floor(p);
    vec3 f = fract(p);
    
    vec3 u = f * f * (3.0 - 2.0 * f);

    return mix(mix(mix(dot(hash(i + vec3(0.0, 0.0, 0.0)), f - vec3(0.0, 0.0, 0.0)), 
                       dot(hash(i + vec3(1.0, 0.0, 0.0)), f - vec3(1.0, 0.0, 0.0)), u.x),
                   mix(dot(hash(i + vec3(0.0, 1.0, 0.0)), f - vec3(0.0, 1.0, 0.0)), 
                       dot(hash(i + vec3(1.0, 1.0, 0.0)), f - vec3(1.0, 1.0, 0.0)), u.x), u.y),
               mix(mix(dot(hash(i + vec3(0.0, 0.0, 1.0)), f - vec3(0.0, 0.0, 1.0)), 
                       dot(hash(i + vec3(1.0, 0.0, 1.0)), f - vec3(1.0, 0.0, 1.0)), u.x),
                   mix(dot(hash(i + vec3(0.0, 1.0, 1.0)), f - vec3(0.0, 1.0, 1.0)), 
                       dot(hash(i + vec3(1.0, 1.0, 1.0)), f - vec3(1.0, 1.0, 1.0)), u.x), u.y), u.z);
}


float circle(vec2 uv, float radius)
{
    float dist = length(uv);
    float circle_dist = abs(dist - radius); //光環大小
    
    return circle_dist;
}

// Inigo Quilez: Bobbly Cross
float sdBlobbyCross(in vec2 pos, float he)
{
    pos = abs(pos);
    pos = vec2(abs(pos.x - pos.y), 1.0 - pos.x - pos.y) / sqrt(2.0);

    float p = (he - pos.y - 0.25 / he) / (6.0 * he);
    float q = pos.x / (he * he * 16.0);
    float h = q * q - p * p * p;
    
    float x;
    if (h > 0.0)
    {
        float r = sqrt(h);
        x = pow(q +r, 1.0 / 3.0) - pow(abs(q - r), 1.0 / 3.0) * sign(r - q);
    }
    else
    {
        float r = sqrt(p);
        x = 2.0 * r * cos(acos(q / (p * r)) / 3.0);
    }
    x = min(x, sqrt(2.0) / 2.0);
    
    vec2 z = vec2(x, he * (1.0 - 2.0 * x * x)) - pos;
    
    return length(z) * sign(z.y);
}

// rotate
mat2 rotate(float angle)
{
    return mat2(cos(angle), -sin(angle),
                sin(angle), -cos(angle));
}

// mouse effect
float mouseEffect(vec2 uv, vec2 mouse, float size)
{
    float dist = length(uv - mouse);
    return 1.2 - smoothstep(size * 2.0, size, dist);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv.x *= u_resolution.x / u_resolution.y;
    uv = uv * 2.0 - 1.0;
    
    vec2 mouse = u_mouse / u_resolution.xy;
    mouse.x *= u_resolution.x / u_resolution.y;
    mouse = mouse * 2.0 - 1.0;
    
    //陰晴圓缺
    // float pi = 3.14159;
    float theta = 2.0 * pi * u_time / 8.0;
    vec2 point = vec2(sin(theta), cos(theta));
    float dir = dot(point, (uv)) + 0.55;
    
    //亂數作用雲霧
    float fog = fbm(0.4 * uv + vec2(-0.1 * u_time, -0.02 * u_time)) * 0.6 + 0.1;
    
    // 滑鼠互動
    float interact = 1.0 - mouseEffect(uv, mouse, 0.3);

    //定義圓環
    float result;
    for(float index = 0.0; index < 18.0; index++)
    {
        //float index=0.0;
        // float noise_position = smoothstep(-0.2, 0., -uv.x * 0.0 + -uv.y + -0.05);
        float noise_position = interact + dir;
        float radius_noise = noise(vec3(2.180 * uv, index + u_time * 0.404)) * -0.232 * noise_position;
        float radius;
        radius = 0.4 + radius_noise;

        // float circle_dist = circle(uv, radius); //光環大小
        float circle_dist = abs(sdBlobbyCross(uv, radius));

        //動態呼吸
        //float breathing = sin(2.0 * u_time / 5.0 * pi) * 0.5 + 0.2; //option1
        //float breathing = (exp(sin(u_time / 2.0 * pi)) - 0.36787944) * 0.42545906412; //option2 錯誤
        float breathing = (exp(sin(u_time / 2.0 * pi)) - 0.36787944) * 0.42545906412; //option2 正確
        float strength = (0.08 * breathing + 0.3); //[0.2~0.3] //光暈強度加上動態時間營造呼吸感
        float thickness = (0.0 * breathing + 0.01); //[0.1~0.2] //光環厚度 營造呼吸感
        float glow_circle = glow(circle_dist, strength, thickness);
        result += glow_circle;
    }
    
    gl_FragColor = vec4(vec3(result + fog), 1.0);
    //gl_FragColor = vec4(vec3(circle_dist), 1.0); 
}
