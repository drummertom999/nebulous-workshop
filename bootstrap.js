Resources =
{
	// Backgrounds
	bg_space           : { file : "backgrounds/space.background" },

	// Sprites
	spr_ship           : { file : "sprites/ship.sprite"          },
	spr_bullet         : { file : "sprites/bullet.sprite"        },
	spr_asteroid       : { file : "sprites/asteroid.sprite"      },

	// Sound effects
	sfx_explosion      : { file : "sfx/explosion.mp3"            },
	sfx_lazer_1        : { file : "sfx/lazer_1.mp3"              },
	sfx_lazer_2        : { file : "sfx/lazer_2.mp3"              },
	sfx_no_ammo        : { file : "sfx/no_ammo.mp3"              },
	sfx_asteroid_hit   : { file : "sfx/asteroid_hit.mp3"         },
	sfx_ammo_pickup    : { file : "sfx/ammo_pickup.mp3"          },
	sfx_shield_pickup  : { file : "sfx/shield_pickup.mp3"        },
	sfx_bounce         : { file : "sfx/bounce.mp3"               },

	// Fonts
	fnt_homenaje       : { file : "fonts/homenaje.css"           }
};

var g_info = null;

Scene = function()
{
	$.extend(this, new Engine.Game2D.Scene(Resources["bg_space"]));
};

Entity = function(sprite_name)
{
	$.extend(this, new Engine.Game2D.Entity(Resources[sprite_name]));
	if(sprite_name == "spr_ship")
	{
		this.SetDepth(-1);
	}
};

var g_using_input = false;
function KeyPressed(key)
{
	g_using_input = true;
	var is_tap = (key == "space");
	return Engine.Keyboard.IsPressed(key, true) || (is_tap && ship && ship.IsTapped());
}

function KeyHeld(key)
{
	g_using_input = true;
	var is_tap = (key == "space");
	return Engine.Keyboard.IsPressed(key) || (is_tap && ship && ship.IsTapped());
}

function Touched()
{
	return Engine.Touch.IsPressed();
}

function Tapped()
{
	return Engine.Touch.IsTapped();
}

function GetFingerX()
{
	return Engine.Touch.GetPosition()[0];
}

function Chance(chance)
{
	return Engine.Math.RandomInteger(0, chance) == 0;
}

function GetWidth()
{
	return Engine.Canvas.GetWidth();
}

function GetHeight()
{
	return Engine.Canvas.GetHeight();
}

function Random(x, y)
{
	return Engine.Math.RandomInteger(x, y);
}

function Draw(scene)
{
	scene.Render(g_info);
}

var text_boxes = {}; // Name --> Engine.Text2D.TextBox map
function DrawText(name, value)
{
	if(name in text_boxes)
	{
		text_boxes[name].Set(value);
		text_boxes[name].UpdateCSSPosition();
	}
	else
	{
		text_boxes[name] = new Engine.Text2D.TextBox(value,
		{
			prefix   : name + ": ",
			position : [10, GetHeight() - 60 - (50 * Object.keys(text_boxes).length)],
			size     : 50,
			colour   : "#48CAFF",
			css      : "font-family: Homenaje ;line-height: 1em;color: #ffbf00;font-size: 79px;text-shadow:0px 0px 0 #39a2cc,1px 1px 0 #2d82a3,2px 2px 0 #20607a,3px 3px 0 #144254,4px 4px 0 #0d2c38, 5px 5px 0 #0d2c38,6px 6px 5px rgba(0,0,0,0.25)}"
		});
	}
}

function HelperInit()
{
	$("#loader").hide();

	// Make sure canvas is visible and sized correctly
	Engine.Canvas.Show();
	if(!Engine.Device.IsMobile())
	{
		Engine.Device.SetAspectRatio(g_aspect_ratio);
	}
	Engine.Device.Maximise();

	Init(); // game.js init
}

function HelperUpdate(info)
{
	g_info = info;
	if(typeof scene !== 'undefined')
	{
		// Remove off-screen asteroids
		var asteroids = scene.FindByTag("asteroid");
		for(var i = 0; i < asteroids.length; ++i)
		{
			var asteroid = asteroids[i];
			if(asteroid.GetY() < -(asteroid.GetSize() / 2))
			{
				scene.Remove(asteroid);
			}
		}

		// Remove off-screen bullets
		var bullets = scene.FindByTag("bullet");
		for(var i = 0; i < bullets.length; ++i)
		{
			var bullet = bullets[i];
			if(bullet.GetY() > GetHeight() + (bullet.GetSize() / 2))
			{
				scene.Remove(bullet);
			}
		}

		// If we detect they have setup input handling, automatically position the ship on touch devices
		if(typeof ship !== 'undefined' && g_using_input && Engine.Touch.IsPressed())
		{
			ship.MoveTo([GetFingerX(), ship.GetY()]);
		}
	}
	Update(); // game.js update
}