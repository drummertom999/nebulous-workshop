// *******************************************
//# sourceURL=modules/enginejs-easing.js
// *******************************************

Engine.Easing =
{

	// Linear
	Linear : function(x1, x2, t)
	{
		var dist = x2 - x1;
		return x1 + (t * dist);
	},

	// Quadratic
	QuadraticIn : function(x1, x2, t)
	{
		return (x2 -x1) * t * t + x1;
	},

	QuadraticOut : function(x1, x2, t)
	{
		return -(x2 -x1) * t * (t - 2) + x1;
	},

	QuadraticInOut : function(x1, x2, t)
	{
		var c = x2 - x1;
		t /= 0.5;
		if(t < 1) return c / 2 * t * t + x1;
		t--;
		return -c / 2 * (t * (t - 2) - 1) + x1;
	},

	// Cubic
	CubicIn : function(x1, x2, t)
	{
		return (x2 - x1) * t * t * t + x1;
	},

	CubicOut : function(x1, x2, t)
	{
		t--;
		return (x2 - x1) * (t * t * t + 1) + x1;
	},

	CubicInOut : function(x1, x2, t)
	{
		var dist = x2 - x1;
		var t = t / 0.5;
		if(t < 1) { return x1 + dist / 2 * t * t * t; }
		t -= 2; return x1 + dist / 2 * (t * t * t + 2);
	},

	// Quartic
	QuarticIn : function(x1, x2, t)
	{
		return (x2 - x1) * t * t * t * t + x1;
	},

	QuarticOut : function(x1, x2, t)
	{
		t--;
		return -(x2 - x1) * (t * t * t * t - 1) + x1;
	},

	QuarticInOut : function(x1, x2, t)
	{
		var c = x2 - x1;
		t /= 0.5;
		if(t < 1) return c / 2 * t * t * t * t + x1;
		t -= 2;
		return -c / 2 * (t * t * t * t - 2) + x1;
	},

	// Quintic
	QuinticIn : function(x1, x2, t)
	{
		return (x2 - x1) * t * t * t * t * t + x1;
	},

	QuinticOut : function(x1, x2, t)
	{
		t--;
		return (x2 - x1) * (t * t * t * t * t + 1) + x1;
	},

	QuinticInOut : function(x1, x2, t)
	{
		var c = x2 - x1;
		t /= 0.5;
		if (t < 1) return c / 2 * t * t * t * t * t + x1;
		t -= 2;
		return c / 2 * (t * t * t * t * t + 2) + x1;
	},

	// Sinusodial
	SinusodialIn : function(x1, x2, t)
	{
		var c = x2 - x1;
		return -c * Math.cos(t * (Math.PI / 2)) + c + x1;
	},

	SinusodialOut : function(x1, x2, t)
	{
		return (x2 - x1) * Math.sin(t * (Math.PI / 2)) + x1;
	},

	SinusodialInOut : function(x1, x2, t)
	{
		return -(x2 - x1) / 2 * (Math.cos(Math.PI * t) - 1) + x1;
	},

	// Exponential
	ExponentialIn : function(x1, x2, t)
	{
		return (x2 - x1) * Math.pow(2, 10 * (t - 1)) + x1;
	},

	ExponentialOut : function(x1, x2, t)
	{
		return (x2 - x1) * (-Math.pow(2, -10 * t) + 1) + x1;
	},

	ExponentialInOut : function(x1, x2, t)
	{
		var c = x2 - x1;
		t /= 0.5;
		if(t < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + x1;
		t--;
		return c / 2 * (-Math.pow(2, -10 * t) + 2) + x1;
	},

	// Circular
	CircularIn : function(x1, x2, t)
	{
		return -(x2 - x1) * (Math.sqrt(1 - t * t) - 1) + x1;
	},

	CircularOut : function(x1, x2, t)
	{
		t--;
		return (x2 - x1) * Math.sqrt(1 - t * t) + x1;
	},

	CircularInOut : function(x1, x2, t)
	{
		var c = x2 - x1;
		t /= 0.5;
		if(t < 1) return -c / 2 * (Math.sqrt(1 - t * t) - 1) + x1;
		t -= 2;
		return c / 2 * (Math.sqrt(1 - t * t) + 1) + x1;
	},
};