Engine =
{
	// *************************************************************************************
	// External dependencies
	// *************************************************************************************
	Dependencies :
	[
		"enginejs/css/engine.css",
		"enginejs/script/third_party/hashCode-v1.0.0.js",
		"enginejs/script/third_party/webtoolkit.md5.js",
		"enginejs/script/third_party/gl-matrix-min.js",
		"enginejs/script/third_party/jquery-ui.min.js",
		"enginejs/css/third_party/jquery-ui/jquery-ui.css",
	],

	// *************************************************************************************
	// EngineJS Modules
	// *************************************************************************************
	Modules :
	[
		{ name : "EngineJS-Util",      js : "enginejs/modules/enginejs-util.js"        },
		{ name : "EngineJS-Time",      js : "enginejs/modules/enginejs-time.js"        },
		{ name : "EngineJS-Colour",    js : "enginejs/modules/enginejs-colour.js"      },
		{ name : "EngineJS-Debug",     js : "enginejs/modules/enginejs-debug.js"       },
		{ name : "EngineJS-Array",     js : "enginejs/modules/enginejs-array.js"       },
		{ name : "EngineJS-Math",      js : "enginejs/modules/enginejs-math.js"        },
		{ name : "EngineJS-Intersect", js : "enginejs/modules/enginejs-intersect.js"   },
		{ name : "EngineJS-Easing",    js : "enginejs/modules/enginejs-easing.js"      },
		{ name : "EngineJS-Vec2",      js : "enginejs/modules/enginejs-vec2.js"        },
		{ name : "EngineJS-Vec3",      js : "enginejs/modules/enginejs-vec3.js"        },
		{ name : "EngineJS-Spatial",   js : "enginejs/modules/enginejs-spatial.js"     },
		{ name : "EngineJS-Camera",    js : "enginejs/modules/enginejs-camera.js"      },
		{ name : "EngineJS-Net",       js : "enginejs/modules/enginejs-net.js"         },
		{ name : "EngineJS-Resource",  js : "enginejs/modules/enginejs-resource.js"    },
		{ name : "EngineJS-Keyboard",  js : "enginejs/modules/enginejs-keyboard.js"    },
		{ name : "EngineJS-Mouse",     js : "enginejs/modules/enginejs-mouse.js"       },
		{ name : "EngineJS-Gamepad",   js : "enginejs/modules/enginejs-gamepad.js"     },
		{ name : "EngineJS-Touch",     js : "enginejs/modules/enginejs-touch.js"       },
		{ name : "EngineJS-Gfx",       js : "enginejs/modules/enginejs-gfx.js"         },
		{ name : "EngineJS-Geometry",  js : "enginejs/modules/enginejs-geometry.js"    },
		{ name : "EngineJS-Model",     js : "enginejs/modules/enginejs-model.js"       },
		{ name : "EngineJS-Game-2D",   js : "enginejs/modules/enginejs-game-2d.js"     },
		{ name : "EngineJS-Audio",     js : "enginejs/modules/enginejs-audio.js"       },
		{ name : "EngineJS-Editor",    js : "enginejs/modules/enginejs-editor.js"      },
		{ name : "EngineJS-Device",    js : "enginejs/modules/enginejs-device.js"      },
		{ name : "EngineJS-Text2D",    js : "enginejs/modules/enginejs-text-2d.js"     },
	],

	// *************************************************************************************
	// Resources
	// *************************************************************************************
	Resources :
	{
		// Vertex shaders
		vs_basic                  : { file: "enginejs/shaders/basic.vs" },
		vs_basic_transformed      : { file: "enginejs/shaders/basic-transformed.vs" },
		vs_basic_transformed_nouv : { file: "enginejs/shaders/basic-transformed-nouv.vs" },

		// Fragment shaders
		fs_basic             : { file: "enginejs/shaders/basic.fs" },
		fs_basic_colour      : { file: "enginejs/shaders/basic-colour.fs" },
		fs_basic_textured    : { file: "enginejs/shaders/basic-textured.fs" },
		fs_grid              : { file: "enginejs/shaders/grid.fs" },
		fs_grid_3d           : { file: "enginejs/shaders/grid-3d.fs" },
		fs_grid_3d_fog       : { file: "enginejs/shaders/grid-3d-fog.fs" },

		// Game-2D shaders
		fs_2d_background     : { file: "enginejs/shaders/2d/background.fs" },
		fs_2d_sprite         : { file: "enginejs/shaders/2d/sprite.fs" },

		// Models
		ml_quad              : { file: "enginejs/models/quad.model"       },
		ml_floor_tile        : { file: "enginejs/models/floor_tile.model" },
		ml_tri               : { file: "enginejs/models/tri.model"        },
		ml_cube              : { file: "enginejs/models/cube.model"       },

		// Misc
		tx_white             : { file: "enginejs/img/white.png"   },
		sfx_blank            : { file: "enginejs/audio/blank.mp3" }
	},

	// *************************************************************************************
	// Main initialisation
	Init : function(on_user_init, user_resources, canvas)
	{
		// First load in JS dependencies...
		Engine.LoadDependencies(function()
		{
			// Carry out asynchronous jobs
			ExecuteAsyncJobQueue(
			{
				jobs :
				[
					{
						first : function(cb) // 1. Initialise canvas & WebGL
						{
							Engine.LogSection("Initialising WebGL");
							Engine.InitWebGL(canvas, cb)
						}
					},
					{
						first : function(cb) // 2. Load internal modules
						{
							Engine.LogSection("Loading internal modules");
							Engine.LoadModules(Engine.Modules, cb);
						}
					},
					{
						first : function(cb) // 3. Load internal resources
						{
							Engine.LogSection("Loading internal resources");
							Engine.Resource.LoadBatch(Engine.Resources, cb);
						}
					},
					{
						first : function(cb) // 4. Load user resources
						{
							Engine.LogSection("Loading user resources");
							Engine.Resource.LoadBatch(user_resources, cb);
						}
					}
				],
				finally: function(ok)
				{
					Engine.Log(ok? "Initialised successfully" : "Initialised failed");
					if(!on_user_init) { return; }

					// Run any pre-game initialisation routines
					Engine.PreGameLoopInit();

					// User init handler returns the user render function
					var on_user_render = on_user_init(ok? Engine.GL : null);
					if(on_user_render)
					{
						Engine.LogSection("Starting game loop");
						Engine.RunGameLoop(on_user_render);
					}
				}
			});
		});
	},

	InitWebGL : function(canvas, callback)
	{
		Engine.Log("Initialising WebGL context");
		try
		{
			// Try to grab the standard context. If it fails, fallback to experimental
			Engine.Canvas = canvas || document.getElementsByTagName("canvas")[0];
			var webgl_init_config = { alpha: false };
			Engine.GL = Engine.Canvas.getContext("webgl", webgl_init_config) ||
			            Engine.Canvas.getContext("experimental-webgl", webgl_init_config);
			Engine.Canvas.is_fullscreen = false;

			// Canvas helper methods
			Engine.Canvas.Show      = function()       { $(this).show(); };
			Engine.Canvas.Hide      = function()       { $(this).hide(); };
			Engine.Canvas.GetSize   = function()       { return [this.width, this.height] };
			Engine.Canvas.GetWidth  = function()       { return this.width; };
			Engine.Canvas.GetHeight = function()       { return this.height; };
			Engine.Canvas.GetCentre = function()       { return [this.width / 2, this.height / 2, 0] };
			Engine.Canvas.GetCenter = function()       { return Engine.Canvas.GetCentre(); };
			Engine.Canvas.GetAspectRatio = function()  { return this.width / this.height; };
			Engine.Canvas.GetMaxDimension = function() { return this.width > this.height? this.width  : this.height; };
			Engine.Canvas.GetMinDimension = function() { return this.width > this.height? this.height : this.width;  };
			Engine.Canvas.Resize = function(width, height)
			{
				this.width = width; this.height = height;

				// Other modules can hook-in here for now
				if(Engine.Gfx) { Engine.Gfx.ResizeViewport(); }
			};
			Engine.Canvas.EnableContextMenu = function(do_enable)
			{
				// Suppress canvas right-click context menu?
				Engine.Canvas.oncontextmenu = do_enable? null : function(e)
				{
					e.preventDefault();
				};
			};

			// WebGL initialised successfully
			Engine.Log("WebGL context created");
			callback(true);
		}
		catch(e)
		{
			$(canvas).html("EngineJS initialisation failed");
			Engine.Log("Failed initialising WebGL context");
			callback(false);
		}
	},

	SetRenderCallback : function(callback)
	{
		var request_func = window.requestAnimationFrame       ||
		                   window.webkitRequestAnimationFrame ||
		                   window.mozRequestAnimationFrame    ||
		                   function(callback) { window.setTimeout(callback, 1000 / 60); };
		request_func(callback, this.canvas);
	},

	PreGameLoopInit : function()
	{
		Engine.Debug.PreGameLoopInit();
	},

	// *************************************************************************************
	// Main Game Loop
	// *************************************************************************************
	RunGameLoop : function(on_user_render)
	{
		var on_render_internal = function()
		{
			// Generate frame stats
			var elapsed_ms = Engine.Time.Now() - first_frame_time;
			var delta_ms   = Engine.Time.Now() - last_frame_time;

			// Request next render frame
			Engine.SetRenderCallback(on_render_internal);

			// Flip input buffers
			Engine.Mouse.Update();
			Engine.Keyboard.Update();
			Engine.Gamepad.Update();
			Engine.Gfx.Update();

			// Flush debug draw
			Engine.Debug.Update();

			// Update text elements
			Engine.Text2D.Update();

			// Setup per-frame info for client
			var info =
			{
				elapsed_s    : elapsed_ms / 1000,
				elapsed_ms   : elapsed_ms,
				delta_s      : delta_ms / 1000,
				delta_ms     : delta_ms,
				frame_number : frame_number
			};

			// Call user render function
			last_frame_time = Engine.Time.Now();
			on_user_render(info);

			// Debug draw
			Engine.Debug.Render();

			// Kick touch input
			Engine.Touch.Update();
			Engine.Gfx.first_frame = false;
			++frame_number;
		};

		// Request first render frame
		var frame_number = 0;
		var first_frame_time = Engine.Time.Now();
		var last_frame_time  = Engine.Time.Now();
		Engine.SetRenderCallback(on_render_internal);
	},

	// *************************************************************************************
	// Logging
	// *************************************************************************************
	LogSection : function(msg)
	{
		console.log("[engine] *****************************************");
		console.log("[engine]  " + msg);
		console.log("[engine] *****************************************");
	},

	Log : function(msg)
	{
		console.log("[engine]  INFO: " + msg);
	},

	LogObject : function(obj)
	{
		console.log("[engine]  INFO: " + JSON.stringify(obj));
	},

	LogError : function(msg)
	{
		console.error("[engine] ERROR: " + msg);
	},

	// *************************************************************************************
	// Misc
	// *************************************************************************************
	LoadModules : function(modules, on_complete)
	{
		ExecuteAsyncLoop(modules, function(_module, carry_on)
		{
			Engine.Log("Loading module: " + _module.name);
			Engine.LoadJS(_module.js, function()
			{
				carry_on(true); // Load next module
			});
		}, on_complete);
	},

	LoadDependencies : function(on_complete)
	{
		// *************************************************************************************
		// Runtime javascript dependency load & init
		var dependency_load_functions =
		{
			js  : function(url, callback) { Engine.LoadJS(url, callback);  },
			css : function(url, callback) { Engine.LoadCSS(url, callback); },
		};

		// 1. Load ajq for better async jobs/loops
		Engine.LogSection("Loading Dependencies");
		$.getScript("enginejs/script/third_party/ajq/ajq.js", function(script)
		{
			eval(script); // Hotload ajq.js

			// 2. Use ajq to dynamically load remaining dependencies
			ExecuteAsyncLoop(Engine.Dependencies, function(entry, carry_on)
			{
				Engine.Log("Loading dependency: " + entry);
				var extension = entry.split('.').pop();
				if(extension in dependency_load_functions)
				{
					dependency_load_functions[extension](entry, function()
					{
						carry_on(true);
					});
				}
				else
				{
					Engine.LogError("Dependency type with extension '" + extension + "' not supported");
					on_complete(null);
				}
			}, on_complete);
		});
	},

	LoadJS : function(url, callback)
	{
		$.getScript(url, function(script)
		{
			callback(script);
		}).fail(function(jqxhr, settings, exception)
		{
			Engine.LogError("Failed to load " + url);
			Engine.LogError(exception);
		});
	},

	LoadCSS : function(url, callback)
	{
		$("<link/>", { rel: "stylesheet", type: "text/css", href: url }).appendTo("head");
		callback();
	}
};