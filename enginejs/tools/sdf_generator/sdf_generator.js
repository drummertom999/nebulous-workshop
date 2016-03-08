var PNG = require('pngjs').PNG;
var fs = require('fs');
var spread = 10;
var max_spread = Math.sqrt((spread * spread) + (spread * spread));

var path = process.argv[2];
console.log("Loading " + path);
var src = fs.createReadStream(path);

// Setup image objects
var input_image  = new PNG();
var output_image = null;

function GetPixelState(x, y)
{
	if(x < 0 || x >= input_image.width || y < 0 || y >= input_image.height)
		return 0; // Outside image

	var offset = (input_image.width * y + x) << 2;
	var red = input_image.data[offset];

	// Make sure this is a binary pixel
	var state = (red == 0)? 0 : ((red == 255)? 1 : null);
	if(state == null)
	{
		console.log("Non-binary pixel value found @ " + x + ", " + y);
		process.exit(1);
	}
	return state;
}

input_image.on('parsed', function()
{
	var width  = input_image.width;
	var height = input_image.height;
	output_image = new PNG({ width: width, height: height });

	for (var y = 0; y < height; y++)
	{
		console.log("row " + y);
		for (var x = 0; x < width; x++)
		{
			var offset = (input_image.width * y + x) << 2;
			var state = GetPixelState(x, y);
			var dist = max_spread;

			//console.log("check = " + x + ", " + y);
			for(var i = 1; i <= spread; ++i)
			{
				for(var y_sample = -i; y_sample <= i; ++y_sample)
				{
					for(var x_sample = -i; x_sample <= i; ++x_sample)
					{
						if(x_sample == -i || x_sample == i ||
						   y_sample == -i || y_sample == i)
						{
							// Only process spread kernel perimeter
							var other_state = GetPixelState(x + x_sample, y + y_sample);
							if(other_state != state)
							{
								// Found
								dist = Math.min(dist, Math.sqrt((Math.abs(x_sample) * Math.abs(x_sample)) + (Math.abs(y_sample) * Math.abs(y_sample))));
								//console.log("dist = " + dist + ", x_sample = " + x_sample + ", y_sample = " + y_sample);
								//i = spread + 1; // Break outer loop
							}
						}
					}
				}
			}


			// Put dist in range 0 --> 1 based on spread
			dist /= max_spread;
			if(state == 0) { dist = -dist; }
			dist = (dist + 1) / 2;

			//console.log("fdist = " + dist);
			var rgb = Math.floor(dist * 255);
			//console.log("rgb = " + rgb);

			output_image.data[offset] = rgb;
			output_image.data[offset+1] = rgb;
			output_image.data[offset+2] = rgb;
			output_image.data[offset+3] = 255;
		}
	}

	// console.log("width = " + width);
	// console.log("height = " + height);
	output_image.pack().pipe(fs.createWriteStream(process.argv[3]));
});

console.log("Piping");
src.pipe(input_image);