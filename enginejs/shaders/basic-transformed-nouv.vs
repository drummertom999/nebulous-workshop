precision highp float;

// Input
attribute vec3 a_pos;

// Transform
uniform mat4 u_trans_model;
uniform mat4 u_trans_view;
uniform mat4 u_trans_proj;

// Output
varying vec4 v_world_pos;

void main(void)
{
	v_world_pos = u_trans_model * vec4(a_pos, 1.0);
	gl_Position =  u_trans_proj * u_trans_view * v_world_pos;

#ifdef FLIP_Y
	v_uv.y = 1.0 - v_uv.y;
#endif
}