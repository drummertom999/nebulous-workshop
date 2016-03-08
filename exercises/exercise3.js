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
	// Draw the scene
	Draw(scene);
}