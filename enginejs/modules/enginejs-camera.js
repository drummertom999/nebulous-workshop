// *******************************************
//# sourceURL=modules/enginejs-camera.js
// *******************************************

Engine.Camera =
{
	// *************************************
	// Camera base class
	Base : function()
	{
		this.helpers  = [];
		this.viewport = { size : [1, 1], position: [0, 0] };
		this.mtx_view = mat4.create();
		this.mtx_proj = mat4.create();

		this.AttachHelper = function(helper_class)
		{
			this.helpers.push(helper_class);
		};

		this.BindViewport = function()
		{
			// Setup viewport
			var viewport_x  = this.viewport.position[0] * Engine.Canvas.GetWidth();
			var viewport_y  = this.viewport.position[1] * Engine.Canvas.GetHeight();
			var viewport_width  = this.viewport.size[0] * Engine.Canvas.GetWidth();
			var viewport_height = this.viewport.size[1] * Engine.Canvas.GetHeight();
			Engine.GL.viewport(viewport_x, viewport_y, viewport_width, viewport_height);
		};

		this.Update = function(info)
		{
			// Run any helpers
			for(var i = 0; i < this.helpers.length; ++i)
			{
				this.helpers[i].Update(this, info);
			}

			// Update matrices
			this.UpdateMatrices();
		};
	},

	// *************************************
	// Orthographic camera
	Orthographic : function(user_config)
	{
		// Inherit base
		$.extend(this, new Engine.Camera.Base());

		// Set defaults
		this.position        = [0, 0];
		this.size            = Engine.Canvas.GetSize();
		this.use_canvas_size = !(user_config && user_config.size),
		this.follow          = null;
		$.extend(this, user_config); // Override defaults

		this.UpdateMatrices = function()
		{
			// Maintain "default" behaviour by keeping camera size in-sync
			// with canvas size unless user-defined size has been provided
			// via SetSize(), which clears the use_canvas_size flag.
			// Note: the "default" behavior can be restored using ResetSize()
			if(this.use_canvas_size)
			{
				this.size = Engine.Canvas.GetSize();
			}

			// Follow point?
			if(this.follow && this.follow.GetPosition)
			{
				this.position = Engine.Array.Copy(this.follow.GetPosition());
				this.position[0] -= this.size[0] / 2;
				this.position[1] -= this.size[1] / 2;
			}

			mat4.identity(this.mtx_view);

			// Camera x/y represents bottom left of view region
			mat4.ortho(this.mtx_proj,
			           this.position[0], this.position[0] + this.size[0],
			           this.position[1], this.position[1] + this.size[1],
			           -1000.0, 1000.0);
		};

		this.SetSize = function(size)
		{
			this.size = Engine.Array.Copy(size);
			this.use_canvas_size = false;
		};

		this.ResetSize = function()
		{
			this.use_canvas_size = true;
		};

		this.Follow = function(some_object)
		{
			this.follow = some_object;
		};
	},

	// *************************************
	// Perspective camera
	Perspective : function(user_config)
	{
		// Inherit base
		$.extend(this, new Engine.Camera.Base());

		// Set defaults
		this.position = [0.0, 0.0, 0.0]; // Start at origin
		this.look_at  = [0.0, 0.0, 1.0]; // Looking down z-axis
		this.up       = [0.0, 1.0, 0.0]; // Default up
		this.fov      = 45.0;
		this.aspect   = Engine.Canvas.GetAspectRatio();
		this.near     = 0.1;
		this.far      = 100;
		$.extend(this, user_config); // Override defaults

		this.UpdateMatrices = function()
		{
			this.aspect = Engine.Canvas.GetAspectRatio();
			mat4.lookAt(this.mtx_view, this.position, this.look_at, this.up);
			mat4.perspective(this.mtx_proj, this.fov, this.aspect, this.near, this.far);
		};
	},
};

Engine.Camera.Helper =
{
	// *************************************
	// 3D Orbit
	Orbit : function(user_config)
	{
		this.process_input = true;                 // Update based on user input
		this.look_at       = [0.0, 0.0, 0.0];      // Look at origin
		this.up            = [0.0, 1.0, 0.0];      // Default up
		this.angles        = [0, 0];
		this.radius        = [5, 2, 10];           // Default, min, max
		this.min_y         = -(Math.PI / 2) + 0.1; // prevent alignment with -ve y-axis
		this.max_y         =  (Math.PI / 2) - 0.1; // prevent alignment with +ve y-axis

		// Override defaults
		$.extend(this, user_config);

		this.Update = function(camera, info)
		{
			// Zoom
			var wheel_delta = Engine.Mouse.GetWheelDelta();
			if(wheel_delta != 0)
			{
				this.radius[0] -= wheel_delta * info.delta_s / 3;
				this.radius[0] = Engine.Math.Clamp(this.radius[0], this.radius[1], this.radius[2]);
			}

			// Pan
			if(Engine.Mouse.IsPressed())
			{
				var mouse_delta = Engine.Mouse.GetDelta();
				this.angles[0] += mouse_delta[0] * info.delta_s / 3;
				this.angles[1] = Engine.Math.Clamp(this.angles[1] - mouse_delta[1] * info.delta_s / 3, this.min_y, this.max_y);
			}

			// Update
			camera.look_at  = this.look_at;
			camera.up       = this.up;
			camera.position = [this.look_at[0] + this.radius[0] * Math.cos(this.angles[0]) * Math.cos(this.angles[1]),
			                   this.look_at[1] + this.radius[0] * Math.sin(this.angles[1]),
			                   this.look_at[2] + this.radius[0] * Math.sin(this.angles[0]) * Math.cos(this.angles[1])];
		};
	},
};