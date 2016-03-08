// *******************************************
//# sourceURL=modules/enginejs-time.js
// *******************************************

Engine.Time =
{
	high_precision : self.performance !== undefined && self.performance.now !== undefined,

	Now : function()
	{
		return Engine.Time.high_precision? self.performance.now() : Date.now();
	},

	Sleep : function(milliseconds)
	{
		var start = Engine.Time.Now();
		for(var i = 0; i < 1e7; i++)
		{
			if((Engine.Time.Now() - start) > milliseconds)
			{
				break;
			}
		}
	}
};