// Dependencies
var path          = require('path')
var http          = require('http');
var final_handler = require('finalhandler');
var serve_static  = require('serve-static');
var os            = require('os');

// Config
var port = 1234;
var game_root = process.argv[2] || process.cwd();
var enginejs_root = path.join(game_root, "enginejs");

// Helper
function GetLocalIPAddress()
{
	var ifaces = os.networkInterfaces(); var ip_address = "";
	Object.keys(ifaces).forEach(function(ifname)
	{
		ifaces[ifname].forEach(function(iface)
		{
			if ('IPv4' !== iface.family || iface.internal !== false)
				return; // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
			ip_address = iface.address;
		});
	});
	return ip_address;
}

// Setup Webserver
var serve = serve_static(game_root);
var server = http.createServer(function(req, res)
{
	if(req.url == "/") { req.url = "/index.htm"; }
	var done = final_handler(req, res);
	serve(req, res, done);
});

// Show splash screen
console.log("==============================================================================");
console.log("                     _____         _            __ _____                      ");
console.log("                    |   __|___ ___|_|___ ___ __|  |   __|                     ");
console.log("                    |   __|   | . | |   | -_|  |  |__   |                     ");
console.log("                    |_____|_|_|_  |_|_|_|___|_____|_____|                     ");
console.log("                              |___|                                           ");
console.log("                                                                              ");
console.log("==============================================================================");
console.log("                            Development Server V1                             ");
console.log("==============================================================================");
console.log(" EngineJS root : " + enginejs_root);
console.log("     Game root : " + game_root);
console.log("   Server root : " + game_root);
console.log("          Port : " + port);
console.log("    Device URL : " + "http://" + GetLocalIPAddress() + ":" + port);
console.log("==============================================================================");

// Start Webserver
server.listen(port);