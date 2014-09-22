L.Map = L.Map.extend({
	
	__super__: L.Map,
	_mapAngle: 45.0,
	_initialCenterPoint: null,
	
	// new functions
	
	getMapAngle: function() {
		// like CSS, clockwise rotation in degrees
		return this._mapAngle;
	},
	
	_transformPoint: function(point) {
		var centerPoint = this._getPixelCenter();
		return RotationMath.rotate(point, this.getMapAngle()).add(centerPoint);
	},

	_transformLayerPoint: function(point) {
		// this is slow
		var centerPoint = this.getSize().divideBy(2.0);
		return RotationMath.rotate(point.subtract(centerPoint), -this.getMapAngle()).add(centerPoint);
	},
	
	_untransformLayerPoint: function(point) {
		// this is slow
		var centerPoint = this.getSize().divideBy(2.0);
		return RotationMath.rotate(point.subtract(centerPoint), this.getMapAngle()).add(centerPoint);
	},

	_getPixelCenter: function() {
		this._checkIfLoaded();
		return this._initialCenterPoint;
 	},
	
	_getNewCenterPoint: function(center, zoom) {
		// related to _getNewTopLeftPoint
		return this.project(center, zoom)._round();
	},
	
	//
	
	_resetView: function (center, zoom, preserveMapOffset, afterZoomAnim) {
		
		// this is mainly cut&paste from Map.js, the changes are marked in 'rotation' comments
		
		var zoomChanged = (this._zoom !== zoom);

		if (!afterZoomAnim) {
			this.fire('movestart');

			if (zoomChanged) {
				this.fire('zoomstart');
			}
		}

		this._zoom = zoom;
		this._initialCenter = center;

		this._initialTopLeftPoint = this._getNewTopLeftPoint(center);
		/*rotation addition*/this._initialCenterPoint = this._getNewCenterPoint(center);

		if (!preserveMapOffset) {
			L.DomUtil.setPosition(this._mapPane, new L.Point(0, 0));
		} else {
			/*rotation rewrite, was :
			this._initialTopLeftPoint._add(this._getMapPanePos());
			*/
			var mapPanePos = this._getMapPanePos();
			mapPanePos = RotationMath.rotate(mapPanePos, this.getMapAngle());
			this._initialTopLeftPoint._add(mapPanePos);
			this._initialCenterPoint._add(mapPanePos);
		}

		this._tileLayersToLoad = this._tileLayersNum;

		var loading = !this._loaded;
		this._loaded = true;

		this.fire('viewreset', {hard: !preserveMapOffset});

		if (loading) {
			this.fire('load');
			this.eachLayer(this._layerAdd, this);
		}

		this.fire('move');

		if (zoomChanged || afterZoomAnim) {
			this.fire('zoomend');
		}

		this.fire('moveend', {hard: !preserveMapOffset});
	},
	
	getPixelBounds: function () {
		var halfSize = this.getSize().divideBy(2.0);			// containerSize, pixels
		var mapOffset = this._getMapPanePos();					// drag offset, pixels
		// compute and tranform the 4 corners
		var bounds = [
			this._transformPoint( new L.Point(-halfSize.x, -halfSize.y).subtract(mapOffset) ),
			this._transformPoint( new L.Point( halfSize.x, -halfSize.y).subtract(mapOffset) ),
			this._transformPoint( new L.Point( halfSize.x,  halfSize.y).subtract(mapOffset) ),
			this._transformPoint( new L.Point(-halfSize.x,  halfSize.y).subtract(mapOffset) )
		];
		return new L.Bounds( bounds );
	},

	// conversion methods

 	layerPointToLatLng: function (point) { // (Point)
		var layerPoint = this._untransformLayerPoint(point);		// TODO ?
 		var projectedPoint = L.point(point).add(this.getPixelOrigin());
 		return this.unproject(projectedPoint);
 	},
 
 	latLngToLayerPoint: function (latlng) { // (LatLng)
 		var projectedPoint = this.project(L.latLng(latlng))._round();
		var layerPoint = projectedPoint._subtract(this.getPixelOrigin());
		return this._transformLayerPoint(layerPoint);
 	},

	containerPointToLayerPoint: function (point) { // (Point)
		return this._untransformLayerPoint( L.point(point).subtract(this._getMapPanePos()) );
	},

	layerPointToContainerPoint: function (point) { // (Point)
		return L.point(point).add(this._getMapPanePos());		// TODO
	},
	
	//
	
 	_latLngToNewLayerPoint: function (latlng, newZoom, newCenter) {
		var mapPanePos = this._getMapPanePos();
		mapPanePos = RotationMath.rotate(mapPanePos, this.getMapAngle());
		var topLeft = this._getNewTopLeftPoint(newCenter, newZoom).add(mapPanePos);
		var layerPoint = this.project(latlng, newZoom)._subtract(topLeft);
		return this._transformLayerPoint(layerPoint);
	},

});

L.TileLayer = L.TileLayer.extend({

	__super__: L.TileLayer,

	_initContainer: function() {
		// TODO - this probably should be elsewhere
		this.__super__.prototype._initContainer.call(this);
		L.DomUtil.setRotation(this._tileContainer, this._map.getMapAngle(), this._map.getSize().divideBy(2.0));
	},
	
	_createTile: function () {
		return this.__super__.prototype._createTile.call(this);
	},

});

L.DomUtil.setRotation = function (el, angle, origin) {
	var toOrigin = L.DomUtil.getTranslateString(origin.multiplyBy(-1.0));
	var fromOrigin = L.DomUtil.getTranslateString(origin);
	var transform = fromOrigin + ' rotate('+angle+'deg) ' + toOrigin;
	el.style[L.DomUtil.TRANSFORM] = transform;
}

RotationMath = {

	toRadians: function (angle) {
	  return angle * (Math.PI / 180);
	},
	
	rotate: function (point, angle) {
		// clockwise rotation, angle is in degrees
		var angleR = -this.toRadians(angle);
		var cos = Math.cos(angleR),
		    sin = Math.sin(angleR);
		var x = cos * point.x - sin * point.y;
		var y = sin * point.x + cos * point.y;
		return new L.Point(x, y);
	}
}