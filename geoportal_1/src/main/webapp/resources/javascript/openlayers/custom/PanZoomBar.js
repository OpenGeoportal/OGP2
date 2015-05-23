/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * Function: createBackgroundImage
 * Creates a div button with specified background image
 *
 * Parameters:
 * id - {String} The id field for the img.  If none assigned one will be
 *               automatically generated.
 * px - {<OpenLayers.Pixel>} The left and top positions.
 * sz - {<OpenLayers.Size>} The style.width and style.height values.
 * uiClass - {String} The css class that describes the div background
 * position - {String} The style.position value.
 * border - {String} The border to place around the image.
 * opacity - {Float} Fractional value (0.0 - 1.0)
 * delayDisplay - {Boolean} If true waits until the image has been
 *                          loaded.
 *
 * Returns:
 * {DOMElement} A DOM Image created with the specified attributes.
 */
OpenLayers.Util.createBackgroundImage = function(id, px, sz, uiClass, position, border,
                                                 opacity, delayDisplay) {

    var bgimage = document.createElement("div");
    if (bgimage.className.length > 0) {
        bgimage.className += " " + uiClass;
    } else {
        bgimage.className = uiClass;
    }

    //set generic properties
    if (!id) {
        id = OpenLayers.Util.createUniqueID("OpenLayersDiv");
    }
    if (!position) {
        position = "relative";
    }
    OpenLayers.Util.modifyDOMElement(bgimage, id, px, sz, position,
        border, null, opacity);

    if(delayDisplay) {
        bgimage.style.display = "none";
        OpenLayers.Event.observe(bgimage, "load",
            OpenLayers.Function.bind(OpenLayers.Util.onImageLoad, bgimage));
        OpenLayers.Event.observe(bgimage, "error",
            OpenLayers.Function.bind(OpenLayers.Util.onImageLoadError, bgimage));

    }

    //set special properties
    bgimage.style.alt = id;
    bgimage.galleryImg = "no";

    return bgimage;
};

/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */


/**
 * @requires OpenLayers/Control/PanZoom.js
 */

/**
 * Class: OpenLayers.Control.PanZoomBar
 * The PanZoomBar is a visible control composed of a
 * <OpenLayers.Control.PanPanel> and a <OpenLayers.Control.ZoomBar>.
 * By default it is displayed in the upper left corner of the map as 4
 * directional arrows above a vertical slider.
 *
 * Inherits from:
 *  - <OpenLayers.Control.PanZoom>
 */
