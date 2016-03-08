// *******************************************
//# sourceURL=modules/enginejs-game-2d.js
// *******************************************

Engine.Game2D =
{
	Entity : function(texture_or_sprite, tag, config)
	{
		// Setup defaults
		this.original_size       = [0, 0];
		this.size                = [0, 0];
		this.position            = [0, 0];
		this.velocity            = [0, 0];
		this.rotation            = 0;
		this.depth               = 0; // 0 = front
		this.tint                = [1, 1, 1, 1];
		this.alpha               = 1;
		this.is_visible          = true;
		this.enable_debug_render = false;
		this.tag                 = tag || "";
		this.scene               = null; // parent scene
		this.sprite              = null;
		this.cached_aabb         = null;

		// Apply any user overrides
		$.extend(this, config);

		this.SetSprite = function(texture_or_sprite)
		{
			var is_sprite = (texture_or_sprite.descriptor.extension == "sprite");
			if(is_sprite)
			{
				// Create instance of specified sprite
				this.sprite = new Engine.Game2D.Sprite();
				$.extend(this.sprite, texture_or_sprite);

				// Set entity size to match grid size of first texture
				var first_texture = Engine.Array.GetFirstValue(this.sprite.textures);
				this.original_size = [first_texture.width  / first_texture.descriptor.cols,
				                      first_texture.height / first_texture.descriptor.rows];
				this.size = Engine.Array.Copy(this.original_size);
			}
			else
			{
				// Create a basic sprite from texture and set entity size to
				// match texture size
				this.sprite = new Engine.Game2D.Sprite();
				this.sprite.textures["default"] = texture_or_sprite;
				this.sprite.textures["default"].descriptor.rows = 1;
				this.sprite.textures["default"].descriptor.cols = 1;
				this.sprite.active_texture = this.sprite.textures["default"];
				this.original_size = [texture_or_sprite.width, texture_or_sprite.height];
				this.size = Engine.Array.Copy(this.original_size);
			}
		};

		// Setup sprite?
		if(texture_or_sprite)
		{
			this.SetSprite(texture_or_sprite);
		}

		this.UpdateInternal = function(info)
		{
			// Integrate linear velocity
			this.position[0] += this.velocity[0] * info.delta_s;
			this.position[1] += this.velocity[1] * info.delta_s;

			// Update sprite?
			if(this.sprite)
			{
				this.sprite.Update(info);
			}
		};

		this.SetTag = function(tag)
		{
			this.tag = tag;
		};

		this.SetVelocity = function(velocity)
		{
			this.velocity = Engine.Array.Copy(velocity);
		};

		this.Move = function(delta)
		{
			this.position[0] += delta[0];
			this.position[1] += delta[1];
		};

		this.MoveTo = function(new_pos)
		{
			this.position[0] = new_pos[0];
			this.position[1] = new_pos[1];
		};

		this.SetX = function(x)
		{
			this.position[0] = x;
		};

		this.SetY = function(y)
		{
			this.position[1] = y;
		};

		this.SetDepth = function(depth)
		{
			this.depth = depth;
		};

		this.SetRotation = function(theta)
		{
			this.rotation = theta;
		};

		this.SetSize = function(size)
		{
			this.size[0] = size;
			this.size[1] = size;
		};

		this.SetTint = function(colour)
		{
			this.tint[0] = colour[0];
			this.tint[1] = colour[1];
			this.tint[2] = colour[2];
		};

		this.SetAlpha = function(alpha)
		{
			this.tint[3] = alpha;
		};

		this.SetVisible = function(is_visible)
		{
			this.is_visible = is_visible;
		};

		this.GetAlpha = function()
		{
			return this.tint[3];
		};

		this.IsVisible = function()
		{
			return this.is_visible;
		};

		this.GetTag = function()
		{
			return this.tag;
		};

		this.GetOrigin = function()
		{
			return this.origin;
		};

		this.GetPosition = function()
		{
			return this.position;
		};

		this.GetX = function()
		{
			return this.position[0];
		};

		this.GetY = function()
		{
			return this.position[1];
		};

		this.GetVelocity = function()
		{
			return this.velocity;
		};

		this.GetRotation = function()
		{
			return this.rotation;
		};

		this.GetSize = function()
		{
			return this.size[0];
		};

		this.GetWorldTransform = function(exclude_rotation)
		{
			var mtx_trans = mat4.create();
			var sprite_scale_factor = this.GetSpriteScaleFactor();

			// 5. Move into position
			mat4.translate(mtx_trans, Engine.Math.IdentityMatrix, Engine.Vec3.FromVec2(this.position, 0));

			// 4. Apply scale
			mat4.scale(mtx_trans, mtx_trans, Engine.Vec3.FromVec2(sprite_scale_factor, 1));

			// 3. Apply origin offset?
			if(this.sprite)
			{
				var to_origin = Engine.Vec2.Negate(this.sprite.origin);
				mat4.translate(mtx_trans, mtx_trans, Engine.Vec3.FromVec2(to_origin, 0));
			}

			// 2. Always rotate about sprite-space centre (not origin!)
			if(!exclude_rotation)
			{
				mat4.rotate(mtx_trans, mtx_trans, this.rotation, Engine.Vec3.AxisZ);
			}

			// 1. Start in sprite space ([0,0] = bottom left) and move to centre
			var to_centre = this.sprite? Engine.Vec2.DivideScalar(Engine.Vec2.Negate(this.original_size), 2) :
			                             Engine.Vec2.Negate(this.size);
			mat4.translate(mtx_trans, mtx_trans, Engine.Vec3.FromVec2(to_centre));
			return mtx_trans;
		};

		this.GetAABB = function()
		{
			var mtx_trans = this.GetWorldTransform(true); // exclude rotation
			var min = Engine.Vec2.Transform([0, 0], mtx_trans);
			var max = this.sprite? this.original_size :
			                       Engine.Vec2.MultiplyScalar(this.size, 2);
			max = Engine.Vec2.Transform(max, mtx_trans);
			return new Engine.Math.AABB2D(min, max);
		};

		this.GetSpriteScaleFactor = function()
		{
			// This is the scale applied to the original sprite texture to fit the current entity size
			// Note: native = 1
			return this.sprite? Engine.Vec2.Divide(this.size, this.original_size) : [1, 1];
		};

		this.cached_aabb = this.GetAABB();

		this.GetTransformedCollisionShapes = function()
		{
			// This returns any collision shapes belonging to the sprite, after
			// applying correct position/offset translation & scaling for this entity instance
			if(!this.sprite || this.sprite.collision_shapes.length == 0) { return []; }

			// If we're using the default origin [0, 0] and no scaling or rotation is applied,
			// we can skip the transform process entirely
			if(this.sprite.origin[0] == 0 && this.sprite.origin[0] &&
			   this.size[0] == this.original_size[0] && this.size[0] == this.original_size[1] &&
			   this.rotation == 0)
			{
				return this.sprite.collision_shapes;
			}

			var sprite_scale_factor = this.GetSpriteScaleFactor();
			var mtx_trans = this.GetWorldTransform();

			var results = [];
			for(var i = 0; i < this.sprite.collision_shapes.length; ++i)
			{
				// Apply transform
				var shape = this.sprite.collision_shapes[i];
				var transformed_offset = Engine.Vec2.Transform(shape.offset, mtx_trans);

				switch(shape.type)
				{
					case "rect":
						if(this.rotation == 0)
						{
							// Axis-aligned rect
							results.push(
							{
								type   : "rect",
								offset : transformed_offset,
								width  : shape.width  * sprite_scale_factor[0],
								height : shape.height * sprite_scale_factor[1]
							});
						}
						else
						{
							// Rotated rect
							var bl = transformed_offset;
							var br = Engine.Vec2.Transform(Engine.Vec2.Add(shape.offset, [shape.width, 0]), mtx_trans);
							var tr = Engine.Vec2.Transform(Engine.Vec2.Add(shape.offset, [shape.width, shape.height]), mtx_trans);
							var tl = Engine.Vec2.Transform(Engine.Vec2.Add(shape.offset, [0, shape.height]), mtx_trans);
							results.push(
							{
								type     : "polygon",
								vertices : [bl, br, tr, tl],
							});
						}
						break;
					case "circle":
						results.push(
						{
							type   : "circle",
							offset : transformed_offset,
							radius : shape.radius * Engine.Vec2.MaxElement(sprite_scale_factor)
						});
						break;
				}
			}
			return results;
		};

		this.IsTapped = function(custom_radius)
		{
			// Tap must have just occurred
			var tap_result = Engine.Touch.IsTapped();
			if(tap_result == null)
				return false;

			// Entity needs to be part of a scene
			if(this.scene == null)
				return false;

			// Parent scene must have valid camera in order to translate
			// the tap position from canvas space to world-space
			var camera = this.scene.GetCamera();
			if(camera == null)
				return false;

			// Transform tap position into world-space & test against AABB
			var canvas_size = Engine.Canvas.GetSize();
			var pos = Engine.Vec2.Subtract(tap_result.position, camera.position);

			// Using custom radius for hit test?
			if(custom_radius)
			{
				var to_tap = Engine.Vec2.Subtract(pos, this.position);
				return Engine.Vec2.Length(to_tap) <= custom_radius;
			}

			// Use AABB for hit test
			if(!this.GetAABB().ContainsPoint(pos))
				return false;

			// Tap point was inside entity AABB
			return true;
		};

		this.IsClicked = function(debounce, custom_radius)
		{
			// Click must have just occurred
			var just_clicked = Engine.Mouse.IsPressed("left", debounce);
			if(!just_clicked)
				return false;

			// Entity needs to be part of a scene
			if(this.scene == null)
				return false;

			// Parent scene must have valid camera in order to translate
			// the tap position from canvas space to world-space
			var camera = this.scene.GetCamera();
			if(camera == null)
				return false;

			// Transform click position into world-space & test against AABB
			var canvas_size = Engine.Canvas.GetSize();
			var pos = Engine.Vec2.Subtract(Engine.Mouse.GetPosition(), camera.position);

			// Using custom radius for hit test?
			if(custom_radius)
			{
				var to_tap = Engine.Vec2.Subtract(pos, this.position);
				return Engine.Vec2.Length(to_tap) <= custom_radius;
			}

			// Use AABB for hit test
			if(!this.GetAABB().ContainsPoint(pos))
				return false;

			// Click point was inside entity AABB
			return true;
		};

		this.IsOutsideView = function(camera_index)
		{
			// Make sure this entity is part of a scene
			if(!this.scene)
				return true;

			// Ensure camera index is valid
			var cam_index = camera_index || 0;
			var cameras = this.scene.cameras;
			if(cameras.length <= cam_index)
			{
				Engine.LogError("Invalid camera index: " + cam_index);
				return true;
			}

			// Check if entity is contained within view
			var camera = cameras[cam_index];
			var entity_aabb = this.GetAABB();
			var camera_aabb = { min: camera.position, max : Engine.Vec2.Add(camera.position, camera.size) };
			return !Engine.Intersect.AABB_AABB(entity_aabb, camera_aabb);
		};

		this.IsWithinView = function(camera_index)
		{
			return !this.IsOutsideView(camera_index);
		};

		this.GetNeighbours = function()
		{
			// Return "nearby" neighbours within scene spatial tree
			if(!this.scene)
				return 0;

			var aabb = this.GetAABB();
			var results = this.scene.quadtree.Retrieve(aabb.min, aabb.max);
			Engine.Array.RemoveItem(results, this);
			return results;
		};

		this.EnableDebugRender = function(state)
		{
			this.enable_debug_render = state;
		};
	},

	Scene : function(background_texture_or_object)
	{
		this.entities = [];
		this.enable_debug_render = false;
		this.max_size = [1000000, 1000000];
		this.quadtree = new Engine.Spatial.QuadTree();
		this.enable_debug_render_quadtree = false;

		// Simulation pause/step
		this.is_paused   = false;
		this.is_stepping = false;

		// Setup 2D orthographic camera
		this.cameras = [new Engine.Camera.Orthographic()];

		// Setup background
		if(background_texture_or_object)
		{
			var is_background_object = background_texture_or_object.descriptor.extension == "background";
			if(is_background_object)
			{
				// Use background directly
				this.background = background_texture_or_object;
			}
			else
			{
				// Setup a new background and apply texture to first layer
				var background_texture = background_texture_or_object; // Must be a texture
				this.background = new Engine.Game2D.Background();
				this.background.layers.push(
				{
					texture : background_texture,
					depth   : 1,
					scale   : [1, 1],
					offset  : [0, 0],
					scroll  : [0, 0],
					repeat  : [true, true]
				});
			}
		}
		else
		{
			// Use default (grid) background
			this.background = new Engine.Game2D.Background();
		}

		// Setup shader programs
		this.program_grid   = Engine.Gfx.CreateShaderProgram(Engine.Resources["vs_basic_transformed"],
		                                                     Engine.Resources["fs_grid"]);
		this.program_sprite = Engine.Gfx.CreateShaderProgram(Engine.Resources["vs_basic_transformed"],
		                                                     Engine.Resources["fs_2d_sprite"]);

		this.Add = function(entity)
		{
			if(Engine.Util.IsArray(entity))
			{
				for(var i = 0; i < entity.length; ++i)
				{
					this.entities.push(entity[i]);
					entity[i].scene = this;
				}
			}
			else
			{
				this.entities.push(entity);
				entity.scene = this;
			}
		};

		this.Remove = function(entity)
		{
			if(Engine.Util.IsArray(entity))
			{
				for(var i = 0; i < entity.length; ++i)
				{
					entity[i].scene = null; // Detach from scene
					Engine.Array.RemoveItem(this.entities, entity[i]);
				}
			}
			else
			{
				entity.scene = null; // Detach from scene
				Engine.Array.RemoveItem(this.entities, entity);
			}
		},

		this.FindByTag = function(tag)
		{
			var results = []
			for(var i = 0; i < this.entities.length; ++i)
			{
				var entity = this.entities[i];
				if(entity.tag == tag)
				{
					results.push(entity);
				}
			}
			return results;
		}

		this.Clear = function()
		{
			// Detach entities from scene
			for(var i = 0; i < this.entities.length; ++i)
			{
				this.entities[i].scene = null;
			}

			// Clear scene
			this.entities = [];
		};

		this.EnableDebugRender = function(state)
		{
			this.enable_debug_render = state;
		};

		this.Pause = function()
		{
			this.is_paused = true;
		};

		this.Resume = function()
		{
			this.is_paused = false;
		};

		this.StepSimulation = function()
		{
			// Must be paused to single step the simulation
			if(!this.is_paused)
			{
				Engine.LogError("Use Engine.Game2D.Entity.Pause() to pause the scene before attempting to step the simulation");
				return;
			}

			this.is_stepping = true;
		};

		this.IsPaused = function()
		{
			return this.is_paused;
		};

		this.GetEntities = function()
		{
			return this.entities;
		};

		this.GetEntityCount = function()
		{
			return this.entities.length;
		};

		this.GetCamera = function(index)
		{
			var i = (index == undefined)? 0 : index;
			return this.cameras[i];
		};

		this.Render = function(info)
		{
			if(!this.is_paused || this.is_stepping)
			{
				// Update entities
				this.quadtree.Clear();
				for(var i = 0; i < this.entities.length; ++i)
				{
					var entity = this.entities[i];
					entity.UpdateInternal(info);

					// Cache world-space AABB for this frame & update quadtree
					entity.cached_aabb = entity.GetAABB();
					this.quadtree.Add(
					{
						data : entity,
						min  : entity.cached_aabb.min,
						max  : entity.cached_aabb.max
					});
				}
			}

			// Only ever step simulation by a single frame
			this.is_stepping = false;

			// For now let's depth sort on CPU to avoid issues with alpha sprites with same depth
			Engine.Gfx.EnableDepthTest(false);
			this.entities.sort(function(a, b){ return b.depth - a.depth; });

			// For each camera in the scene...
			for(var cam_index = 0; cam_index < this.cameras.length; ++cam_index)
			{
				var cam = this.cameras[cam_index];

				// Update & bind camera
				cam.Update(info);
				Engine.Gfx.BindCamera(cam);
				var mtx_trans = mat4.create();

				// Render background (or grid if background not setup)
				Engine.Gfx.EnableBlend(false);
				var background_in_use = this.background.hasOwnProperty("colour") ||
				                        this.background.layers.length > 0;
				if(background_in_use)
				{
					this.background.Render(info);
				}
				else
				{
					Engine.Gfx.EnableDepthTest(false);
					mat4.scale(mtx_trans, mtx_trans, [this.max_size[0], this.max_size[1], 0.0]);
					Engine.Gfx.BindShaderProgram(this.program_grid);
					Engine.Gfx.SetShaderConstant("u_trans_model", mtx_trans, Engine.Gfx.SC_MATRIX4);
					Engine.Gfx.DrawQuad();
				}

				// Render setup
				Engine.Gfx.SetBlendMode(Engine.GL.SRC_ALPHA, Engine.GL.ONE_MINUS_SRC_ALPHA, true);
				Engine.Gfx.BindShaderProgram(this.program_sprite);
				var last_bound_texture = null;
				var last_bound_tint = null;

				// Render entities
				for(var i = 0; i < this.entities.length; ++i)
				{
					var entity = this.entities[i];
					if(!entity.IsVisible()) { continue; }

					// Build "model" transform
					var mtx_trans = entity.GetWorldTransform();

					// Apply scale & bias as Engine.Gfx.DrawQuad uses centred 2x2 (clip-space) quad
					var scale = entity.sprite? Engine.Vec2.DivideScalar(entity.original_size, 2) : entity.size;
					mat4.scale(mtx_trans, mtx_trans, Engine.Vec3.FromVec2(scale));
					mat4.translate(mtx_trans, mtx_trans, [1, 1, 0]);
					Engine.Gfx.SetShaderConstant("u_trans_model", mtx_trans, Engine.Gfx.SC_MATRIX4);

					// Setup tint
					if(entity.tint != last_bound_tint)
					{
						Engine.Gfx.SetShaderConstant("u_tint", entity.tint, Engine.Gfx.SC_VEC4);
						last_bound_tint = entity.tint;
					}

					// Setup sprite?
					if(entity.sprite)
					{
						// Setup anim frame
						var anim_config = [entity.sprite.active_texture.descriptor.rows,
						                   entity.sprite.active_texture.descriptor.cols,
						                   entity.sprite.current_anim_frame];
						Engine.Gfx.SetShaderConstant("u_anim_config", anim_config, Engine.Gfx.SC_VEC3);

						// Setup mirror config
						Engine.Gfx.SetShaderConstant("u_mirror_config", entity.sprite.mirror, Engine.Gfx.SC_VEC2);

						// Setup texture
						if(entity.sprite.active_texture != last_bound_texture)
						{
							Engine.Gfx.BindTexture(entity.sprite.active_texture, 0);
							last_bound_texture = entity.sprite.active_texture;
						}
					}
					else
					{
						// Fill with tint colour
						var dummy_texture = Engine.Resources["tx_white"];
						Engine.Gfx.BindTexture(dummy_texture, 0);
						last_bound_texture = dummy_texture;
					}

					// Draw
					Engine.Gfx.DrawQuad();

					// Debug render?
					if(entity.enable_debug_render || this.enable_debug_render)
					{
						// Draw entity AABB quad (outline)
						var aabb  = entity.cached_aabb;
						var width = aabb.max[0] - aabb.min[0], height = aabb.max[1] - aabb.min[1];
						Engine.Debug.DrawLine(aabb.min, Engine.Vec2.Add(aabb.min, [0,  height]), Engine.Colour.Orange);
						Engine.Debug.DrawLine(aabb.min, Engine.Vec2.Add(aabb.min, [width,   0]), Engine.Colour.Orange);
						Engine.Debug.DrawLine(aabb.max, Engine.Vec2.Add(aabb.max, [-width,  0]), Engine.Colour.Orange);
						Engine.Debug.DrawLine(aabb.max, Engine.Vec2.Add(aabb.max, [0, -height]), Engine.Colour.Orange);

						// Draw collision shapes?
						colour = [1.0, 0.0, 0.0, 0.5];
						var collision_shapes = entity.GetTransformedCollisionShapes();
						for(var j = 0; j < collision_shapes.length; ++j)
						{
							var shape = collision_shapes[j];
							switch(shape.type)
							{
								case "rect":
									Engine.Debug.DrawRect(shape.offset, shape.width, shape.height, colour);
									break;
								case "polygon":
									Engine.Debug.DrawPolygon(shape.vertices, colour);
									break;
								case "circle":
									Engine.Debug.DrawCircle(shape.offset, shape.radius, colour);
									break;
							}
						}

						// Draw origin
						var line_length = 10;
						Engine.Debug.DrawLine(Engine.Vec2.Subtract(entity.position, [line_length, 0]),
						                      Engine.Vec2.Add(entity.position, [line_length, 0]), Engine.Colour.Blue, 3);
						Engine.Debug.DrawLine(Engine.Vec2.Subtract(entity.position, [0, line_length]),
						                      Engine.Vec2.Add(entity.position, [0, line_length]), Engine.Colour.Blue, 3);
					}

					// Debug render quad tree?
					if(this.enable_debug_render_quadtree)
					{
						this.quadtree.DebugRender();
					}
				}
			}
		};

		this.HitTest = function(a, b)
		{
			var results = [];

			// Entity instance <--> Tag
			if(!Engine.Util.IsString(a) && Engine.Util.IsString(b))
			{
				var entity = a, tag = b;
				var aabb = a.GetAABB()

				// ***********************************************************
				// Phase 1: Broad-scale AABB intersection tests
				// ***********************************************************
				var broadscale_results = []; // Entity pairs with overlapping AABBs

				// Grab the entities "neighbours" (these are other entities which
				// share the same node in the spatial tree)
				var candidates = entity.GetNeighbours();
				for(var i = 0; i < candidates.length; ++i)
				{
					// Test each candidate neighbour for AABB intersection
					var candidate = candidates[i];
					if(candidate.tag == tag && a.GetAABB().Intersects(candidate.GetAABB()))
					{
						broadscale_results.push(candidate);
					}
				}

				// ***********************************************************
				// Phase 2: Narrow-scale AABB intersection tests
				// ***********************************************************
				for(var i = 0; i < broadscale_results.length; ++i)
				{
					var other = broadscale_results[i];

					// Get collision shape lists
					var shapes = a.GetTransformedCollisionShapes();
					var other_shapes = other.GetTransformedCollisionShapes();

					// If neither entity has collision shapes, the AABB insersect
					// constitutes a valid collision
					if(shapes.length == 0 && other_shapes.length == 0)
					{
						results.push([a, other]);
						continue;
					}

					// If either entity has no collision shapes, use AABB
					if(shapes.length == 0)
					{
						var aabb_shape = { "type" : "rect", "offset" : aabb.min,
						                   "width"  : aabb.max[0] - aabb.min[0],
						                   "height" : aabb.max[1] - aabb.min[1] };
						shapes.push(aabb_shape);
					}
					if(other_shapes.length == 0)
					{
						var other_aabb = other.GetAABB();
						var aabb_shape = { "type" : "rect", "offset" : other_aabb.min,
						                   "width"  : other_aabb.max[0] - other_aabb.min[0],
						                   "height" : other_aabb.max[1] - other_aabb.min[1] };
						other_shapes.push(aabb_shape);
					}

					// Setup list of collision functions
					// Note: Need to support more pairs!
					var collision_functions =
					{
						"circle,circle"   : function(a, b)
						{
							a_circle = { position: a.offset, radius : a.radius };
							b_circle = { position: b.offset, radius : b.radius }
							return Engine.Intersect.Circle_Circle(a_circle, b_circle);
						},
						"circle,rect"     : null, // unsupported (WIP)
						"circle,polygon"  : null, // unsupported (WIP),
						"polygon,polygon" : null, // unsupported (WIP),
						"polygon, rect"   : null, // unsupported (WIP),
						"rect,rect"       : function(a, b)
						{
							a_aabb = { min : a.offset, max : [a.offset[0] + a.width, a.offset[1] + a.height] };
							b_aabb = { min : b.offset, max : [b.offset[0] + b.width, b.offset[1] + b.height] };
							return Engine.Intersect.AABB_AABB(a_aabb, b_aabb);
						}
					};

					// Test for intersection between shapes
					var is_collision = false;
					for(var j = 0; j < shapes.length && !is_collision; ++j)
					{
						var shape = shapes[j];
						for(var k = 0; k < other_shapes.length && !is_collision; ++k)
						{
							var other_shape = other_shapes[k];
							var collision_func_name = [shape.type, other_shape.type].sort().join(",");
							var collision_func = collision_functions[collision_func_name];
							if(collision_func)
							{
								if(collision_func(shape, other_shape))
								{
									// Collision occured
									results.push(other);
									is_collision = true; // Break out of loops
								}
							}
							else
							{
								// No collision test for this shape combination
								Engine.LogError("Unsupported entity collision shape pair: " + collision_func_name);
							}
						}
					}
				}
			}
			else if(Engine.Util.IsString(a) && Engine.Util.IsString(b))
			{
				// Tag <--> Tag
				// NOTE: Implementation rough and ready for GB2015, needs reworking!
				var results = [];
				var a_instances = this.FindByTag(a);
				for(var i = 0; i < a_instances.length; ++i)
				{
					var a_instance = a_instances[i];
					var collisions = this.HitTest(a_instance, b);
					if(collisions.length > 0)
					{
						results.push(a_instance);
						results = results.concat(collisions);
					}
				}
			}

			return results.length? results : false;
		};
	},

	Background : function()
	{
		this.MAX_LAYERS = 7;
		this.program = Engine.Gfx.CreateShaderProgram(Engine.Resources["vs_basic"],
					                                  Engine.Resources["fs_2d_background"]);
		this.layers = [];
		this.repeat = [false, false];

		this.Render = function(info)
		{
			// Setup constants
			var canvas_width = Engine.Canvas.GetWidth();
			var canvas_height = Engine.Canvas.GetHeight();

			// Sort layers from back to front
			this.layers.sort(function(a,b){ return a.depth - b.depth; });

			// Init shader params
			var u_textures = [];
			var u_config_1 = new Float32Array(this.MAX_LAYERS * 4);
			var u_config_2 = new Float32Array(this.MAX_LAYERS * 4);
			var u_config_3 = new Float32Array(this.MAX_LAYERS * 4);

			// Pack per-layer data into shader params
			for(var i = 0; i < this.MAX_LAYERS; ++i)
			{
				if(i < this.layers.length)
				{
					var layer = this.layers[i];
					var layer_texture_width  = layer.texture.width;
					var layer_texture_height = layer.texture.height;
					u_textures[i] = layer.texture;
					u_config_1[i * 4 + 0] = (1.0 / layer.scale[0]) * (canvas_width / layer_texture_width);   // x-scale
					u_config_1[i * 4 + 1] = (1.0 / layer.scale[1]) * (canvas_height / layer_texture_height); // y-scale
					u_config_1[i * 4 + 2] = (-layer.offset[0] / (layer_texture_width * layer.scale[0]));     // x-offset
					u_config_1[i * 4 + 3] = (layer.offset[1] / (layer_texture_height * layer.scale[1]));     // y-offset
					u_config_2[i * 4 + 0] = layer_texture_width;                                             // layer texture width
					u_config_2[i * 4 + 1] = layer_texture_height;                                            // layer texture height
					u_config_2[i * 4 + 2] = -layer.scroll[0];                                                // layer uv scroll x
					u_config_2[i * 4 + 3] = layer.scroll[1];                                                 // layer uv scroll y
					u_config_3[i * 4 + 0] = layer.repeat[0]? 0 : 1;                                          // layer repeat-x
					u_config_3[i * 4 + 1] = layer.repeat[1]? 0 : 1;                                          // layer repeat-y
					u_config_3[i * 4 + 2] = layer.depth;                                                     // layer depth
					u_config_3[i * 4 + 3] = 0;
				}
				else
				{
					// Need to pass default x/y repeat values to shader for non-existent layers
					u_config_3[i * 4 + 0] = 1; // layer repeat-x
					u_config_3[i * 4 + 1] = 1; // layer repeat-y
				}
			}

			// Always draw on top
			Engine.Gfx.EnableDepthTest(false);

			// Draw layers?
			if(this.layers.length > 0)
			{
				Engine.Gfx.BindShaderProgram(this.program);

				// Bind background data
				var bg_colour = this.colour? this.colour : Engine.Colour.Black;
				Engine.Gfx.SetShaderConstant("u_background_color", bg_colour, Engine.Gfx.SC_VEC4);
				Engine.Gfx.SetShaderConstant("u_time", info.elapsed_s, Engine.Gfx.SC_FLOAT);

				// Bind per-layer textures
				Engine.Gfx.BindTextureArray(u_textures, "u_layer_tx");

				// Bind packed per-layer data
				Engine.Gfx.SetShaderConstant("u_layer_config_1", u_config_1, Engine.Gfx.SC_VEC4_ARRAY);
				Engine.Gfx.SetShaderConstant("u_layer_config_2", u_config_2, Engine.Gfx.SC_VEC4_ARRAY);
				Engine.Gfx.SetShaderConstant("u_layer_config_3", u_config_3, Engine.Gfx.SC_VEC4_ARRAY);

				// Draw all layers in single pass
				Engine.Gfx.DrawQuad();
			}
			else
			{
				Engine.Gfx.Clear(this.colour? this.colour : Engine.Colour.Black);
			}
		};
	},

	Sprite : function()
	{
		this.name = "";
		this.origin = [0, 0];
		this.textures  = {};
		this.sequences = {};
		this.collision_shapes = [];
		this.sequence_has_finished = false;

		// For update
		this.requires_update = false;
		this.active_sequence = null;
		this.anim_time = 0.0;

		// For rendering
		this.active_texture = null;
		this.current_anim_frame = 0;
		this.mirror = [0, 0];

		this.SetOrigin = function(origin)
		{
			this.origin[0] = origin[0];
			this.origin[1] = origin[1];
		};

		this.SetSpeed = function(speed)
		{
			this.anim_frame_length = 1 / speed;
		};

		this.SetSequence = function(sequence_name)
		{
			if(sequence_name in this.sequences)
			{
				var sequence = this.sequences[sequence_name];
				this.active_sequence = sequence;
				this.active_texture = sequence.texture;
				this.mirror = this.active_sequence.mirror;

				// Calculate frame duration and reset animation
				this.anim_frame_length = (sequence.speed == 0)? 1 : 1 / sequence.speed;
				this.anim_time = 0;

				// Calculate start, end and max frame indices (linear, left-to-right)
				this.anim_start_frame_index = (sequence.begin[0] * sequence.texture.descriptor.cols) + sequence.begin[1];
				this.anim_end_frame_index   = (  sequence.end[0] * sequence.texture.descriptor.cols) + sequence.end[1];
				this.anim_max_frame_index   = sequence.texture.descriptor.rows * sequence.texture.descriptor.cols;
				this.current_anim_frame = this.anim_start_frame_index; // Begin at first frame incase we set requires_update = false

				// Calculate how many frames belong to this sequence
				var wrap_around = this.anim_start_frame_index > this.anim_end_frame_index;
				this.anim_frame_count = wrap_around? (this.anim_max_frame_index + this.anim_start_frame_index) - this.anim_end_frame_index :
				                                      this.anim_end_frame_index - this.anim_start_frame_index;

				// Will the sprite need updating?
				this.requires_update = (this.active_sequence.speed != 0 && this.anim_frame_count != 0);
				this.sequence_has_finished = false;
			}
			else
			{
				Engine.LogError("Invalid sprite sequence name '" + sequence_name + "'");
			}
		};

		this.Update = function(info)
		{
			if(!this.requires_update)
				return;

			// Progress anim time and calculate which frame to display
			this.anim_time += info.delta_s;
			var current_frame = Math.floor(this.anim_time / this.anim_frame_length);

			// Deal with animation loop / end
			if(current_frame >= this.anim_frame_count)
			{
				if(this.active_sequence.loop)
				{
					current_frame = current_frame % (this.anim_frame_count + 1);
				}
				else
				{
					current_frame = this.anim_frame_count;
					this.requires_update = false;
					this.sequence_has_finished = true;
				}
			}

			// Offset current_frame from anim start frame
			this.current_anim_frame = (this.anim_start_frame_index + current_frame) % this.anim_max_frame_index;
		};

		this.GetSequenceName = function()
		{
			return this.active_sequence.name;
		};

		this.SequenceHasFinished = function()
		{
			return this.sequence_has_finished;
		};

		this.SetMirror = function(horizontal, vertical)
		{
			this.mirror[0] = horizontal? 1 : 0;
			this.mirror[1] = vertical?   1 : 0;
		}
	},
};

