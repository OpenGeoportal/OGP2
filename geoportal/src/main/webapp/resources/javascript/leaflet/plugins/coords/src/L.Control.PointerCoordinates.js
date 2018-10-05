/**
 * Leaflet control that shows the lat lng coordinates under the mouse pointer
 */
(function () {
    L.Control.PointerCoordinates = L.Control.extend({
        options: {
            position: 'bottomleft',
            decimals: 5 // number of fixed decimal points to show.
        },

        onAdd: function (map) {
            // requires some work to make it work in other positions
            if (this.options.position !== 'bottomleft'){
                throw new Error('this control currently only supports the bottomleft position');
            }
            // create the dom elements
            var className = 'leaflet-control-pointercoordinates';
            var container = L.DomUtil.create("div", className);
            this._label = L.DomUtil.create("span", 'pointercoordinates-label', container);
            var self = this;
            this.map = map;

            // clear the coordinates when the mouse is not over the map
            map.on('mouseout', self._clearCoords, self);

            // update the coordinates on mousemove
            map.on('mousemove', self._updateCoords, self);

            // pause the coordinate update on map drag.
            map.on('dragstart', function(){
                map.off('mousemove', self._updateCoords, self);
                map.on('dragend', function(){
                    map.on('mousemove', self._updateCoords, self);
                });
            });
            return container;
        },

        onRemove: function(map){
            var self = this;
            map.off('mousemove', self._updateCoords, self);
            map.off('mouseout', self._clearCoords, self);

        },

        _wrapLng: function(lng){
            /**
             * wrap the longitude value.
             * @param x
             * @returns {*}
             */
            function wrap(x){
                if (x > 180) {
                    return x - 360;
                } else if (x < -180) {
                    return x + 360;
                } else {
                    return x;
                }
            }

            var wrapped = wrap(lng);
            if (wrapped > 180 || wrapped < -180 ){
                return this._wrapLng(wrapped);
            } else {
                return wrapped;
            }
        },

        _clearCoords: function(){
            /**
             * clear the coordinate label
             * @type {string}
             */
            this._label.innerText = '';
        },

        _showCoords: function(lat, lng){
            /**
             * populate the coordinate label
             * @type {string}
             */
            var lblText = this._wrapLng(lng).toFixed(this.options.decimals) + ', ';
            lblText += lat.toFixed(this.options.decimals);
            this._label.innerText = lblText;
        },

        _updateCoords: function(e){
            /**
             * populate the coordinate label from Leaflet mouse event
             * @type {LatLng|*|M}
             */
            var coords = e.latlng;
            this._showCoords(coords.lat, coords.lng);
        }


    });

    L.control.pointercoordinates = function (options) {
        return new L.Control.PointerCoordinates(options);
    };
})();