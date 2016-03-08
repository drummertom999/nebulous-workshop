function ExecuteAsyncJobQueue(queue)
{
	var current_job = 0;
	var process_next_job = function()
	{
		var job = queue.jobs[current_job];
		job.first(function(arg)
		{
			var carry_on = true;
			if(job.then)  { carry_on = job.then(arg); }                          // Then
			if(carry_on != undefined && !carry_on) { queue.finally(0); return; } // Fail?
			(++current_job < queue.jobs.length)? process_next_job() :            // Next job?
			                                     queue.finally(1);               // Complete!
		});
	};
	process_next_job(); // Begin processing jobs
}

function ExecuteAsyncLoop(array, func, on_complete)
{
	var current_element = 0;
	var process_next_element = function()
	{
		var element = array[current_element];
		func(element, function(carry_on)
		{
			// Break out of loop on fail
			if(!carry_on) { on_complete(false); return; }

			(++current_element < array.length)? process_next_element() : // Next element?
			                                    on_complete(true);       // Complete!
		});
	};
	process_next_element(); // Begin processing elements
}

function ExecuteAsyncLoopProps(obj, func, on_complete)
{
	var current_property = 0;
	var property_count = Object.keys(obj).length;
	var process_next_property = function()
	{
		var prop_key = Object.keys(obj)[current_property];
		var prop_val = obj[prop_key];
		func(prop_key, prop_val, function(carry_on)
		{
			// Break out of loop on fail
			if(!carry_on) { on_complete(false); return; }

			(++current_property < property_count)? process_next_property() : // Next property?
			                                       on_complete(true);        // Complete!
		});
	};
	process_next_property(); // Begin processing object properties
}