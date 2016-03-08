// *******************************************
//# sourceURL=modules/enginejs-math.js
// *******************************************

Engine.Math =
{
	// Constants
	IdentityMatrix : mat4.create(),

	Clamp : function(x, min, max)
	{
		return Math.min(Math.max(x, min), max);
	},

	Random : function(min, max)
	{
		return Math.random() * (max - min) + min;
	},

	Midpoint : function(min, max)
	{
		return min + (max - min) / 2;
	},

	RandomInteger : function(min, max)
	{
		return Math.floor(Math.random() * (max - min + 1) + min);
	},

	AABB2D : function(min, max)
	{
		this.min = min;
		this.max = max;

		this.ContainsPoint = function(point)
		{
			if(point[0] < this.min[0] || point[0] > this.max[0])
				return false;
			if(point[1] < this.min[1] || point[1] > this.max[1])
				return false;
			return true;
		};

		this.Intersects = function(other_aabb)
		{
			return Engine.Intersect.AABB_AABB(this, other_aabb);
		};
	}
};