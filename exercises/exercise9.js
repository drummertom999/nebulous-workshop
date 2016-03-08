var scene = 0;
var ship = 0;
var score = 0;

function Init()
{
	// Create the scene
	scene = new Scene();
	ship = new Entity("spr_ship");
	ship.SetTag("ship");

	// Move the ship into position
	ship.MoveTo([200, 80]);

	// Add our ship to the scene
	scene.Add(ship);
}

function Update()
{
	// Move the ship left if the player presses the left arrow key
	if(KeyHeld("left"))
	{
		ship.Move([-5, 0]);
	}

	// Move the ship right if the player presses the right arrow key
	if(KeyHeld("right"))
	{
		ship.Move([5, 0]);
	}

	// Shoot a bullet if the player presses the space bar
	if(KeyPressed("space"))
	{
		var bullet = new Entity("spr_bullet");
		var ship_position = ship.GetPosition();
		bullet.MoveTo(ship_position);
		bullet.SetVelocity([0, 400]);
		bullet.SetTag("bullet");
		scene.Add(bullet);
	}

	// Spawn asteroids
	if(Chance(100))
	{
		var asteroid = new Entity("spr_asteroid");
		var x = Random(0, GetWidth());
		var y = GetHeight() + 100;
		asteroid.MoveTo([x, y]);
		asteroid.SetVelocity([0, -200]);
		asteroid.SetTag("asteroid");
		scene.Add(asteroid);
	}

	// Detect collisions between bullets and asteroids
	var results = scene.HitTest("bullet", "asteroid");
	if(results.length > 0)
	{
		// Destroy bullet and asteroid and icnrease score
		scene.Remove(results);
		score = score + 10;
	}

	// Detect asteroids which hit the ship
	var results = scene.HitTest("ship", "asteroid");
	if(results.length > 0)
	{
		// Remove ship (and colliding asteroid) from scene
		alert("Game Over");
		scene.Remove(results);
	}

	// Draw health and score on screen
	DrawText("Score", score);

	// Draw the scene
	Draw(scene);
}