// *************************************************************************************
// Background resource loading
Engine.Resource.RegisterLoadFunction("background", function(descriptor, callback)
{
	Engine.Net.FetchResource(descriptor.file, function(background_json)
	{
		var json = jQuery.parseJSON(background_json);
		var background_object = new Engine.Game2D.Background();
		$.extend(background_object, json);

		// Load in textures
		Engine.Resource.LoadBatch(background_object.textures, function()
		{
			// Validate background
			var layer_count = background_object.layers.length;
			if(background_object.layers.length > background_object.MAX_LAYERS)
			{
				Engine.LogError("Background '" + descriptor.file +
				                "' exceeds maximum layer count of " + background_object.MAX_LAYERS);
				return;
			}

			// Process layers
			for(var i = 0; i < layer_count; ++i)
			{
				Engine.Log("    Validating background layer " + i);
				var layer = background_object.layers[i];

				// Hookup texture references
				if(layer.texture in background_object.textures)
				{
					layer.texture = background_object.textures[layer.texture];
				}
				else
				{
					// Broken reference
					var msg = "    Unknown texture '" + layer.texture +
					          "' referenced in background '" + descriptor.file + "' layer " + i;
					Engine.LogError(msg);
				}
			}

			callback(background_object);
		});
	});
});

// *************************************************************************************
// Sprite resource loading
Engine.Resource.RegisterLoadFunction("sprite", function(descriptor, callback)
{
	Engine.Net.FetchResource(descriptor.file, function(sprite_json)
	{
		var json = jQuery.parseJSON(sprite_json);
		var sprite_object = new Engine.Game2D.Sprite();
		$.extend(sprite_object, json);

		// Load in textures
		Engine.Resource.LoadBatch(sprite_object.textures, function()
		{
			// Validate textures (make sure all tile sizes match)
			var first_texture = Engine.Array.GetFirstValue(sprite_object.textures);
			var first_tile_size = [ first_texture.width  / first_texture.descriptor.cols,
				                    first_texture.height / first_texture.descriptor.rows];
			for(var texture_name in sprite_object.textures)
			{
				Engine.Log("    Validating texture: " + texture_name);
				var texture = sprite_object.textures[texture_name];
				if((texture.width / texture.descriptor.cols)  != first_tile_size[0] ||
				   (texture.height / texture.descriptor.rows) != first_tile_size[1])
				{
					var msg = "    Tiles sizes in " + texture_name + " are non-uniform, should be [";
						msg += first_tile_size[0] + ", " + first_tile_size[1] + "]";
					Engine.Log(msg);
				}
			}

			// Process sequences
			for(var sequence_name in sprite_object.sequences)
			{
				var sequence = sprite_object.sequences[sequence_name];
				sequence.name = sequence_name; // Add key-name as member
				Engine.Log("    Validating sprite sequence: " + sequence.name);

				// Hookup texture references
				if(sequence.texture in sprite_object.textures)
				{
					sequence.texture = sprite_object.textures[sequence.texture];
				}
				else
				{
					// Broken reference
					var msg = "    Unknown texture '" + sequence.texture +
					          "' referenced in sprite sequence '" + sequence_name + "'";
					Engine.LogError(msg);
				}

				// Set first sequence as active
				if(!sprite_object.active_sequence)
				{
					sprite_object.SetSequence(sequence_name);
				}
			}

			callback(sprite_object);
		});
	});
});