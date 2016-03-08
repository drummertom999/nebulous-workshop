// *******************************************
//# sourceURL=modules/enginejs-net.js
// *******************************************

Engine.Net =
{
	FetchResource : function(resource_url, callback)
	{
		callback = callback || false;
		jQuery.ajax(
		{
			url     : resource_url + "?foo=" + Engine.Time.Now(),
			async   : callback,
			cache   : false,
			success : function(data)
			{
				if(callback) { callback(data); }
			},
			error   : function(err)
			{
				Engine.LogError("Failed fetching resource: " + resource_url);
			}
		});
	},

	FetchBinaryResource : function(resource_url, callback)
	{
		// No support for binary ajax calls in jQuery, using XHTML Request Level 2 instead
		// see: http://bugs.jquery.com/ticket/11461
		callback = callback || false;
		var xhr = new XMLHttpRequest();
		var no_cache = "?timestamp=" + new Date().getTime();
		xhr.open("GET", resource_url + no_cache, true);
		xhr.responseType = 'arraybuffer';
		xhr.onload = function(e)
		{
			if(this.status == 200)
			{
				if(callback) { callback(xhr.response); }
			}
			else
			{
				Engine.LogError("Failed fetching resource: " + resource_url);
			}
		};
		xhr.send();
	}
};