OpenLayers.Control.ModPanZoomBar = OpenLayers.Class(OpenLayers.Control.PanZoom, {

    /**
     * APIProperty: zoomStopWidth
     */
    zoomStopWidth: 13,

    /**
     * APIProperty: zoomStopHeight
     */
    zoomStopHeight: 11,

    /**
     * Property: slider
     */
    slider: null,

    /**
     * Property: sliderEvents
     * {<OpenLayers.Events>}
     */
    sliderEvents: null,

    /**
     * Property: zoombarDiv
     * {DOMElement}
     */
    zoombarDiv: null,

    /**
     * APIProperty: zoomWorldIcon
     * {Boolean}
     */
    zoomWorldIcon: false,

    /**
     * APIProperty: panIcons
     * {Boolean} Set this property to false not to display the pan icons. If
     * false the zoom world icon is placed under the zoom bar. Defaults to
     * true.
     */
    panIcons: true,

    /**
     * APIProperty: forceFixedZoomLevel
     * {Boolean} Force a fixed zoom level even though the map has
     *     fractionalZoom
     */
    forceFixedZoomLevel: false,

    /**
     * Property: mouseDragStart
     * {<OpenLayers.Pixel>}
     */
    mouseDragStart: null,

    /**
     * Property: deltaY
     * {Number} The cumulative vertical pixel offset during a zoom bar drag.
     */
    deltaY: null,

    /**
     * Property: zoomStart
     * {<OpenLayers.Pixel>}
     */
    zoomStart: null,

    /**
     * Constructor: OpenLayers.Control.PanZoomBar
     */

    /**
     * APIMethod: destroy
     */
    destroy: function() {

        this._removeZoomBar();

        this.map.events.un({
            "changebaselayer": this.redraw,
            "updatesize": this.redraw,
            scope: this
        });

        OpenLayers.Control.PanZoom.prototype.destroy.apply(this, arguments);

        delete this.mouseDragStart;
        delete this.zoomStart;
    },

    /**
     * Method: setMap
     *
     * Parameters:
     * map - {<OpenLayers.Map>}
     */
    setMap: function(map) {
        OpenLayers.Control.PanZoom.prototype.setMap.apply(this, arguments);
        this.map.events.on({
            "changebaselayer": this.redraw,
            "updatesize": this.redraw,
            scope: this
        });
    },

    /**
     * Method: redraw
     * clear the div and start over.
     */
    redraw: function() {
        if (this.div != null) {
            this.removeButtons();
            this._removeZoomBar();
        }
        this.draw();
    },

    /**
     * Method: draw
     *
     * Parameters:
     * px - {<OpenLayers.Pixel>}
     */
    draw: function(px) {
        // initialize our internal div
        OpenLayers.Control.prototype.draw.apply(this, arguments);
        px = this.position.clone();

        // place the controls
        this.buttons = [];

        var sz = {w: 24, h: 20};
        var centered = new OpenLayers.Pixel(px.x+sz.w/2, px.y);

        this._addButtonDiv("zoomin", "zoomPlus", centered.add(3, sz.h*3), sz);
        centered = this._addZoomBar(centered.add(3, sz.h*4));
        this._addButtonDiv("zoomout", "zoomMinus", centered, new OpenLayers.Size(24,25));

        return this.div;
    },

    /**
     * Method: _addButtonDiv
     *
     * Parameters:
     * id - {String}
     * uiClass - {String}
     * xy - {<OpenLayers.Pixel>}
     * sz - {<OpenLayers.Size>}
     *
     * Returns:
     * {DOMElement} A Div (an alphaImageDiv, to be precise) that contains the
     *     image of the button, and has all the proper event handlers set.
     */
    _addButtonDiv:function(id, uiClass, xy, sz) {



        var btn = OpenLayers.Util.createDiv();
        var bgimage = OpenLayers.Util.createBackgroundImage(this.id + "_" + id,
            xy, sz, uiClass, "absolute");
        btn.appendChild(bgimage);


        OpenLayers.Util.modifyDOMElement(btn, id, xy, sz, "static",
            null, null, 1);

        var innerDiv = btn.childNodes[0];
        OpenLayers.Util.modifyDOMElement(innerDiv, btn.id + "_innerImage", null, sz,
            "absolute", null);

        btn.style.cursor = "pointer";
        //we want to add the outer div
        this.div.appendChild(btn);
        btn.action = id;
        btn.className = "olButton";


        btn.map = this.map;

        //we want to remember/reference the outer div
        this.buttons.push(btn);
        return btn;
    },

    /**
     * Method: _addZoomBar
     *
     * Parameters:
     * centered - {<OpenLayers.Pixel>} where zoombar drawing is to start.
     */
    _addZoomBar:function(centered) {
        var imgLocation = OpenLayers.Util.getImageLocation("slider.png");
        var id = this.id + "_" + this.map.id;
        var minZoom = this.map.getMinZoom();
        var zoomsToEnd = this.map.getNumZoomLevels() - 1 - this.map.getZoom();
        var slider = OpenLayers.Util.createBackgroundImage(id,
            centered.add(2, zoomsToEnd * this.zoomStopHeight + 6),
            new OpenLayers.Size(12,10),
            "zoomSlider",
            "absolute");

        slider.style.cursor = "move";
        this.slider = slider;

        this.sliderEvents = new OpenLayers.Events(this, slider, null, true,
            {includeXY: true});
        this.sliderEvents.on({
            "touchstart": this.zoomBarDown,
            "touchmove": this.zoomBarDrag,
            "touchend": this.zoomBarUp,
            "mousedown": this.zoomBarDown,
            "mousemove": this.zoomBarDrag,
            "mouseup": this.zoomBarUp
        });

        var sz = {
            w: this.zoomStopWidth,
            h: this.zoomStopHeight * this.map.getNumZoomLevels()
        };
        var id = this.id + "_" + this.map.id;
        var div = OpenLayers.Util.createBackgroundImage(id, centered.add(5,0),
            new OpenLayers.Size(sz.w,
                this.zoomStopHeight),
            "zoomSlideBar",
            "absolute", null, "crop");

        div.style.height = sz.h + "px";

        div.style.cursor = "pointer";
        div.className = "olButton zoomSlideBar";
        this.zoombarDiv = div;

        this.div.appendChild(div);

        this.startTop = parseInt(div.style.top);
        this.div.appendChild(slider);

        this.map.events.register("zoomend", this, this.moveZoomBar);

/*        centered = centered.add(0,
            this.zoomStopHeight * (this.map.getNumZoomLevels() - minZoom));*/
        centered = centered.add(0, sz.h);

        return centered;
    },

    /**
     * Method: _removeZoomBar
     */
    _removeZoomBar: function() {
        this.sliderEvents.un({
            "touchstart": this.zoomBarDown,
            "touchmove": this.zoomBarDrag,
            "touchend": this.zoomBarUp,
            "mousedown": this.zoomBarDown,
            "mousemove": this.zoomBarDrag,
            "mouseup": this.zoomBarUp
        });
        this.sliderEvents.destroy();

        this.div.removeChild(this.zoombarDiv);
        this.zoombarDiv = null;
        this.div.removeChild(this.slider);
        this.slider = null;

        this.map.events.unregister("zoomend", this, this.moveZoomBar);
    },

    /**
     * Method: onButtonClick
     *
     * Parameters:
     * evt - {Event}
     */
    onButtonClick: function(evt) {
        console.log('on button click');
        OpenLayers.Control.PanZoom.prototype.onButtonClick.apply(this, arguments);
        if (evt.buttonElement === this.zoombarDiv) {
            var levels = evt.buttonXY.y / this.zoomStopHeight;
            if(this.forceFixedZoomLevel || !this.map.fractionalZoom) {
                levels = Math.floor(levels);
            }
            var zoom = (this.map.getNumZoomLevels() - 1) - levels;
            zoom = Math.min(Math.max(zoom, 0), this.map.getNumZoomLevels() - 1);
            this.map.zoomTo(zoom);
        }
    },

    /**
     * Method: passEventToSlider
     * This function is used to pass events that happen on the div, or the map,
     * through to the slider, which then does its moving thing.
     *
     * Parameters:
     * evt - {<OpenLayers.Event>}
     */
    passEventToSlider:function(evt) {
        this.sliderEvents.handleBrowserEvent(evt);
    },

    /*
     * Method: zoomBarDown
     * event listener for clicks on the slider
     *
     * Parameters:
     * evt - {<OpenLayers.Event>}
     */
    zoomBarDown:function(evt) {
        if (!OpenLayers.Event.isLeftClick(evt) && !OpenLayers.Event.isSingleTouch(evt)) {
            return;
        }
        this.map.events.on({
            "touchmove": this.passEventToSlider,
            "mousemove": this.passEventToSlider,
            "mouseup": this.passEventToSlider,
            scope: this
        });
        this.mouseDragStart = evt.xy.clone();
        this.zoomStart = evt.xy.clone();
        this.div.style.cursor = "move";
        // reset the div offsets just in case the div moved
        this.zoombarDiv.offsets = null;
        OpenLayers.Event.stop(evt);
    },

    /*
     * Method: zoomBarDrag
     * This is what happens when a click has occurred, and the client is
     * dragging.  Here we must ensure that the slider doesn't go beyond the
     * bottom/top of the zoombar div, as well as moving the slider to its new
     * visual location
     *
     * Parameters:
     * evt - {<OpenLayers.Event>}
     */
    zoomBarDrag:function(evt) {
        if (this.mouseDragStart != null) {
            var deltaY = this.mouseDragStart.y - evt.xy.y;
            var offsets = OpenLayers.Util.pagePosition(this.zoombarDiv);
            if ((evt.clientY - offsets[1]) > 0 &&
                (evt.clientY - offsets[1]) < parseInt(this.zoombarDiv.style.height) - 2) {
                var newTop = parseInt(this.slider.style.top) - deltaY;
                this.slider.style.top = newTop+"px";
                this.mouseDragStart = evt.xy.clone();
            }
            // set cumulative displacement
            this.deltaY = this.zoomStart.y - evt.xy.y;
            OpenLayers.Event.stop(evt);
        }
    },

    /*
     * Method: zoomBarUp
     * Perform cleanup when a mouseup event is received -- discover new zoom
     * level and switch to it.
     *
     * Parameters:
     * evt - {<OpenLayers.Event>}
     */
    zoomBarUp:function(evt) {
        if (!OpenLayers.Event.isLeftClick(evt) && evt.type !== "touchend") {
            return;
        }
        if (this.mouseDragStart) {
            this.div.style.cursor="";
            this.map.events.un({
                "touchmove": this.passEventToSlider,
                "mouseup": this.passEventToSlider,
                "mousemove": this.passEventToSlider,
                scope: this
            });
            var zoomLevel = this.map.zoom;
            if (!this.forceFixedZoomLevel && this.map.fractionalZoom) {
                zoomLevel += this.deltaY/this.zoomStopHeight;
                zoomLevel = Math.min(Math.max(zoomLevel, 0),
                    this.map.getNumZoomLevels() - 1);
            } else {
                zoomLevel += this.deltaY/this.zoomStopHeight;
                zoomLevel = Math.max(Math.round(zoomLevel), 0);
            }
            this.map.zoomTo(zoomLevel);
            this.mouseDragStart = null;
            this.zoomStart = null;
            this.deltaY = 0;
            OpenLayers.Event.stop(evt);
        }
    },

    /*
     * Method: moveZoomBar
     * Change the location of the slider to match the current zoom level.
     */
    moveZoomBar:function() {
        var newTop =
            ((this.map.getNumZoomLevels()-1) - this.map.getZoom()) *
            this.zoomStopHeight + this.startTop + 1;
        this.slider.style.top = newTop + "px";
    },

    CLASS_NAME: "OpenLayers.Control.ModPanZoomBar"
});