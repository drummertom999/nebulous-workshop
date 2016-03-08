precision highp float;

// Input
varying vec4 v_world_pos;

// Settings
vec4 col_one = vec4(0.8, 0.8, 0.8, 1.0);
vec4 col_two = vec4(0.9, 0.9, 0.9, 1.0);

void main(void)
{
	// Calc tile colour @ this fragment
	vec2 row_col = floor(v_world_pos.xz);
	float idx = mod(row_col.x + row_col.y, 2.0);
	gl_FragColor = mix(col_one, col_two, idx);
}