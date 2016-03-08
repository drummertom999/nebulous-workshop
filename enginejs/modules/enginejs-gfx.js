// *******************************************
//# sourceURL=modules/enginejs-gfx.js
// *******************************************

Engine.Gfx =
{
	// **********************************************
	// Vertex buffer functionality
	// **********************************************
	CreateVertexBuffer : function(vertex_buffer_descriptor)
	{
		// Determine buffer type (normal/index)?
		var is_index_buffer = (vertex_buffer_descriptor.name == "indices");
		var vertex_buffer_type = is_index_buffer? Engine.GL.ELEMENT_ARRAY_BUFFER :
		                                          Engine.GL.ARRAY_BUFFER;

		// Create and bind the new buffer
		var buffer = Engine.GL.createBuffer();
		Engine.GL.bindBuffer(vertex_buffer_type, buffer);

		// Bind data stream to buffer
		var vertex_data_stream = is_index_buffer? new Uint16Array(vertex_buffer_descriptor.stream) :
		                                          new Float32Array(vertex_buffer_descriptor.stream);
		Engine.GL.bufferData(vertex_buffer_type, vertex_data_stream, Engine.GL.STATIC_DRAW);

		// Use default draw mode?
		var vertex_draw_mode = Engine.Gfx.DrawModeFromString["triangles"];
		if(vertex_buffer_descriptor.hasOwnProperty("draw_mode"))
		{
			vertex_draw_mode = Engine.Gfx.DrawModeFromString[vertex_buffer_descriptor.draw_mode];
		}

		// Setup our own VBO type
		var vertex_buffer_object =
		{
			descriptor     : vertex_buffer_descriptor,
			buffer_type    : vertex_buffer_type,
			resource       : buffer,
			item_size      : vertex_buffer_descriptor.item_size,
			item_count     : vertex_buffer_descriptor.stream.length / vertex_buffer_descriptor.item_size,
			attribute_name : vertex_buffer_descriptor.attribute_name,
			draw_mode      : vertex_draw_mode
		};
		return vertex_buffer_object;
	},

	UpdateDynamicVertexBuffer : function(vertex_buffer_object, vertex_buffer_descriptor)
	{
		var buffer_type = vertex_buffer_object.buffer_type;
		var is_index_buffer = (buffer_type == Engine.GL.ELEMENT_ARRAY_BUFFER);

		// Re-bind the buffer
		Engine.GL.bindBuffer(buffer_type, vertex_buffer_object.resource);

		// Update the data stream
		Engine.GL.bufferData(buffer_type, new Float32Array(vertex_buffer_descriptor.stream), Engine.GL.DYNAMIC_DRAW);
	},

	BindVertexBuffer : function(vertex_buffer_object)
	{
		this.current_vertex_buffer_object = vertex_buffer_object;

		// Bind vertex buffer
		var is_index_buffer = (vertex_buffer_object.buffer_type == Engine.GL.ELEMENT_ARRAY_BUFFER);
		Engine.GL.bindBuffer(is_index_buffer? Engine.GL.ELEMENT_ARRAY_BUFFER :
		                                      Engine.GL.ARRAY_BUFFER,
		                     vertex_buffer_object.resource);

		// Bind to shader attribute (indices not passed to shaders)
		if(!is_index_buffer)
		{
			var program = this.current_shader_program;
			var attribute_name = vertex_buffer_object.attribute_name;

			// Asking WebGL for attribute locations is slow, can we
			// re-use a cached result?
			var attribute_location = null;
			if(attribute_name in program.attribute_location_cache)
			{
				attribute_location = program.attribute_location_cache[attribute_name];
			}
			else
			{
				attribute_location = Engine.GL.getAttribLocation(program.resource, attribute_name);
				program.attribute_location_cache[attribute_name] = attribute_location; // Cache for later
			}

			// Bind vertex buffer to program attribute location?
			// Note: If attribute_location == -1, the attribute was not present in the currently
			//       bound shader program (or was optimised out if unused etc). For example, this might
			//       occur if the vertex data being bound contains a uv stream (e.g. "a_uv") which is
			//       referenced and forwarded by the linked *vertex* shader, but is not referenced within
			//       the linked *fragment* shader (i.e "a_uv" got deadstripped when the program was linked).
			if(attribute_location != -1)
			{
				Engine.GL.enableVertexAttribArray(attribute_location);
				Engine.GL.vertexAttribPointer(attribute_location, vertex_buffer_object.item_size, Engine.GL.FLOAT, false, 0, 0);
			}
		}
	},

	// **********************************************
	// Shader functionality
	// **********************************************
	LoadShader : function(descriptor, callback)
	{
		// Setup pre-processor defines...
		var defines = (descriptor.define)? descriptor.define : [];

		Engine.Net.FetchResource(descriptor.file, function(shader_code)
		{
			var extension = descriptor.file.split('.').pop();
			var shader_object = (extension == "vs")? Engine.Gfx.CompileVertexShader(shader_code, defines) :
			                                           Engine.Gfx.CompileFragmentShader(shader_code, defines);

			if(shader_object)
			{
				Engine.Log("Successfully loaded shader: " + descriptor.file);
			}

			callback(shader_object);
		});
	},

	CompileVertexShader : function(code, defines)
	{
		return Engine.Gfx.CompileShader(code, Engine.GL.VERTEX_SHADER, defines);
	},

	CompileFragmentShader : function(code, defines)
	{
		return Engine.Gfx.CompileShader(code, Engine.GL.FRAGMENT_SHADER, defines);
	},

	CompileShader : function(shader_code, shader_type, defines)
	{
		var shader_resource = Engine.GL.createShader(shader_type);

		// Add pre-processor defines...
		$.each(defines, function(idx, definition)
		{
			shader_code = "#define " + definition + "\n" + shader_code;
		});

		// Compile code
		Engine.GL.shaderSource(shader_resource, shader_code);
		Engine.GL.compileShader(shader_resource);
		var success = Engine.GL.getShaderParameter(shader_resource, Engine.GL.COMPILE_STATUS);

		// Return shader object
		var shader_object =
		{
			resource  : success? shader_resource : null,
			type      : shader_type,
			code      : shader_code,
			defines   : defines
		};

		// Report errors?
		if(!success)
		{
			var error_msg = "Failed compiling shader: " + Engine.GL.getShaderInfoLog(shader_resource);
			Engine.LogError(error_msg);
		}

		return success? shader_object : null;
	},

	CreateShaderProgram : function(vertex_shader, fragment_shader)
	{
		// Generate a name for this resource based on MD5 of both shaders
		var uid = Engine.Util.MD5([vertex_shader, fragment_shader]);
		if(uid in Engine.Gfx.ShaderProgramCache) { return Engine.Gfx.ShaderProgramCache[uid]; }

		// Create new shader program
		var shader_program = Engine.GL.createProgram();
		Engine.GL.attachShader(shader_program, vertex_shader.resource);
		Engine.GL.attachShader(shader_program, fragment_shader.resource);
		Engine.GL.linkProgram(shader_program);
		var success = Engine.GL.getProgramParameter(shader_program, Engine.GL.LINK_STATUS);

		// Create shader program object
		var id_string = uid + " (" + vertex_shader.descriptor.file + " --> " + fragment_shader.descriptor.file + ")";
		var shader_program_object =
		{
			name      : uid,
			status    : success? "ok" : "fail",
			resource  : success? shader_program : null,
			v_shader  : vertex_shader,
			f_shader  : fragment_shader,
			error_msg : success? ""  : ("Failed linking shader program: " + id_string),
			uniform_location_cache   : { },
			attribute_location_cache : { }
		};

		if(success)
		{
			Engine.Log("Successfully linked shader program: " + id_string);
			Engine.Gfx.ShaderProgramCache[uid] = shader_program_object;
		}
		else
		{
			Engine.LogError(shader_program_object.error_msg);
			Engine.LogError(Engine.GL.getProgramInfoLog(shader_program));
		}

		return shader_program_object;
	},

	BindShaderProgram : function(program)
	{
		this.current_shader_program = program;
		Engine.GL.useProgram(program.resource);

		// Bind camera?
		if(this.active_camera)
		{
			this.SetShaderConstant("u_trans_view", this.active_camera.mtx_view, Engine.Gfx.SC_MATRIX4);
			this.SetShaderConstant("u_trans_proj", this.active_camera.mtx_proj, Engine.Gfx.SC_MATRIX4);
		}
	},

	SetShaderConstant : function(constant_name, constant_value, setter_func)
	{
		var uniform_location = null;
		var program = this.current_shader_program;

		// Asking WebGL for uniform locations is slow, can we
		// re-use a cached result?
		if(constant_name in program.uniform_location_cache)
		{
			uniform_location = program.uniform_location_cache[constant_name];
		}
		else
		{
			uniform_location = Engine.GL.getUniformLocation(program.resource, constant_name);
			program.uniform_location_cache[constant_name] = uniform_location; // Cache for later
		}

		// Set the constant
		setter_func(Engine.GL, uniform_location, constant_value);
	},

	// **********************************************
	// Texture functionality
	// **********************************************
	LoadTexture : function(descriptor, callback)
	{
		var img_object = new Image();

		// Handle success
		img_object.onload = function()
		{
			// Create gl texture
			var texture_object =
			{
				resource : Engine.GL.createTexture(),
				width    : this.width,
				height   : this.height
			};

			// Bind
			Engine.GL.bindTexture(Engine.GL.TEXTURE_2D, texture_object.resource);

			// Setup params
			Engine.GL.texImage2D(Engine.GL.TEXTURE_2D, 0, Engine.GL.RGBA, Engine.GL.RGBA, Engine.GL.UNSIGNED_BYTE, img_object);
			Engine.GL.texParameteri(Engine.GL.TEXTURE_2D, Engine.GL.TEXTURE_MAG_FILTER, Engine.GL.LINEAR);
			Engine.GL.texParameteri(Engine.GL.TEXTURE_2D, Engine.GL.TEXTURE_MIN_FILTER, Engine.GL.LINEAR_MIPMAP_NEAREST);
			Engine.GL.generateMipmap(Engine.GL.TEXTURE_2D);

			// Unbind
			Engine.GL.bindTexture(Engine.GL.TEXTURE_2D, null);

			// Done
			callback(texture_object);
		};

		// Handle errors
		img_object.onerror = function()
		{
			var error_msg = "Failed loading texture: " + descriptor.file;
			Engine.LogError(error_msg);
			callback({});
		};

		// Initiate load
		img_object.src = descriptor.file;
	},

	BindTexture : function(texture, idx, sampler_name)
	{
		// We support binding by our texture (wrapper) object or raw WebGL texture
		var tx_resource = texture.hasOwnProperty("resource")? texture.resource :
		                                                      texture;

		// If no sampler name is specified use default based on index e.g. "u_tx0"
		if(sampler_name == undefined) { sampler_name = ("u_tx" + idx); }

		// Bind texture
		Engine.GL.activeTexture(Engine.GL.TEXTURE0 + idx);
		Engine.GL.bindTexture(Engine.GL.TEXTURE_2D, tx_resource);
		this.SetShaderConstant(sampler_name, idx, Engine.Gfx.SC_SAMPLER);
	},

	BindTextureArray : function(texture_array, sampler_name)
	{
		// If no sampler name is specified use default sampler array
		if(sampler_name == undefined) { sampler_name = ("u_tx"); }

		// Bind textures
		var sampler_indices = new Int32Array(texture_array.length);
		for(var idx = 0; idx < texture_array.length; ++idx)
		{
			var texture = texture_array[idx];

			// We support binding by our texture (wrapper) object or raw WebGL texture
			var tx_resource = texture.hasOwnProperty("resource")? texture.resource :
			                                                      texture;

			Engine.GL.activeTexture(Engine.GL.TEXTURE0 + idx);
			Engine.GL.bindTexture(Engine.GL.TEXTURE_2D, tx_resource);
			sampler_indices[idx] = idx;
		}

		// Setup sampler array
		this.SetShaderConstant(sampler_name, sampler_indices, Engine.Gfx.SC_SAMPLER_ARRAY);
	},

	// **********************************************
	// Render target functionality
	// **********************************************
	CreateRenderTarget : function(rt_name, rt_width, rt_height)
	{
		// Create texture
		var rt_texture = this.CreateRenderTargetTexture(rt_width, rt_height);

		// Create buffer
		var rt_buffer = Engine.GL.createFramebuffer();
		Engine.GL.bindFramebuffer(Engine.GL.FRAMEBUFFER, rt_buffer);

		// Bind the two
		Engine.GL.framebufferTexture2D(Engine.GL.FRAMEBUFFER, Engine.GL.COLOR_ATTACHMENT0, Engine.GL.TEXTURE_2D, rt_texture, 0);

		// Setup render target object
		var rt_object =
		{
			name     : rt_name,
			resource : rt_buffer,
			texture  : rt_texture,
			width    : rt_width,
			height   : rt_height
		};

		// Register and return render target object
		this.RenderTargets[rt_name] = rt_object;
		return rt_object;
	},

	CreateRenderTargetTexture : function(width, height)
	{
		// Create
		var texture = Engine.GL.createTexture();

		// Set params
		Engine.GL.bindTexture(Engine.GL.TEXTURE_2D, texture);
		Engine.GL.texParameteri(Engine.GL.TEXTURE_2D, Engine.GL.TEXTURE_WRAP_S, Engine.GL.CLAMP_TO_EDGE);
		Engine.GL.texParameteri(Engine.GL.TEXTURE_2D, Engine.GL.TEXTURE_WRAP_T, Engine.GL.CLAMP_TO_EDGE);
		Engine.GL.texParameteri(Engine.GL.TEXTURE_2D, Engine.GL.TEXTURE_MIN_FILTER, Engine.GL.NEAREST);
		Engine.GL.texParameteri(Engine.GL.TEXTURE_2D, Engine.GL.TEXTURE_MAG_FILTER, Engine.GL.NEAREST);
		Engine.GL.texImage2D(Engine.GL.TEXTURE_2D, 0, Engine.GL.RGBA, width, height, 0, Engine.GL.RGBA, Engine.GL.UNSIGNED_BYTE, null);
		return texture;
	},

	BindRenderTarget : function(render_target)
	{
		Engine.GL.bindFramebuffer(Engine.GL.FRAMEBUFFER, render_target.resource);
	},

	UnBindRenderTarget : function(render_target)
	{
		Engine.GL.bindFramebuffer(Engine.GL.FRAMEBUFFER, null);
	},

	// **********************************************
	// Model functionality
	// **********************************************
	DrawModel : function(model)
	{
		// Make sure model has been "loaded" (vertex buffer objects have been created)
		if(!model.hasOwnProperty("is_loaded"))
		{
			Engine.LogError("Attempt to draw unloaded model: " + model.name);
			return false;
		}

		// For each primitive...
		var prims = model.model_data.primitives
		for(var i = 0; i < prims.length; ++i)
		{
			var index_buffer = null;

			// Bind vertex buffers
			var vertex_buffers = prims[i].vertex_buffers;
			for(var j = 0; j < vertex_buffers.length; ++j)
			{
				// Is this an index buffer?
				if(vertex_buffers[j].vbo.buffer_type == Engine.GL.ELEMENT_ARRAY_BUFFER)
				{
					// Only allow a single index buffer per-prim
					if(index_buffer)
					{
						Engine.LogError("Model '" + model.name + "' primitive: " + i + ", attempting to bind multiple index buffers");
						return false;
					}

					// Always bind index buffers last
					index_buffer = vertex_buffers[j];
					continue;
				}

				this.BindVertexBuffer(vertex_buffers[j].vbo);
			}

			// Always bind index buffer last
			if(index_buffer) { this.BindVertexBuffer(index_buffer.vbo); }

			// Draw primitive
			this.DrawArray();
		}

		return true;
	},

	// **********************************************
	// Draw functionality
	// **********************************************
	Clear : function(colour)
	{
		Engine.GL.clearColor(colour[0], colour[1], colour[2], colour[3]);
		Engine.GL.clear(Engine.GL.COLOR_BUFFER_BIT);
	},

	DrawArray : function(optional_offset, optional_count, override_drawmode)
	{
		var wireframe = (this.wireframe_mode || this.force_wireframe_mode);
		var draw_mode = wireframe? Engine.GL.LINE_LOOP : this.current_vertex_buffer_object.draw_mode;
		var is_index_buffer = (this.current_vertex_buffer_object.buffer_type  == Engine.GL.ELEMENT_ARRAY_BUFFER);

		// Override draw mode?
		if(!wireframe && override_drawmode)
		{
			draw_mode = Engine.Gfx.DrawModeFromString[override_drawmode];
		}

		// Calculate offset / count (by default draw the whole buffer)
		var offset = optional_offset || 0;
		var count  = optional_count  || this.current_vertex_buffer_object.item_count;

		if(is_index_buffer)
		{
			// Draw indexed
			Engine.GL.drawElements(draw_mode, count, Engine.GL.UNSIGNED_SHORT, offset);
		}
		else
		{
			// Draw non-indexed
			Engine.GL.drawArrays(draw_mode, offset, count);
		}
	},

	DrawQuad : function()
	{
		// Draw full-screen quad
		this.DrawModel(Engine.Resources["ml_quad"]);
	},

	// **********************************************
	// State tracking
	// **********************************************
	StateTracking : { },
	SetStateBool : function(state, new_value)
	{
		if(new_value == this.StateTracking[state]) { return; }

		// Update state
		this.StateTracking[state] = new_value;
		if(new_value)
		{
			Engine.GL.enable(state);
		}
		else
		{
			Engine.GL.disable(state)
		}
	},

	// **********************************************
	// State management
	// **********************************************
	EnableBlend : function(new_value)
	{
		this.SetStateBool(Engine.GL.BLEND, new_value);
	},

	SetBlendMode : function(a, b, also_enable)
	{
		Engine.GL.blendFunc(a, b);
		if(also_enable) { this.EnableBlend(true); }
	},

	EnableDepthTest : function(new_value)
	{
		this.SetStateBool(Engine.GL.DEPTH_TEST, new_value);
	},

	SetDepthTestMode : function(mode, also_enable)
	{
		Engine.GL.depthFunc(mode);
		if(also_enable) { this.EnableDepthTest(true); }
	},

	// **********************************************
	// Misc
	// **********************************************
	Update : function()
	{
		// Toggle wireframe mode?
		if(Engine.Keyboard.IsPressed("f9", true))
		{
			this.force_wireframe_mode = !this.force_wireframe_mode;
		}
	},

	BindCamera : function(cam)
	{
		this.active_camera = cam;

		// Bind viewport for subsequent draw calls
		cam.BindViewport();
	},

	GetActiveCamera : function()
	{
		return this.active_camera;
	},

	EnableWireframeMode : function(do_enable)
	{
		this.wireframe_mode = do_enable;
	},

	ResizeViewport : function()
	{
		// Update gl viewport to match canvas if no camera is in use
		if(!this.active_camera)
		{
			Engine.GL.viewport(0, 0, Engine.Canvas.GetWidth(), Engine.Canvas.GetHeight());
		}
	},

	// **********************************************
	// Properties
	// **********************************************
	active_camera        : null,  // Used to bind with shader uniforms
	wireframe_mode       : false, // Per draw-call
	force_wireframe_mode : false, // Override all draw calls

	// **********************************************
	// Look up tables
	// **********************************************
	DrawModeFromString :
	{
		"triangle"        : Engine.GL.TRIANGLES,
		"triangles"       : Engine.GL.TRIANGLES,
		"triangle_strip"  : Engine.GL.TRIANGLE_STRIP,
		"triangle_strips" : Engine.GL.TRIANGLE_STRIP,
		"triangle_fan"    : Engine.GL.TRIANGLE_FAN,
		"triangle_fans"   : Engine.GL.TRIANGLE_FAN,
		"lines"           : Engine.GL.LINES
	},

	// *************************************
	// Uniform setter functions (passed to SetShaderConstant)
	SC_FLOAT         : function(gl, uniform_location, new_value) { gl.uniform1f(uniform_location,        new_value); },
	SC_FLOAT_ARRAY   : function(gl, uniform_location, new_value) { gl.uniform1fv(uniform_location,       new_value); },
	SC_INT           : function(gl, uniform_location, new_value) { gl.uniform1i(uniform_location,        new_value); },
	SC_INT_ARRAY     : function(gl, uniform_location, new_value) { gl.uniform1iv(uniform_location,       new_value); },
	SC_SAMPLER       : function(gl, uniform_location, new_value) { gl.uniform1i(uniform_location,        new_value); },
	SC_SAMPLER_ARRAY : function(gl, uniform_location, new_value) { gl.uniform1iv(uniform_location,       new_value); },
	SC_VEC2          : function(gl, uniform_location, new_value) { gl.uniform2fv(uniform_location,       new_value); },
	SC_VEC2_ARRAY    : function(gl, uniform_location, new_value) { gl.uniform2fv(uniform_location,       new_value); },
	SC_VEC3          : function(gl, uniform_location, new_value) { gl.uniform3fv(uniform_location,       new_value); },
	SC_VEC3_ARRAY    : function(gl, uniform_location, new_value) { gl.uniform3fv(uniform_location,       new_value); },
	SC_VEC4          : function(gl, uniform_location, new_value) { gl.uniform4fv(uniform_location,       new_value); },
	SC_VEC4_ARRAY    : function(gl, uniform_location, new_value) { gl.uniform4fv(uniform_location,       new_value); },
	SC_COLOUR        : function(gl, uniform_location, new_value) { gl.uniform4fv(uniform_location,       new_value); },
	SC_MATRIX4       : function(gl, uniform_location, new_value) { gl.uniformMatrix4fv(uniform_location, false, new_value); },

	// **********************************************
	// Cache
	// **********************************************
	ShaderProgramCache : { },
};

// **********************************************
// Init
// **********************************************
Engine.Gfx.StateTracking[Engine.GL.BLEND]      = 0;
Engine.Gfx.StateTracking[Engine.GL.DEPTH_TEST] = 0;
Engine.Gfx.ResizeViewport();

// Resource loading
Engine.Resource.RegisterLoadFunction("png", Engine.Gfx.LoadTexture);
Engine.Resource.RegisterLoadFunction("jpg", Engine.Gfx.LoadTexture);
Engine.Resource.RegisterLoadFunction("vs",  Engine.Gfx.LoadShader);
Engine.Resource.RegisterLoadFunction("fs",  Engine.Gfx.LoadShader);