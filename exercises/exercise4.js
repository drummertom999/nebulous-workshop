var scene = 0;
var ship = 0;

function Init()
{
	// Create the scene
	scene = new Scene();
	ship = new Entity("spr_ship");

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

	// Draw the scene
	Draw(scene);
}