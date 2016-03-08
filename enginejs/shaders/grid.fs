precision highp float;

// Input
varying vec4 v_world_pos;

// Settings
#define CELL_SIZE 16.0
vec4 col_one = vec4(0.8, 0.8, 0.8, 1.0);
vec4 col_two = vec4(0.9, 0.9, 0.9, 1.0);

void main(void)
{
	vec2 temp = floor(v_world_pos.xy / CELL_SIZE);
	float idx = mod(temp.x + temp.y, 2.0);
	gl_FragColor = mix(col_one, col_two, idx);
}