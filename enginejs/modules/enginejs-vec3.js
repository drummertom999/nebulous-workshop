// *******************************************
//# sourceURL=modules/enginejs-vec3.js
// *******************************************

Engine.Vec3 =
{
	IsVec3 : function(v)
	{
		return v.length == 3;
	},

	Copy : function(v)
	{
		return Engine.Array.Copy(v);
	},

	FromVec2 : function(v, z)
	{
		return [ v[0], v[1], (z == undefined)? 0 : z ];
	},

	IsZero : function(v)
	{
		return (v[0] == 0) && (v[1] == 0) && (v[2] == 0);
	},

	Length : function(v)
	{
		return Math.sqrt((v[0] * v[0]) + (v[1] * v[1]) + (v[2] * v[2]));
	},

	LengthSquared : function(v)
	{
		return (v[0] * v[0]) + (v[1] * v[1]) + (v[2] * v[2]);
	},

	Normalise : function(v)
	{
		var len = Engine.Vec3.Length(v);
		return Engine.Vec3.DivideScalar(v, len);
	},

	IsNormalised : function(v)
	{
		return Engine.Vec3.Length(v) == 1;
	},

	Negate : function(v)
	{
		return [ -v[0], -v[1], -v[2] ];
	},

	Floor : function(v)
	{
		return [ Math.floor(v[0]), Math.floor(v[1]), Math.floor(v[2]) ];
	},

	Ceil : function(v)
	{
		return [ Math.ceil(v[0]), Math.ceil(v[1]), Math.ceil(v[2]) ];
	},

	Round : function(v)
	{
		return [ Math.round(v[0]), Math.round(v[1]), Math.round(v[2]) ];
	},

	RoundTowardsZero : function(v)
	{
		return [ v[0] < 0? Math.ceil(v[0]) : Math.floor(v[0]),
		         v[1] < 0? Math.ceil(v[1]) : Math.floor(v[1]),
		         v[1] < 0? Math.ceil(v[2]) : Math.floor(v[2]) ];
	},

	Add : function(v1, v2)
	{
		return [ v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2] ];
	},

	AddScalar : function(v, s)
	{
		return [ v[0] + s, v[1] + s, v[2] + s];
	},

	Subtract : function(v1, v2)
	{
		return [ v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2] ];
	},

	SubtractScalar : function(v, s)
	{
		return [ v[0] - s, v[1] - s, v[2] - s ];
	},

	Multiply : function(v1, v2)
	{
		return [ v1[0] * v2[0], v1[1] * v2[1], v1[2] * v2[2] ];
	},

	MultiplyScalar : function(v, s)
	{
		return [ v[0] * s, v[1] * s, v[2] * s];
	},

	Divide : function(v1, v2)
	{
		return [ v1[0] / v2[0], v1[1] / v2[1], v1[2] / v2[2] ];
	},

	DivideScalar : function(v, s)
	{
		return [ v[0] / s, v[1] / s, v[2] / s ];
	},

	Min : function(v1, v2)
	{
		return [ Math.min(v1[0], v2[0]), Math.min(v1[1], v2[1]), Math.min(v1[2], v2[2]) ];
	},

	Max : function(v1, v2)
	{
		return [ Math.max(v1[0], v2[0]), Math.max(v1[1], v2[1]), Math.max(v1[2], v2[2]) ];
	},

	MinElement : function(v)
	{
		return Math.min(v[0], v[1], v[2]);
	},

	MaxElement : function(v)
	{
		return Math.max(v[0], v[1], v[2]);
	},

	Clamp : function(v, vMin, vMax)
	{
		return [ Engine.Math.Clamp(v[0], vMin[0], vMax[0]),
		         Engine.Math.Clamp(v[1], vMin[1], vMax[1]),
		         Engine.Math.Clamp(v[2], vMin[2], vMax[2]) ];
	},

	DotProduct : function(v1, v2)
	{
		return (v1[0] * v2[0]) + (v1[1] * v2[1]) + (v1[2] * v2[2]);
	},

	CrossProduct : function(v1, v2)
	{
		return [ v1[1] * v2[2] - v1[2] * v2[1],
		         v1[2] * v2[0] - v1[0] * v2[2],
		         v1[0] * v2[1] - v1[1] * v2[0] ];
	},

	Angle : function(v1, v2)
	{
		var numerator = Engine.Vec3.DotProduct(v1, v2);
		var denominator = Engine.Vec3.Length(v1) * Engine.Vec3.Length(v2);
		return Math.acos(numerator / denominator);
	},

	Distance : function(v1, v2)
	{
		var v1_to_v2 = Engine.Vec3.Subtract(v2, v1);
		return Engine.Vec3.Length(v1_to_v2);
	},

	DistanceSquared : function(v1, v2)
	{
		var v1_to_v2 = Engine.Vec3.Subtract(v2, v1);
		return Engine.Vec3.LengthSquared(v1_to_v2);
	},

	Lerp : function(v1, v2, amount)
	{
		return [ v1[0] + ((v2[0] - v1[0]) * amount),
		         v1[1] + ((v2[1] - v1[1]) * amount),
		         v1[2] + ((v2[2] - v1[2]) * amount) ];
	},

	AreEqual : function(v1, v2)
	{
		return v1[0] == v2[0] && v1[1] == v2[1] && v1[2] == v2[2];
	},

	Transform : function(v, matrix)
	{
		// Assumes matrix is 4x4
		var x = a[0], y = a[1], z = a[2];
		var w = (m[3] * x + m[7] * y + m[11] * z + m[15]) || 1.0;
		out_x = (m[0] * x + m[4] * y + m[8]  * z + m[12]) / w;
		out_y = (m[1] * x + m[5] * y + m[9]  * z + m[13]) / w;
		out_z = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
		return [out_x, out_y, out_z];
	},

	// Constants
	AxisX : [1, 0, 0],
	AxisY : [0, 1, 0],
	AxisZ : [0, 0, 1],

	// Short-hand aliases
	Sub     : function(v1, v2) { return Engine.Vec3.Subtract(v1, v2); },
	Mul     : function(v1, v2) { return Engine.Vec3.Multiply(v1, v2); },
	Div     : function(v1, v2) { return Engine.Vec3.Divide(v1, v2); },
	AddS    : function(v, s)   { return Engine.Vec3.AddScalar(v, s); },
	SubS    : function(v, s)   { return Engine.Vec3.SubtractScalar(v, s); },
	MulS    : function(v, s)   { return Engine.Vec3.MultiplyScalar(v, s); },
	DivS    : function(v, s)   { return Engine.Vec3.DivideScalar(v, s); },
	Len     : function(v)      { return Engine.Vec3.Length(v); },
	LenSqr  : function(v)      { return Engine.Vec3.LengthSquared(v); },
	Norm    : function(v)      { return Engine.Vec3.Normalise(v); },
	Dot     : function(v1, v2) { return Engine.Vec3.DotProduct(v1, v2); },
	Cross   : function(v1, v2) { return Engine.Vec3.CrossProduct(v1, v2); },
	Dist    : function(v1, v2) { return Engine.Vec3.Distance(v1, v2); },
	DistSqr : function(v1, v2) { return Engine.Vec3.DistanceSquared(v1, v2); },
	Eq      : function(v1, v2) { return Engine.Vec3.AreEqual(v1, v2); },

	// Bad English
	Normalize    : function(v1, v2) { return Engine.Vec3.Normalize(v1, v2); },
	IsNormalized : function(v1, v2) { return Engine.Vec3.Normalize(v1, v2); }
};