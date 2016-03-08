// *******************************************
//# sourceURL=modules/enginejs-text-2d.js
// *******************************************

Engine.Text2D =
{
	instances        : [],
	CachedCanvasData :
	{
		centre : [], size : [],
		left : 0, bottom :0,
		Synch : function()
		{
			var need_sync = this.centre[0] != Engine.Canvas.GetCentre()[0] ||
			                this.centre[1] != Engine.Canvas.GetCentre()[1] ||
			                this.size[0]   != Engine.Canvas.GetSize()[0]   ||
			                this.size[1]   != Engine.Canvas.GetSize()[1]   ||
			                this.left      != Engine.Canvas.getBoundingClientRect().left ||
			                this.bottom    != Engine.Canvas.getBoundingClientRect().bottom;
			if(need_sync)
			{
				this.centre = Engine.Array.Copy(Engine.Canvas.GetCentre());
				this.size   = Engine.Array.Copy(Engine.Canvas.GetSize());
				this.left   = Engine.Canvas.getBoundingClientRect().left;
				this.bottom = Engine.Canvas.getBoundingClientRect().bottom;
			}

			return need_sync;
		}
	},

	Init : function()
	{
		Engine.Text2D.CachedCanvasData.Synch();
	},

	Update : function()
	{
		var canvas_changed = Engine.Text2D.CachedCanvasData.Synch();
		for(var i = 0; i < Engine.Text2D.instances.length; ++i)
		{
			var instance = Engine.Text2D.instances[i];
			if(canvas_changed || instance.RequiresUpdate())
			{
				instance.UpdateCSSPosition();
			}
		}
	},

	RegisterTextBox : function(instance)
	{
		Engine.Text2D.instances.push(instance);
	},

	TextBox : function(text, config)
	{
		// Setup defaults
		this.position   = [0, 0];
		this.dock       = ["none", "none"];
		this.padding    = 20;
		this.text       = "";
		this.size       = 30;
		this.colour     = "black";
		this.background = "none";
		this.css        = "";
		this.prefix     = "";
		this.div        = $("<div />").appendTo("body");

		// Apply any user overrides
		$.extend(this, config);

		this.MoveTo = function(position)
		{
			this.position = position;
			this.UpdateCSSPosition();
		};

		this.Move = function(delta)
		{
			this.position[0] += delta[0];
			this.position[1] += delta[1];
			this.UpdateCSSPosition();
		};

		this.Set = function(text)
		{
			// No point updating DOM if no change
			if(text === this.text) return;

			this.text = text;
			this.div.html(this.prefix + this.text);
		};

		this.Append = function(text)
		{
			this.text += text;
			this.div.html(this.prefix + this.text);
		};

		this.SetSize = function(size)
		{
			this.size = size;
			this.UpdateCSSSize();
		}

		this.SetColour = function(foreground_colour, background_colour)
		{
			this.colour = foreground_colour;
			if(background_colour)
			{
				this.background = background_colour;
			}
			this.UpdateCSSColour();
		};

		this.SetCSS = function(user_css)
		{
			this.css = user_css;
			this.UpdateCSSUser();
		};

		this.UpdateCSSUser = function()
		{
			var base_css = "position             : absolute;\
			                user-select          : none;\
			                cursor               : default;\
			                font-weight          : bold;\
			               -webkit-touch-callout : none;\
			               -webkit-user-select   : none;\
			               -khtml-user-select    : none;\
			               -moz-user-select      : none;\
			               -ms-user-select       : none;";
			this.div.attr("style", base_css + this.css);

			// Override base & user css with properties
			this.UpdateCSSSize();
			this.UpdateCSSColour();
			this.UpdateCSSPosition();
		};

		this.UpdateCSSPosition = function(cached_canvas_data)
		{
			// Grab cached canvas data
			var ccd = Engine.Text2D.CachedCanvasData;

			// Use absolute position
			var x = ccd.left + this.position[0];
			var y = ccd.bottom - this.div.height() - this.position[1];

			// Apply vertical docking?
			switch(this.dock[0])
			{
				case "top":
					y = ccd.bottom - ccd.size[1] + this.padding;
					break;
				case "middle":
				case "centre":
				case "center":
					y = ccd.bottom - (ccd.size[1] / 2) - (this.div.height() / 2);
					break;
				case "bottom":
					y = ccd.bottom - this.div.height() - this.padding;
					break;
			}

			// Apply horizontal docking?
			switch(this.dock[1])
			{
				case "left":
					x = ccd.left + this.padding;
					break;
				case "middle":
				case "centre":
				case "center":
					x = ccd.left + (ccd.size[0] / 2) - (this.div.width() / 2);
					break;
				case "right":
					x = ccd.left + ccd.size[0] - this.div.width() - this.padding;
					break;
			}

			// Cache off width and height
			this.cached_width = this.div.width();
			this.cached_height = this.div.height();

			// Update DOM element
			this.div.css("left", x + "px");
			this.div.css("top",  y + "px");
		};

		this.RequiresUpdate = function()
		{
			// We need to update and reposition this text element
			// if the size of the DOM element has changed
			return this.cached_width  != this.div.width() ||
			       this.cached_height != this.div.height();
		};

		this.UpdateCSSSize = function()
		{
			this.div.css("font-size", this.size + "px");
		};

		this.UpdateCSSColour = function()
		{
			this.div.css("color", this.colour);
			this.div.css("background-color", this.background);
		};

		this.Dock = function(vertical, horizontal, padding)
		{
			this.dock = [vertical, horizontal];
			if(padding != undefined) { this.padding = padding; }
			this.UpdateCSSPosition();
		};

		this.Show = function()
		{
			this.div.show();
		};

		this.Hide = function()
		{
			this.div.hide();
		};

		// Setup DOM element
		this.Set(text);
		this.UpdateCSSUser();

		// Forward click events
		// Note: Engine.Mouse can track mouse position when hovered over our div element,
		//       but we must manually forward the press/release events
		this.div[0].onmousedown = function(e) { Engine.Mouse.pressed[2][e.button] = true;  };
		this.div[0].onmouseup   = function(e) { Engine.Mouse.pressed[2][e.button] = false; };

		// Forward touch events
		// Note: Engine.Touch can track touch position when swiping over our div element,
		//       but we must manually forward the press/release events
		this.div[0].addEventListener("touchstart",  Engine.Touch._event_touch_start, false);
		this.div[0].addEventListener("touchend",    Engine.Touch._event_touch_end,   false);
		this.div[0].addEventListener("touchcancel", Engine.Touch._event_touch_end,   false);
		this.div[0].addEventListener("touchleave",  Engine.Touch._event_touch_end,   false);

		// Register this instance
		Engine.Text2D.RegisterTextBox(this);
	}
};

// Init
Engine.Text2D.Init();