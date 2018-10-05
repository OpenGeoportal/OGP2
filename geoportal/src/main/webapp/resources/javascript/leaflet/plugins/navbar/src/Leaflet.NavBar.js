/*
*  Simple navigation control that allows back and forward navigation through map's view history
*/

(function () {
    L.Control.NavBar = L.Control.extend({
        options: {
            position: 'topleft',
            //center:,
            //zoom :,
            //bounds:, //Alternative to center/zoom for home button, takes precedence if included
            forwardTitle: 'Go forward in map view history',
            backTitle: 'Go back in map view history',
            homeTitle: 'Go to home map view',
            zoomBoxTitle: 'Draw a box to zoom',
            panHandTitle: 'Drag to pan',
            useBounds: false, //alternatively, store bounds in the history, instead of zoom/center,
            addZoomBox: false,   // add zoombox/panhand controls
            callbacks: {}
        },

        zoomBoxActive: false,

        onAdd: function (map) {
            // Set options
            if (!this.options.useBounds) {

                if (!this.options.center) {
                    this.options.center = map.getCenter();
                }
                if (!this.options.zoom) {
                    this.options.zoom = map.getZoom();
                }
            }

            var options = this.options;

            // Create toolbar
            var controlName = 'leaflet-control-navbar',
                container = L.DomUtil.create('div', controlName + ' leaflet-bar');

            // Add toolbar buttons
            this._homeButton = this._createButton(options.homeTitle, controlName + '-home', container, this.goHome);
            this._backButton = this._createButton(options.backTitle, controlName + '-back', container, this.goBack);
            this._fwdButton = this._createButton(options.forwardTitle, controlName + '-fwd', container, this.goFwd);

            if (this.options.addZoomBox) {
                this._zoomBoxButton = this._createButton(options.zoomBoxTitle,
                    controlName + '-zoombox', container, this.zoomBoxOn);
                this._panButton = this._createButton(options.panHandTitle,
                    controlName + '-panhand', container, this.panHandOn);

                // panhand is active by default, so reflect this on the button state
                this._setButtonInactive(this._zoomBoxButton);
                this._setButtonActive(this._panButton);

            }
            // Initialize view history and index
            if (!this.options.useBounds) {
                this._viewHistory = [{center: this.options.center, zoom: this.options.zoom}];
            } else {
                if (this.options.bounds) {
                    this._viewHistory = [this.options.bounds];
                } else {
                    this._viewHistory = [];
                }
            }
            this._curIndx = 0;
            this._updateDisabled();
            map.once('moveend', function () {
                this._map.on('moveend', this._updateHistory, this);
            }, this);
            // Set initial view to home
/*            if (!this.options.useBounds) {
                map.setView(options.center, options.zoom);
            } else {
                if (this.options.bounds) {
                    map.fitBounds(this.options.bounds);
                } else {
                    map.fitWorld();
                }
            }*/
            return container;
        },

        onRemove: function (map) {
            map.off('moveend', this._updateHistory, this);
        },

        goHome: function () {
            /**
             * if 'useBounds' is true, calls fitBounds with 'bounds'. If bounds is not set, calls fitWorld.
             * if 'useBounds' is false, sets home map view with center and zoom
             */
            if (this.options.useBounds) {

                if (this.options.bounds) {
                    this._map.fitBounds(this.options.bounds);
                } else {
                    this._map.fitWorld();
                }
            } else {
                this._map.setView(this.options.center, this.options.zoom);
            }
            this._doCallback('goHome');

        },

        _goToNewView: function () {
            var view = this._viewHistory[this._curIndx];
            if (this.options.useBounds) {
                this._map.fitBounds(view);
            } else {
                this._map.setView(view.center, view.zoom);

            }
        },
        _pauseHistoryUpdate: function () {
            this._map.off('moveend', this._updateHistory, this);
            this._map.once('moveend', function () {
                this._map.on('moveend', this._updateHistory, this);
            }, this);
        },

        _hasBack: function () {
            return this._curIndx > 0;
        },

        goBack: function () {
            /**
             * go to previous view (or extent)
             */
            if (this._hasBack()) {
                this._pauseHistoryUpdate();
                this._curIndx--;
                this._updateDisabled();
                this._goToNewView();

                // only try callback if successful
                this._doCallback('goBack');
                return true;
            } else {
                return false;
            }
        },

        _hasFwd: function () {
            return this._curIndx !== this._viewHistory.length - 1;
        },

        goFwd: function () {
            /**
             * go to next view (or extent)
             */
            if (this._hasFwd()) {
                this._pauseHistoryUpdate();
                this._curIndx++;
                this._updateDisabled();
                this._goToNewView();

                // only try callback if successful
                this._doCallback('goFwd');
                return true;
            } else {
                return false;
            }
        },


        zoomBoxOn: function () {
            /**
             * activates the zoom box control, deactivates pan control
             */
            if (this.zoomBoxActive) {
                // skip if already active
                return;
            }

            this._map.dragging.disable();
            this._map.on('mousedown', this._handleZoomBoxMouseDown, this);

            this.zoomBoxActive = true;

            // handle css classes
            this._setButtonInactive(this._panButton);
            this._setButtonActive(this._zoomBoxButton);

            this._doCallback('zoomBoxOn');
        },

        _doCallback: function(action){
            if (this.options.callbacks.hasOwnProperty(action)){
                try {
                    this.options.callbacks[action].call();
                } catch (e){
                    console.error("callback for '" + action + "' resulted in an error:");
                    throw e;
                }
            }
        },

        panHandOn: function () {
            /**
             * activates the pan control (default map behavior), deactivates zoom box control
             */
            if (!this.zoomBoxActive) {
                // skip if already inactive
                return;
            }
            this._map.off('mousedown', this._handleZoomBoxMouseDown, this);
            this._map.dragging.enable();

            this.zoomBoxActive = false;

            // handle css classes
            this._setButtonInactive(this._zoomBoxButton);
            this._setButtonActive(this._panButton);

            this._doCallback('panHandOn');
        },

        _handleZoomBoxMouseDown: function (event) {
            this._map.boxZoom._onMouseDown.call(this._map.boxZoom, {
                clientX: event.originalEvent.clientX,
                clientY: event.originalEvent.clientY,
                which: 1,
                shiftKey: true
            });
        },

        _createButton: function (title, className, container, fn) {
            // Modified from Leaflet zoom control

            var link = L.DomUtil.create('a', className, container);
            link.href = '#';
            link.title = title;

            L.DomEvent
                .on(link, 'mousedown dblclick', L.DomEvent.stopPropagation)
                .on(link, 'click', L.DomEvent.stop)
                .on(link, 'click', fn, this)
                .on(link, 'click', this._refocusOnMap, this);

            return link;
        },

        _updateHistory: function () {
            //TODO: a better version of this checks to see if the newView is the same or maybe roughly the same.
            var newView = null;
            if (this.options.useBounds) {
                newView = this._map.getBounds();
            } else {
                newView = {
                    center: this._map.getCenter(),
                    zoom: this._map.getZoom()
                };
            }
            var insertIndx = this._curIndx + 1;
            this._viewHistory.splice(insertIndx, this._viewHistory.length - insertIndx, newView);
            this._curIndx++;
            // Update disabled state of toolbar buttons
            this._updateDisabled();
        },

        _setButtonActive: function (domObj) {
            if (!L.DomUtil.hasClass(domObj, 'active')) {
                L.DomUtil.addClass(domObj, 'active');
            }
        },

        _setButtonInactive: function (domObj) {
            if (L.DomUtil.hasClass(domObj, 'active')) {
                L.DomUtil.removeClass(domObj, 'active');
            }
        },

        _setFwdEnabled: function (enabled) {
            var leafletDisabled = 'leaflet-disabled';
            if (enabled === true) {
                this._setButtonActive(this._fwdButton);
                L.DomUtil.removeClass(this._fwdButton, leafletDisabled);
            } else {
                this._setButtonInactive(this._fwdButton);
                L.DomUtil.addClass(this._fwdButton, leafletDisabled);
            }
        },

        _setBackEnabled: function (enabled) {
            var leafletDisabled = 'leaflet-disabled';
            if (enabled === true) {
                this._setButtonActive(this._backButton);
                L.DomUtil.removeClass(this._backButton, leafletDisabled);
            } else {
                this._setButtonInactive(this._backButton);
                L.DomUtil.addClass(this._backButton, leafletDisabled);
            }
        },

        _updateDisabled: function () {
            if (this._hasFwd()) {
                this._setFwdEnabled(true);
            } else {
                this._setFwdEnabled(false);
            }

            if (this._hasBack()) {
                this._setBackEnabled(true);
            } else {
                this._setBackEnabled(false);
            }
        }

    });

    L.control.navbar = function (options) {
        return new L.Control.NavBar(options);
    };

})();
