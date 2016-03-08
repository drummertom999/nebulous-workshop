// *******************************************
//# sourceURL=modules/enginejs-mouse.js
// *******************************************

Engine.Mouse =
{
	button_names : { "left" : 0, "middle" : 1, "right" : 2 },
	buffer_idx   : 0,                                 // "current" buffer-index
	pressed      : [[0, 0, 0], [0, 0, 0], [0, 0, 0]], // tripple-buffered (L M R)
	position     : [[0, 0], [0, 0], [0, 0]],          // tripple-buffered
	wheel_delta  : [0, 0],                            // double-buffered

	Update : function()
	{
		// Flip buffers
		this.buffer_idx = this.buffer_idx? 0 : 1;
		this.pressed[this.buffer_idx]  = Engine.Array.Copy(this.pressed[2]);
		this.position[this.buffer_idx] = Engine.Array.Copy(this.position[2]);
		this.wheel_delta[0] = this.wheel_delta[1];
		this.wheel_delta[1] = 0;
	},

	IsPressed : function(button_name, debounce)
	{
		button_name = button_name || "left";
		var button_index = this.button_names[button_name];
		var this_buffer = this.pressed[this.buffer_idx];
		var prev_buffer = this.pressed[this.buffer_idx? 0 : 1];
		return debounce? this_buffer[button_index] && !prev_buffer[button_index]:
		                 this_buffer[button_index];
	},

	IsReleased : function(button_name, debounce)
	{
		button_name = button_name || "left";
		var button_index = this.button_names[button_name];
		var this_buffer = this.pressed[this.buffer_idx];
		var prev_buffer = this.pressed[this.buffer_idx? 0 : 1];
		return debounce? !this_buffer[button_index] && prev_buffer[button_index]:
		                 !this_buffer[button_index];
	},

	GetPosition : function()
	{
		return this.position[this.buffer_idx];
	},

	GetX : function()
	{
		return this.GetPosition()[0];
	},

	GetY : function()
	{
		return this.GetPosition()[1];
	},

	GetDelta : function()
	{
		var this_buffer = this.position[this.buffer_idx];
		var prev_buffer = this.position[this.buffer_idx? 0 : 1];
		return [ this_buffer[0] - prev_buffer[0],
		         this_buffer[1] - prev_buffer[1] ];
	},

	GetDeltaX : function()
	{
		return this.GetDelta()[0];
	},

	GetDeltaY : function()
	{
		return this.GetDelta()[1];
	},

	GetWheelDelta : function()
	{
		return this.wheel_delta[0];
	}
};

// *******************************************
// Init
// *******************************************
Engine.Canvas.onmousedown = function(e) { Engine.Mouse.pressed[2][e.button] = true;  };
document.onmouseup        = function(e) { Engine.Mouse.pressed[2][e.button] = false; };
document.onmousemove      = function(e)
{
	Engine.Mouse.position[2] = [e.clientX - Engine.Canvas.getBoundingClientRect().left,
	                           Engine.Canvas.getBoundingClientRect().bottom - e.clientY];
};

// Mouse wheel update
var on_mousewheel = function(e)
{
	var e = window.event || e;
	var delta = e.wheelDelta || (-e.detail * 40);
	Engine.Mouse.wheel_delta[1] = delta;
}

if(document.addEventListener)
{
	document.addEventListener("mousewheel", on_mousewheel, false);
	document.addEventListener("DOMMouseScroll", on_mousewheel, false);
}
else
{
	sq.attachEvent("onmousewheel", on_mousewheel);
}