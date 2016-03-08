// *******************************************
//# sourceURL=modules/enginejs-vec2.js
// *******************************************

Engine.Vec2 =
{
	IsVec2 : function(v)
	{
		return v.length == 2;
	},

	Copy : function(v)
	{
		return Engine.Array.Copy(v);
	},

	IsZero : function(v)
	{
		return (v[0] == 0) && (v[1] == 0);
	},

	Length : function(v)
	{
		return Math.sqrt((v[0] * v[0]) + (v[1] * v[1]));
	},

	LengthSquared : function(v)
	{
		return (v[0] * v[0]) + (v[1] * v[1]);
	},

	Normalise : function(v)
	{
		var len = Engine.Vec2.Length(v);
		return Engine.Vec2.DivideScalar(v, len);
	},

	IsNormalised : function(v)
	{
		return Engine.Vec2.Length(v) == 1;
	},

	Gradient : function(v)
	{
		return v[1] / v[0];
	},

	Normal : function(v)
	{
		return Engine.Vec2.Normalise([ -v[1], v[0] ]);
	},

	Negate : function(v)
	{
		return [ -v[0], -v[1] ];
	},

	Tangent : function(v)
	{
		return Engine.Vec2.Negate(v);
	},

	Floor : function(v)
	{
		return [ Math.floor(v[0]), Math.floor(v[1]) ];
	},

	Ceil : function(v)
	{
		return [ Math.ceil(v[0]), Math.ceil(v[1]) ];
	},

	Round : function(v)
	{
		return [ Math.round(v[0]), Math.round(v[1]) ];
	},

	RoundTowardsZero : function(v)
	{
		return [ v[0] < 0? Math.ceil(v[0]) : Math.floor(v[0]),
		         v[1] < 0? Math.ceil(v[1]) : Math.floor(v[1]) ];
	},

	Add : function(v1, v2)
	{
		return [ v1[0] + v2[0], v1[1] + v2[1] ];
	},

	AddScalar : function(v, s)
	{
		return [ v[0] + s, v[1] + s ];
	},

	Subtract : function(v1, v2)
	{
		return [ v1[0] - v2[0], v1[1] - v2[1] ];
	},

	SubtractScalar : function(v, s)
	{
		return [ v[0] - s, v[1] - s ];
	},

	Multiply : function(v1, v2)
	{
		return [ v1[0] * v2[0], v1[1] * v2[1] ];
	},

	MultiplyScalar : function(v, s)
	{
		return [ v[0] * s, v[1] * s ];
	},

	Divide : function(v1, v2)
	{
		return [ v1[0] / v2[0], v1[1] / v2[1] ];
	},

	DivideScalar : function(v, s)
	{
		return [ v[0] / s, v[1] / s ];
	},

	Min : function(v1, v2)
	{
		return [ Math.min(v1[0], v2[0]), Math.min(v1[1], v2[1]) ];
	},

	Max : function(v1, v2)
	{
		return [ Math.max(v1[0], v2[0]), Math.max(v1[1], v2[1]) ];
	},

	MinElement : function(v)
	{
		return Math.min(v[0], v[1]);
	},

	MaxElement : function(v)
	{
		return Math.max(v[0], v[1]);
	},

	Clamp : function(v, vMin, vMax)
	{
		return [ Engine.Math.Clamp(v[0], vMin[0], vMax[0]),
		         Engine.Math.Clamp(v[1], vMin[1], vMax[1]) ];
	},

	DotProduct : function(v1, v2)
	{
		return (v1[0] * v2[0]) + (v1[1] * v2[1]);
	},

	AngleBetween : function(v1, v2)
	{
		var numerator = Engine.Vec2.DotProduct(v1, v2);
		var denominator = Engine.Vec2.Length(v1) * Engine.Vec2.Length(v2);
		return Math.acos(numerator / denominator);
	},

	Angle : function(v)
	{
		// Calculate angle between positive y-axis and v
		return Math.atan2(-v[0], v[1]);
	},

	Distance : function(v1, v2)
	{
		var v1_to_v2 = Engine.Vec2.Subtract(v2, v1);
		return Engine.Vec2.Length(v1_to_v2);
	},

	DistanceSquared : function(v1, v2)
	{
		var v1_to_v2 = Engine.Vec2.Subtract(v2, v1);
		return Engine.Vec2.LengthSquared(v1_to_v2);
	},

	Lerp : function(v1, v2, amount)
	{
		return [ v1[0] + ((v2[0] - v1[0]) * amount),
		         v1[1] + ((v2[1] - v1[1]) * amount) ];
	},

	AreEqual : function(v1, v2)
	{
		return v1[0] == v2[0] && v1[1] == v2[1];
	},

	Transform : function(v, matrix)
	{
		// Assumes matrix is 4x4
		var x = matrix[0] * v[0] + matrix[4] * v[1] + matrix[12];
		var y = matrix[1] * v[0] + matrix[5] * v[1] + matrix[13];
		return [x, y];
	},

	// Constants
	AxisX : [1, 0],
	AxisY : [0, 1],

	// Short-hand aliases
	Sub     : function(v1, v2) { return Engine.Vec2.Subtract(v1, v2); },
	Mul     : function(v1, v2) { return Engine.Vec2.Multiply(v1, v2); },
	Div     : function(v1, v2) { return Engine.Vec2.Divide(v1, v2); },
	AddS    : function(v, s)   { return Engine.Vec2.AddScalar(v, s); },
	SubS    : function(v, s)   { return Engine.Vec2.SubtractScalar(v, s); },
	MulS    : function(v, s)   { return Engine.Vec2.MultiplyScalar(v, s); },
	DivS    : function(v, s)   { return Engine.Vec2.DivideScalar(v, s); },
	Len     : function(v)      { return Engine.Vec2.Length(v); },
	LenSqr  : function(v)      { return Engine.Vec2.LengthSquared(v); },
	Norm    : function(v)      { return Engine.Vec2.Normalise(v); },
	Dot     : function(v1, v2) { return Engine.Vec2.DotProduct(v1, v2); },
	Dist    : function(v1, v2) { return Engine.Vec2.Distance(v1, v2); },
	DistSqr : function(v1, v2) { return Engine.Vec2.DistanceSquared(v1, v2); },
	Eq      : function(v1, v2) { return Engine.Vec2.AreEqual(v1, v2); },

	// Bad English
	Normalize    : function(v1, v2) { return Engine.Vec2.Normalize(v1, v2); },
	IsNormalized : function(v1, v2) { return Engine.Vec2.Normalize(v1, v2); }
};