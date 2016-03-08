// *******************************************
//# sourceURL=modules/enginejs-array.js
// *******************************************

Engine.Array =
{
	Copy : function(array)
	{
		return array.slice(0);
	},

	GetFirstValue : function(array)
	{
		return array[Object.keys(array)[0]];
	},

	GetLastValue : function(array)
	{
		return array[array.length - 1];
	},

	Find : function(array, predicate)
	{
		for(var i = 0; i < array.length; ++i)
		{
			if(predicate(array[i]))
				return array[i];
		}
		return null;
	},

	Filter : function(array, predicate)
	{
		var filtered = [];
		for(var i = 0; i < array.length; ++i)
		{
			if(predicate(array[i]))
				filtered.push(array[i]);
		}
		return filtered;
	},

	Clear : function(array)
	{
		while(array.length > 0)
		{
			array.pop();
		}
	},

	RemoveItem : function(array, item)
	{
		var item_index = array.indexOf(item);
		if(item_index != -1)
		{
			array.splice(item_index, 1);
		}
	}
};