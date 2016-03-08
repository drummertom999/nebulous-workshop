// *******************************************
//# sourceURL=modules/enginejs-util.js
// *******************************************

Engine.Util =
{
	MD5 : function(data)
	{
		return HashCode.value(data);
	},

	Clone : function(obj)
	{
		var copiedObject = { };
		jQuery.extend(copiedObject, obj);
		return copiedObject;
	},

	IsFunction : function(obj)
	{
		var getType = { };
		return obj && getType.toString.call(obj) === '[object Function]';
	},

	IsArray : function(obj)
	{
		return (obj.constructor === Array);
	},

	IsString : function(obj)
	{
		return typeof obj == 'string' || obj instanceof String;
	}
};