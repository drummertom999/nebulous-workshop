precision highp float;

// Input
varying vec2 v_uv;

void main(void)
{
	vec2 uv = v_uv.xy;

	#ifdef FLIP_Y
		uv.y = 1.0 - uv.y;
	#endif

	gl_FragColor = vec4(v_uv.x, v_uv.y, 0.0, 1.0);
}