// *******************************************
//# sourceURL=modules/enginejs-gamepad.js
// *******************************************

Engine.GamepadButtonNameMap =
{
	"a"    : 0, "b"      : 1,  // Main AB buttons
	"x"    : 2, "y"      : 3,  // Main XY buttons
	"lb"   : 4, "rb"     : 5,  // Bumpers
	"lt"   : 6, "rt"     : 7,  // Triggers
	"back" : 8, "start"  : 9,  // Back/Start (Share/Options on DualShock4)
	"l3"   : 10, "r3"    : 11, // Analogue stick presses
	"up"   : 12, "down"  : 13, // D-pad Y
	"left" : 14, "right" : 15, // D-pad X
};

Engine.Gamepad =
{
	Pads : [], // Array of PadInstance objects

	Update : function()
	{
		// Grab raw gamepads
		var raw_gamepads = navigator.getGamepads ? navigator.getGamepads() :
		              (navigator.webkitGetGamepads ? navigator.webkitGetGamepads : []);

		// Process raw gamepads
		for(var i = 0; i < raw_gamepads.length; ++i)
		{
			var raw_gamepad = raw_gamepads[i];
			if(!raw_gamepad) { continue; }
			var existing = Engine.Array.Find(Engine.Gamepad.Pads, function(pad)
			{
				return (pad.GetIndex() == raw_gamepad.index);
			});

			if(!existing)
			{
				// Add new pad
				Engine.Log("Adding connected gamepad " + raw_gamepad.index + " " + raw_gamepad.id);
				existing = new Engine.Gamepad.PadInstance();
				Engine.Gamepad.Pads.push(existing);
			}

			// Copy gamepad snapshot into our own structure
			// NOTE: Have to do this because on firefox, button array is live data
			//       from pad rather than a snapshot of the gamepad state
			var gamepad_snapshot = { index : raw_gamepad.index, id : raw_gamepad.id, axes : raw_gamepad.axes, buttons : { } };
			for (var button_name in Engine.GamepadButtonNameMap)
			{
				var button_index = Engine.GamepadButtonNameMap[button_name];
				gamepad_snapshot.buttons[button_name] = raw_gamepad.buttons[button_index].pressed;
			}
			existing.Update(gamepad_snapshot);
		}

		// Remove disconnected pads
		Engine.Gamepad.Pads = Engine.Array.Filter(Engine.Gamepad.Pads, function(pad)
		{
			var is_attached = function(raw_gamepad) { return raw_gamepad && raw_gamepad.index == pad.GetIndex(); };
			if(Engine.Array.Find(raw_gamepads, is_attached)) { return true; }
			Engine.Log("Removing disconnected gamepad " + pad.GetIndex() + " " + pad.GetID());
			return false;
		});
	},

	// Pad object
	PadInstance : function()
	{
		this.gamepad_prev_frame = null; // Double-buffered
		this.gamepad_this_frame = null; // Double-buffered
		this.analogue_deadzone  = 0.26;

		this.Update = function(gamepad_snapshot)
		{
			// Swap gamepad snapshot buffers
			this.gamepad_prev_frame = this.gamepad_this_frame? Engine.Util.Clone(this.gamepad_this_frame) : null;
			this.gamepad_this_frame = Engine.Util.Clone(gamepad_snapshot);
		};

		this.IsPressed = function(button_name_or_list, debounce)
		{
			// 'button_name_or_list' could be single value or list of buttons to check, either
			// way we want a list (even if it only has a single button name entry)
			var button_names = Engine.Util.IsArray(button_name_or_list)? button_name_or_list :
			                                                           [ button_name_or_list ];

			var pressed_this_frame = this.gamepad_this_frame.buttons;
			var pressed_prev_frame = this.gamepad_prev_frame? this.gamepad_prev_frame.buttons : null;
			for(var i = 0; i < button_names.length; ++i)
			{
				var button_name = button_names[i];

				// Handle debounce on first ever frame
				if(!pressed_prev_frame && pressed_this_frame[button_name])
					return true;

				var just_pressed = pressed_this_frame[button_name] && !pressed_prev_frame[button_name];
				if(debounce && just_pressed || !debounce && pressed_this_frame[button_name])
					return true;
			}
		};

		this.IsReleased = function(button_name_or_list, debounce)
		{
			// 'button_name_or_list' could be single value or list of buttons to check, either
			// way we want a list (even if it only has a single button name entry)
			var button_names = Engine.Util.IsArray(button_name_or_list)? button_name_or_list :
			                                                           [ button_name_or_list ];

			var pressed_this_frame = this.gamepad_this_frame.buttons;
			var pressed_prev_frame = this.gamepad_prev_frame? this.gamepad_prev_frame.buttons : null;
			for(var i = 0; i < button_names.length; ++i)
			{
				var button_name = button_names[i];

				// Handle debounce on first ever frame
				if(!pressed_prev_frame)
					return false;

				var just_released = !pressed_this_frame[button_name] && pressed_prev_frame[button_name];
				if(debounce && just_released || !debounce && !pressed_this_frame[button_name])
					return true;
			}
		};

		this.GetLeftStick = function()
		{
			var gamepad_data = this.gamepad_this_frame;
			var axes_data = [gamepad_data.axes[0], -gamepad_data.axes[1]];
			var dist_from_centre = Engine.Vec2.Length(axes_data);
			return (dist_from_centre <= this.analogue_deadzone)? [0, 0] : axes_data;
		};

		this.GetRightStick = function()
		{
			var gamepad_data = this.gamepad_this_frame;
			var axes_data = [gamepad_data.axes[2], -gamepad_data.axes[3]];
			var dist_from_centre = Engine.Vec2.Length(axes_data);
			return (dist_from_centre <= this.analogue_deadzone)? [0, 0] : axes_data;
		};

		this.GetID = function()
		{
			return this.gamepad_this_frame.id;
		};

		this.GetIndex = function()
		{
			return this.gamepad_this_frame.index;
		};
	}
};