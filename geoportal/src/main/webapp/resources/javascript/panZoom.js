    /**
     * Function: createBackgroundImage
     * Creates an img element with specific attribute values.
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
        jQuery(bgimage).addClass(uiClass);

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
/**
 * Function: onImageLoadError 
 */
/*OpenLayers.Util.onImageLoadError = function() {
    this._attempts = (this._attempts) ? (this._attempts + 1) : 1;
    if (this._attempts <= OpenLayers.IMAGE_RELOAD_ATTEMPTS) {
        var urls = this.urls;
        if (urls && urls instanceof Array && urls.length > 1){
            var src = this.src.toString();
            var current_url, k;
            for (k = 0; current_url = urls[k]; k++){
                if(src.indexOf(current_url) != -1){
                    break;
                }
            }
            var guess = Math.floor(urls.length * Math.random());
            var new_url = urls[guess];
            k = 0;
            while(new_url == current_url && k++ < 4){
                guess = Math.floor(urls.length * Math.random());
                new_url = urls[guess];
            }
            this.src = src.replace(current_url, new_url);
        } else {
            this.src = this.src;
        }
    } else {
        OpenLayers.Element.addClass(this, "olImageLoadError_custom");
        //the problem with this is that tiles that don't load on the first try become invisible
    }
    this.style.display = "";
};
*/
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
    imgLocation: "resources/media/",
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
     * Property: divEvents
     * {<OpenLayers.Events>}
     */
    divEvents: null,

    /** 
     * APIProperty: zoomWorldIcon
     * {Boolean}
     */
    zoomWorldIcon: false,

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
     * Property: zoomStart
     * {<OpenLayers.Pixel>}
     */
    zoomStart: null,

    /**
     * Constructor: OpenLayers.Control.PanZoomBar
     */ 
    initialize: function() {
        OpenLayers.Control.PanZoom.prototype.initialize.apply(this, arguments);
    },

    /**
     * APIMethod: destroy
     */
    destroy: function() {

        this._removeZoomBar();

        this.map.events.un({
            "changebaselayer": this.redraw,
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
        this.map.events.register("changebaselayer", this, this.redraw);
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
    	//        this._addButtonDiv("zoomin", "zoomPlus", centered2.add(3, sz2.h*3), sz2);
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
        OpenLayers.Event.observe(btn, "mousedown", 
                OpenLayers.Function.bindAsEventListener(this.buttonDown, btn));
            OpenLayers.Event.observe(btn, "dblclick", 
                OpenLayers.Function.bindAsEventListener(this.doubleClick, btn));
            OpenLayers.Event.observe(btn, "click", 
                OpenLayers.Function.bindAsEventListener(this.doubleClick, btn));
            btn.action = id;
            btn.map = this.map;
        //we want to remember/reference the outer div
        this.buttons.push(btn);
        return btn;
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

        var sz = new OpenLayers.Size(9,13);
        var szNS = new OpenLayers.Size(13,9);

        var sz2 = new OpenLayers.Size(24,20);

        var centered = new OpenLayers.Pixel(px.x+sz.w/2, px.y);
        var centered2 = new OpenLayers.Pixel(px.x+sz2.w/2, px.y);

        var wposition = sz.w;

        if (this.zoomWorldIcon) {
            centered = new OpenLayers.Pixel(px.x+sz.w, px.y);
        }
        /*this._addButton("", "panarrows_bg.png", px);
        this._addButton("panup", "north-mini.png", px.add(15, 6));
        this._addButton("panleft", "west-mini.png", px.add(6, 15));
        if (this.zoomWorldIcon) {
            this._addButton("zoomworld", "zoom-world-mini.png", px.add(sz.w, 0), sz);
            
            wposition *= 2;
        }
        this._addButton("panright", "east-mini.png", px.add(28, 15));
        this._addButton("pandown", "south-mini.png", px.add(15, 28));*/
        this._addButtonDiv("zoomin", "zoomPlus", centered2.add(3, sz2.h*3), sz2);
        centered2 = this._addZoomBar(centered2.add(3, sz2.h*4));
        this._addButtonDiv("zoomout", "zoomMinus", centered2, new OpenLayers.Size(24,25));

        return this.div;
    },

    /** 
    * Method: _addZoomBar
    * 
    * Parameters:
    * location - {<OpenLayers.Pixel>} where zoombar drawing is to start.
    */
    _addZoomBar:function(centered) {
        
        
        var id = this.id + "_" + this.map.id;
        var zoomsToEnd = this.map.getNumZoomLevels() - 1 - this.map.getZoom();
        var slider = OpenLayers.Util.createBackgroundImage(id,
                       centered.add(2, zoomsToEnd * this.zoomStopHeight + 6), 
                       new OpenLayers.Size(12,10), 
                       "zoomSlider",
                       "absolute");

        this.slider = slider;
        
        this.sliderEvents = new OpenLayers.Events(this, slider, null, true,
                                            {includeXY: true});
        this.sliderEvents.on({
            "mousedown": this.zoomBarDown,
            "mousemove": this.zoomBarDrag,
            "mouseup": this.zoomBarUp,
            "dblclick": this.doubleClick,
            "click": this.doubleClick
        });
        
        var sz = new OpenLayers.Size();
        sz.h = this.zoomStopHeight * this.map.getNumZoomLevels();
        sz.w = this.zoomStopWidth;
        
        var id = this.id + "_" + this.map.id;
        var div = OpenLayers.Util.createBackgroundImage(id, centered.add(5,0),
                                      new OpenLayers.Size(sz.w, 
                                              this.zoomStopHeight),
                                      "zoomSlideBar", 
                                      "absolute", null, "crop");
        div.style.height = sz.h + "px";

        
        this.zoombarDiv = div;
        
        this.divEvents = new OpenLayers.Events(this, div, null, true, 
                                                {includeXY: true});
        this.divEvents.on({
            "mousedown": this.divClick,
            "mousemove": this.passEventToSlider,
            "dblclick": this.doubleClick,
            "click": this.doubleClick
        });
        
        this.div.appendChild(div);

        this.startTop = parseInt(div.style.top);
        this.div.appendChild(slider);

        this.map.events.register("zoomend", this, this.moveZoomBar);

        centered = centered.add(0, sz.h);
        return centered; 
    },
    
    /**
     * Method: _removeZoomBar
     */
    _removeZoomBar: function() {
        this.sliderEvents.un({
            "mousedown": this.zoomBarDown,
            "mousemove": this.zoomBarDrag,
            "mouseup": this.zoomBarUp,
            "dblclick": this.doubleClick,
            "click": this.doubleClick
        });
        this.sliderEvents.destroy();

        this.divEvents.un({
            "mousedown": this.divClick,
            "mousemove": this.passEventToSlider,
            "dblclick": this.doubleClick,
            "click": this.doubleClick
        });
        this.divEvents.destroy();
        
        this.div.removeChild(this.zoombarDiv);
        this.zoombarDiv = null;
        this.div.removeChild(this.slider);
        this.slider = null;
        
        this.map.events.unregister("zoomend", this, this.moveZoomBar);
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
    
    /**
     * Method: divClick
     * Picks up on clicks directly on the zoombar div
     *           and sets the zoom level appropriately.
     */
    divClick: function (evt) {
        if (!OpenLayers.Event.isLeftClick(evt)) {
            return;
        }
        var y = evt.xy.y;
        var top = OpenLayers.Util.pagePosition(evt.object)[1];
        var levels = (y - top)/this.zoomStopHeight;
        if(this.forceFixedZoomLevel || !this.map.fractionalZoom) {
            levels = Math.floor(levels);
        }    
        var zoom = (this.map.getNumZoomLevels() - 1) - levels; 
        zoom = Math.min(Math.max(zoom, 0), this.map.getNumZoomLevels() - 1);
        this.map.zoomTo(zoom);
        OpenLayers.Event.stop(evt);
    },
    
    /*
     * Method: zoomBarDown
     * event listener for clicks on the slider
     *
     * Parameters:
     * evt - {<OpenLayers.Event>} 
     */
    zoomBarDown:function(evt) {
        if (!OpenLayers.Event.isLeftClick(evt)) {
            return;
        }
        this.map.events.on({
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
        if (!OpenLayers.Event.isLeftClick(evt)) {
            return;
        }
        if (this.mouseDragStart) {
            this.div.style.cursor="";
            this.map.events.un({
                "mouseup": this.passEventToSlider,
                "mousemove": this.passEventToSlider,
                scope: this
            });
            var deltaY = this.zoomStart.y - evt.xy.y;
            var zoomLevel = this.map.zoom;
            if (!this.forceFixedZoomLevel && this.map.fractionalZoom) {
                zoomLevel += deltaY/this.zoomStopHeight;
                zoomLevel = Math.min(Math.max(zoomLevel, 0), 
                                     this.map.getNumZoomLevels() - 1);
            } else {
                zoomLevel += Math.round(deltaY/this.zoomStopHeight);
            }
           // alert("there");
            this.map.zoomTo(zoomLevel);
            this.mouseDragStart = null;
            this.zoomStart = null;
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
