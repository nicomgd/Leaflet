/*
 * L.Transformation is an utility class to perform simple point transformations through a 2d-matrix.
 */

L.Transformation = function (a, b, c, d) {
	this._a = a;
	this._b = b;
	this._c = c;
	this._d = d;
};

L.Transformation.prototype = {
	transform: function (point, scale) { // (Point, Number) -> Point
		return this._transform(point.clone(), scale);
	},

	// destructive transform (faster)
	_transform: function (point, scale) {
		scale = scale || 1;
		point.x = scale * (this._a * point.x + this._b);
		point.y = scale * (this._c * point.y + this._d);
		return point;
	},

	untransform: function (point, scale) {
		scale = scale || 1;
		return new L.Point(
		        (point.x / scale - this._b) / this._a,
		        (point.y / scale - this._d) / this._c);
	}
};


/*
 * L.Matrix23 is an utility class to perform simple point transformations through a 2x3 matrix.
 * mgd :: remove this from this file
 */

L.Matrix23 = function (row0, row1, inv_row0, inv_row1) {
	this._r0 = row0;
	this._r1 = row1;
	this._ir0 = inv_row0;
	this._ir1 = inv_row1;
};

L.Matrix23.prototype = {
	transform: function (point, scale) { // (Point, Number) -> Point
		return this._transform(point.clone(), scale);
	},

	// destructive transform (faster)
	_transform: function (point, scale) {
		scale = scale || 1;
		var r0 = this._r0;
		var r1 = this._r1;
		// consider point as column matrix with implicit '1' in 3rd row
		var x = scale * (r0[0] * point.x + r0[1] * point.y + r0[2]);
		var y = scale * (r1[0] * point.x + r1[1] * point.y + r1[2]);
		point.x = x;
		point.y = y;
		return point;
	},

	untransform: function (point, scale) {
		scale = scale || 1;
		var r0 = this._ir0;
		var r1 = this._ir1;
		var x = point.x / scale;
		var y = point.y / scale;
		return new L.Point(
		        (r0[0] * x + r0[1] * y + r0[2]),
		        (r1[0] * x + r1[1] * y + r0[2]));
	}
};
