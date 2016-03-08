precision highp float;

// Input
attribute vec3 a_pos;
attribute vec2 a_uv;

// Output
varying vec2 v_uv;

void main(void)
{
	gl_Position = vec4(a_pos, 1.0);
	v_uv = a_uv;

#ifdef FLIP_Y
	v_uv.y = 1.0 - v_uv.y;
#endif
}