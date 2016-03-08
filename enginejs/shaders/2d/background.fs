precision highp float;
#define MAX_LAYERS 7
#define TRANSPARENT vec4(0.0)

// Input
varying vec2 v_uv;

// Background data
uniform vec4 u_background_color;
uniform float u_time;

// Layer data
uniform sampler2D u_layer_tx[MAX_LAYERS];  // Layer samplers
uniform vec4 u_layer_config_1[MAX_LAYERS]; // Layer config 1 (xy = scale, zw = offset)
uniform vec4 u_layer_config_2[MAX_LAYERS]; // Layer config 2 (xy = texture dimensions, zw = animated uv scroll)
uniform vec4 u_layer_config_3[MAX_LAYERS]; // Layer config 3 (xy = repeat, z = depth, w = reserved)

vec4 sample_layer(const vec2 uv, const sampler2D tx, const vec4 layer_config_1, const vec4 layer_config_2, const vec4 layer_config_3)
{
	// Apply scale + offset
	vec2 result = (uv * layer_config_1.xy) + layer_config_1.zw;

	// Flip-y
	result = vec2(result.x, 1.0 - layer_config_1.y + result.y);

	// Apply animated uv scroll (keep separate to result as we allow this to wrap)
	vec2 scrolled_result = result + (layer_config_2.zw * u_time);

	// Emulate CLAMP_TO_BORDER (not available in WebGL) where border is fully transparent
	vec2 half_texel_size = vec2(1.0 / layer_config_2.xy) / 2.0;
	vec2 mixer = floor(abs(result * 2.0 - 1.0 - half_texel_size)) * layer_config_3.xy;
	return mix(texture2D(tx, scrolled_result), TRANSPARENT, min(mixer.x + mixer.y, 1.0));
}

void main(void)
{
	vec2 uv = v_uv.xy;

	// Sample texel colours per-layer
	vec4 layer_0_col = sample_layer(uv, u_layer_tx[0], u_layer_config_1[0], u_layer_config_2[0], u_layer_config_3[0]);
	vec4 layer_1_col = sample_layer(uv, u_layer_tx[1], u_layer_config_1[1], u_layer_config_2[1], u_layer_config_3[1]);
	vec4 layer_2_col = sample_layer(uv, u_layer_tx[2], u_layer_config_1[2], u_layer_config_2[2], u_layer_config_3[2]);
	vec4 layer_3_col = sample_layer(uv, u_layer_tx[3], u_layer_config_1[3], u_layer_config_2[3], u_layer_config_3[3]);
	vec4 layer_4_col = sample_layer(uv, u_layer_tx[4], u_layer_config_1[4], u_layer_config_2[4], u_layer_config_3[4]);
	vec4 layer_5_col = sample_layer(uv, u_layer_tx[5], u_layer_config_1[5], u_layer_config_2[5], u_layer_config_3[5]);
	vec4 layer_6_col = sample_layer(uv, u_layer_tx[6], u_layer_config_1[6], u_layer_config_2[6], u_layer_config_3[6]);

	// Blend layers (from back to front)
	gl_FragColor = u_background_color;
	gl_FragColor = vec4(layer_6_col.a) * layer_6_col + vec4(1.0 - layer_6_col.a) * gl_FragColor;
	gl_FragColor = vec4(layer_5_col.a) * layer_5_col + vec4(1.0 - layer_5_col.a) * gl_FragColor;
	gl_FragColor = vec4(layer_4_col.a) * layer_4_col + vec4(1.0 - layer_4_col.a) * gl_FragColor;
	gl_FragColor = vec4(layer_3_col.a) * layer_3_col + vec4(1.0 - layer_3_col.a) * gl_FragColor;
	gl_FragColor = vec4(layer_2_col.a) * layer_2_col + vec4(1.0 - layer_2_col.a) * gl_FragColor;
	gl_FragColor = vec4(layer_1_col.a) * layer_1_col + vec4(1.0 - layer_1_col.a) * gl_FragColor;
	gl_FragColor = vec4(layer_0_col.a) * layer_0_col + vec4(1.0 - layer_0_col.a) * gl_FragColor;
}