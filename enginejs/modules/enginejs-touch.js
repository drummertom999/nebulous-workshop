// *******************************************
//# sourceURL=modules/enginejs-touch.js
// *******************************************

Engine.Touch =
{
	streams              : [],   // Event stream per-finger
	just_released        : {},   // Index of stream(s) just released (lifetime = 1 frame)
	is_first_touch       : true, // Flag used to detect first ever touch
	first_touch_handlers : [],   // Collection of registered handler functions for "first-touch" event

	IsEnabled : function()
	{
		var msTouchEnabled = window.navigator.msMaxTouchPoints;
		var generalTouchEnabled = "ontouchstart" in document.createElement("div");
		return (msTouchEnabled || generalTouchEnabled);
	},

	IsPressed : function(index, debounce)
	{
		var i = index || 0;
		var have_stream = Engine.Touch.streams.length > i;
		if(!have_stream) { return false; }
		return debounce? Engine.Array.GetLastValue(Engine.Touch.streams[i]).just_pressed :
		                 true;
	},

	IsReleased : function(index, debounce)
	{
		var i = index || 0;
		var have_stream = Engine.Touch.streams.length > i;
		return debounce? (i in Engine.Touch.just_released) :
		                 !have_stream;
	},

	GetPosition : function(index)
	{
		var i = index || 0;
		if(!Engine.Touch.IsPressed(i)) { return null; }
		return Engine.Array.GetLastValue(Engine.Touch.streams[i]).position;
	},

	GetX : function(index)
	{
		var touch_pos = Engine.Touch.GetPosition();
		return touch_pos? touch_pos[0] : null;
	},

	GetY : function(index)
	{
		var touch_pos = Engine.Touch.GetPosition();
		return touch_pos? touch_pos[1] : null;
	},

	GetOngoingSwipe : function(index)
	{
		var i = index || 0;
		var stream = (Engine.Touch.streams.length > i)? Engine.Touch.streams[i] : 0;
		if(!stream) { return null; }

		// Grab events
		var first_event = stream[0];
		var last_event  = stream[stream.length - 1];

		// Return ongoing swipe info
		var swipe_vector = Engine.Vec2.Subtract(last_event.position, first_event.position);
		var ongoing =
		{
			start_position : first_event.position,
			end_position   : last_event.position,
			vector         : swipe_vector,
			length         : Engine.Vec2.Length(swipe_vector),
			duration       : Engine.Time.Now() - first_event.time,
			first_event    : first_event,
			last_event     : last_event,
		};
		return ongoing;
	},

	IsTapped : function(index, time_threshold, dist_threshold)
	{
		var i = index || 0;
		if(i in Engine.Touch.just_released)
		{
			var time = time_threshold || 100; // ms
			var release_event = Engine.Touch.just_released[i];
			var duration = release_event.time - release_event.stream[0].time;
			if(duration < time)
			{
				var dist = dist_threshold || 50
				var swipe_vector = Engine.Vec2.Subtract(release_event.position, release_event.stream[0].position);
				if(Engine.Vec2.Length(swipe_vector) < dist)
				{
					return release_event;
				}
			}
		}
		return null;
	},

	IsSwiped : function(index, debounce, user_config)
	{
		var swipe = Engine.Touch.GetOngoingSwipe(index);
		if(swipe == null || swipe.first_event.swipe_detected)
		{
			return false;
		}

		// Setup & override defaults?
		var config =
		{
			min_length : 20,
			max_time   : 500,
			tollerance : Math.PI / 3
		};
		$.extend(config, user_config);

		// Swipe match?
		var swipe_angle = Engine.Vec2.AngleBetween(swipe.vector, config.direction);
		var swipe_match = swipe.length   >= config.min_length &&
		                  swipe.duration <= config.max_time &&
		                  swipe_angle    <  config.tollerance;

		// Set detected flag so we don't detect this stream again?
		if(swipe_match && debounce)
		{
			swipe.first_event.swipe_detected = true;
		}

		return swipe_match;
	},

	IsSwipedLeft : function(override_params)
	{
		return Engine.Touch.IsSwiped(0, true, { direction  : [-1, 0, 0] });
	},

	IsSwipedRight : function(override_params)
	{
		return Engine.Touch.IsSwiped(0, true, { direction  : [1, 0, 0] });
	},

	IsSwipedUp : function(override_params)
	{
		return Engine.Touch.IsSwiped(0, true, { direction  : [0, 1, 0] });
	},

	IsSwipedDown : function(override_params)
	{
		return Engine.Touch.IsSwiped(0, true, { direction  : [0, -1, 0] });
	},

	OnFirstTouch : function(handler)
	{
		Engine.Touch.first_touch_handlers.push(handler);
	},

	Update : function()
	{
		// Clear just_pressed flag where set
		for(var i = 0; i < Engine.Touch.streams.length; ++i)
		{
			if(Engine.Touch.streams[i].length > 0)
			{
				Engine.Touch.streams[i][0].just_pressed = false;
			}
		}

		// Clear out release events
		Engine.Touch.just_released = {};
	},

	// Internal event handling
	_event_touch_start : function(e)
	{
		e.preventDefault();
		var touches = e.changedTouches;
		for(var i = 0; i < touches.length; ++i)
		{
			var touch = touches[i];
			Engine.Touch._event_register(touch, true);
		}
	},

	_event_touch_move : function(e)
	{
		e.preventDefault();
		var touches = e.changedTouches;
		for(var i = 0; i < touches.length; ++i)
		{
			var touch = touches[i];
			Engine.Touch._event_register(touch, false);
		}
	},

	_event_touch_end : function(e)
	{
		e.preventDefault();
		var touches = e.changedTouches;
		for(var i = 0; i < touches.length; ++i)
		{
			var touch = touches[i];
			for(var i = 0; i < Engine.Touch.streams.length; ++i)
			{
				var stream = Engine.Touch.streams[i];
				if(stream.length && stream[0].identifier == touch.identifier)
				{
					// Create a release event containing stream (lasts one more frame)
					Engine.Touch.just_released[i] =
					{
						stream   : stream,
						time     : Engine.Time.Now(),
						position : Engine.Touch._canvas_position_from_touch(touch)
					};

					// Remove stream
					Engine.Touch.streams.splice(i, 1);
					break;
				}
			}
		}
	},

	_event_register : function(touch)
	{
		if(Engine.Touch.streams.length == 2) { return; } // Only support 2 fingers

		if(Engine.Touch.is_first_touch)
		{
			// If first ever touch, fire any "first touch" callbacks registered with this module
			Engine.Touch.is_first_touch = false;
			for(var i = 0; i < Engine.Touch.first_touch_handlers.length; ++i)
			{
				// Fire user callback
				Engine.Touch.first_touch_handlers[i](touch);
			}
		}

		var touch_event =
		{
			identifier     : touch.identifier,
			time           : Engine.Time.Now(),
			position       : Engine.Touch._canvas_position_from_touch(touch),
			just_pressed   : false,
			swipe_detected : false
		};

		// Find existing stream
		var existing_stream = null;
		for(var i = 0; i != Engine.Touch.streams.length; ++i)
		{
			if(Engine.Touch.streams[i].length && Engine.Touch.streams[i][0].identifier == touch.identifier)
			{
				existing_stream = i;
				break;
			}
		};

		// Update / insert stream
		if(existing_stream != null)
		{
			Engine.Touch.streams[existing_stream].push(touch_event);
		}
		else
		{
			touch_event.just_pressed = true;
			Engine.Touch.streams.push([touch_event]);
		}
	},

	_canvas_position_from_touch : function(touch)
	{
		return [ touch.pageX - Engine.Canvas.getBoundingClientRect().left,
		         Engine.Canvas.getBoundingClientRect().bottom - touch.pageY ];
	}
};

// Register canvas touch events
Engine.Canvas.addEventListener("touchstart",  Engine.Touch._event_touch_start, false);
Engine.Canvas.addEventListener("touchmove",   Engine.Touch._event_touch_move,  false);
Engine.Canvas.addEventListener("touchend",    Engine.Touch._event_touch_end,   false);
Engine.Canvas.addEventListener("touchcancel", Engine.Touch._event_touch_end,   false);
Engine.Canvas.addEventListener("touchleave",  Engine.Touch._event_touch_end,   false);