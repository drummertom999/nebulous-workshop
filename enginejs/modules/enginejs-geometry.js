// *******************************************
//# sourceURL=modules/enginejs-geometry.js
// *******************************************

Engine.Geometry =
{
	MakeCircle : function(params)
	{
		// Setup empty model with 1 prim
		var prim = { vertex_buffers : [] }
		var model = { name : "Circle", is_loaded : true, model_data : { primitives : [prim] } };

		// Generate verts
		if(!params.hasOwnProperty("segment_count"))
			return false;

		var vertex_buffer = { name : "vertices", attribute_name : "a_pos", item_size : 3, draw_mode : "triangle_fan", stream : [0.0, 0.0, 0.0] };
		var theta = (2 * Math.PI) / params.segment_count;
		for(var i = 0; i <= params.segment_count; ++i)
		{
			vertex_buffer.stream.push(Math.cos(theta * i), Math.sin(theta * i), 0.0);
		}

		// Create vertex buffer
		vertex_buffer.vbo = Engine.Gfx.CreateVertexBuffer(vertex_buffer);
		prim.vertex_buffers.push(vertex_buffer);

		// Generate UVs?
		if(params.hasOwnProperty("generate_uvs") && !params.generate_uvs)
			return model;

		var uv_buffer = { name : "texture-coordinates", attribute_name : "a_uv", item_size : 2, draw_mode : "triangle_fan", stream : [0.5, -0.5] };
		var normalise = function (x) { return ((x + 1) / 2); }
		for(var i = 0; i <= params.segment_count; ++i)
		{
			uv_buffer.stream.push(normalise(Math.cos(theta * i)), -normalise(Math.sin(theta * i)));
		}

		// Create uv buffer
		uv_buffer.vbo = Engine.Gfx.CreateVertexBuffer(uv_buffer);
		prim.vertex_buffers.push(uv_buffer);

		return model;
	},
};