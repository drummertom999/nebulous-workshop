// *******************************************
//# sourceURL=modules/enginejs-debug.js
// *******************************************

Engine.Debug =
{
	draw_commands : [],

	// Resources
	shader_program : null,
	circle_model  : null,

	// Dynamic polygon soup for debug geometry (arbitrary lines & polygons)
	soup_vbo        : null,
	soup_idx        : 0, // Current write offset into soup
	soup_descriptor :
	{
		attribute_name : "a_pos",
		item_size      : 3,
		draw_mode      : "lines",
		stream         : new Float32Array(3000000),
		stream_index  : 0
	},

	// Deferred queues for rect/cirlces
	prim_queue : [],

	PreGameLoopInit : function()
	{
		Engine.Debug.shader_program = Engine.Gfx.CreateShaderProgram(Engine.Resources["vs_basic_transformed_nouv"],
		                                        Engine.Resources["fs_basic_colour"]);
		Engine.Debug.circle_model = Engine.Geometry.MakeCircle({ segment_count : 50 });

		// Setup vertex buffer object
		Engine.Debug.soup_vbo = Engine.Gfx.CreateVertexBuffer(Engine.Debug.soup_descriptor);
	},

	DeferDrawLine : function(vertices, colour)
	{
		// Register command
		Engine.Debug.draw_commands.push(
		{
			offset    : Engine.Debug.soup_idx / Engine.Debug.soup_descriptor.item_size,
			count     : vertices.length,
			draw_mode : "lines",
			colour    : colour
		});

		// Add verts to buffer
		for(var i = 0; i < vertices.length; ++i)
		{
			Engine.Debug.soup_descriptor.stream[Engine.Debug.soup_idx++] = vertices[i][0];
			Engine.Debug.soup_descriptor.stream[Engine.Debug.soup_idx++] = vertices[i][1];
			Engine.Debug.soup_descriptor.stream[Engine.Debug.soup_idx++] = 0;
		}
	},

	DeferDrawPoly : function(vertices, colour)
	{
		// Register command
		Engine.Debug.draw_commands.push(
		{
			buffer    : Engine.Debug.soup_descriptor,
			offset    : Engine.Debug.soup_idx / Engine.Debug.soup_descriptor.item_size,
			count     : vertices.length,
			draw_mode : "triangle_fan",
			colour    : colour
		});

		// Add verts to buffer
		for(var i = 0; i < vertices.length; ++i)
		{
			Engine.Debug.soup_descriptor.stream[Engine.Debug.soup_idx++] = vertices[i][0];
			Engine.Debug.soup_descriptor.stream[Engine.Debug.soup_idx++] = vertices[i][1];
			Engine.Debug.soup_descriptor.stream[Engine.Debug.soup_idx++] = 0;
		}
	},

	DrawLine : function(start, end, colour, thickness, camera)
	{
		// Draw main line
		Engine.Debug.DeferDrawLine([start, end], colour);

		// Thicken line?
		if(thickness > 1)
		{
			// Add extra lines to perform thickening
			var normal = Engine.Vec2.Normal(Engine.Vec2.Subtract(end, start));
			var lines_per_side = Math.ceil((thickness - 1) / 2);
			var lines_total = 1 + (lines_per_side * 2);
			for(var i = 0; i < lines_per_side; ++i)
			{
				var shift = (thickness / lines_total) * (i + 1);
				var extra_lines = [ Engine.Vec2.Add(start, [ normal[0] * shift,  normal[1] * shift]),   // Line A (start)
				                    Engine.Vec2.Add(end,   [ normal[0] * shift,  normal[1] * shift]),   // Line A (end)
				                    Engine.Vec2.Add(start, [-normal[0] * shift, -normal[1] * shift]),   // Line B (start)
				                    Engine.Vec2.Add(end,   [-normal[0] * shift, -normal[1] * shift]) ]; // Line B (end)
				Engine.Debug.DeferDrawLine(extra_lines, colour);
			}
		}
	},

	DrawPolygon : function(vertices, colour, camera)
	{
		Engine.Debug.DeferDrawPoly(vertices, colour);
	},

	DrawRect : function(position, width, height, colour, camera)
	{
		// Setup transform (canvas space)
		var mtx_trans = mat4.create();
		var x = position[0] + (width  / 2); // DrawRect is centered by default
		var y = position[1] + (height / 2); // DrawRect is centered by default
		mat4.translate(mtx_trans, Engine.Math.IdentityMatrix, [x, y, 0]);
		mat4.scale(mtx_trans, mtx_trans, [width / 2, height / 2, 0.0]);

		// Deferred draw
		Engine.Debug.prim_queue.push({ type : "rect", mtx : mtx_trans, colour : colour});
	},

	DrawCircle : function(position, radius, colour, camera)
	{
		// Setup transform (canvas space)
		var mtx_trans = mat4.create();
		mat4.translate(mtx_trans, Engine.Math.IdentityMatrix, [position[0], position[1], 0]);
		mat4.scale(mtx_trans, mtx_trans, [radius, radius, 0.0]);

		// Deferred draw
		Engine.Debug.prim_queue.push({ type : "circle", mtx : mtx_trans, colour : colour});
	},

	Update : function()
	{
		// Note: This is called prior to any user rendering, so can be
		//       used to clear out draw commands from previous frame
		Engine.Debug.draw_commands = [];
		Engine.Debug.prim_queue = [];
		Engine.Debug.soup_idx = 0;
	},

	Render : function()
	{
		// Early out?
		if(Engine.Debug.draw_commands.length == 0 && Engine.Debug.prim_queue.length == 0)
			return;

		// Note: This is called post user-rendering so we can disable
		//       z-test and render draw commands in the order they were issued
		Engine.Gfx.EnableDepthTest(false);
		Engine.Gfx.EnableBlend(true);

		// Update vertex streams
		Engine.Gfx.UpdateDynamicVertexBuffer(Engine.Debug.soup_vbo, Engine.Debug.soup_descriptor);

		// Bind shader
		Engine.Gfx.BindShaderProgram(Engine.Debug.shader_program);

		// Setup transform (canvas space)
		var mtx_proj = mat4.create(); mat4.identity(mtx_proj);
		var canvas_size = Engine.Canvas.GetSize();
		mat4.ortho(mtx_proj, 0, canvas_size[0], 0, canvas_size[1], -1, 1);
		Engine.Gfx.SetShaderConstant("u_trans_model", Engine.Math.IdentityMatrix, Engine.Gfx.SC_MATRIX4);
		Engine.Gfx.SetShaderConstant("u_trans_view",  Engine.Math.IdentityMatrix, Engine.Gfx.SC_MATRIX4);
		Engine.Gfx.SetShaderConstant("u_trans_proj",  mtx_proj, Engine.Gfx.SC_MATRIX4);

		// Draw lines and polys (using offsets into vertex soup)
		for(var i = 0; i < Engine.Debug.draw_commands.length; ++i)
		{
			var command = Engine.Debug.draw_commands[i];
			Engine.Gfx.SetShaderConstant("u_colour", command.colour, Engine.Gfx.SC_COLOUR);
			Engine.Gfx.BindVertexBuffer(Engine.Debug.soup_vbo);
			Engine.Gfx.DrawArray(command.offset, command.count, command.draw_mode);
		}

		// Draw deferred prims (rect & circles)
		for(var i = 0; i < Engine.Debug.prim_queue.length; ++i)
		{
			var prim = Engine.Debug.prim_queue[i];
			Engine.Gfx.SetShaderConstant("u_colour", prim.colour, Engine.Gfx.SC_COLOUR);
			Engine.Gfx.SetShaderConstant("u_trans_model", prim.mtx, Engine.Gfx.SC_MATRIX4);
			switch(prim.type)
			{
				case "rect":
					Engine.Gfx.DrawQuad(); break;
				case "circle":
					Engine.Gfx.DrawModel(Engine.Debug.circle_model); break;
			}
		}
	},

	Break : function()
	{
		debugger;
	}
}