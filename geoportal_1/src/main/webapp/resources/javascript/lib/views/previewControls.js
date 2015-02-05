if (typeof OpenGeoportal === 'undefined') {
	OpenGeoportal = {};
} else if (typeof OpenGeoportal !== "object") {
	throw new Error("OpenGeoportal already exists and is not an object");
}

if (typeof OpenGeoportal.Views === 'undefined') {
	OpenGeoportal.Views = {};
} else if (typeof OpenGeoportal.Views !== "object") {
	throw new Error("OpenGeoportal.Views already exists and is not an object");
}

OpenGeoportal.Views.PreviewTools = Backbone.View.extend({
	
	disabledEvents : {
		"click .zoomToLayerControl" : "zoomToLayerExtent"
	},
	
	activeEvents : {
		"click .zoomToLayerControl" : "zoomToLayerExtent",
		"click .colorControl" : "colorPickerToggle",
		"click .attributeInfoControl" : "toggleFeatureInfo",
		"click .sliderArrow" : "toggleSlider",
		"mouseleave .controlContainer" : "closeSlider"
	},

	events: function(){
		var preview = this.model.get("preview");
		if (preview === "on"){
			return this.activeEvents;
		} else {
			return this.disabledEvents;
		}
	},
	
	initialize : function() {
		this.listenTo(this.model, "change:colorPickerOn", this.colorPicker);
		this.listenTo(this.model, "change:color", this.updateColorControl);
		this.listenTo(this.model, "change:getFeature",
				this.featureInfoButtonState);
		this.listenTo(this.model, "change:opacity", this.changeOpacity);
		this.listenTo(this.model, "change:graphicWidth",
				this.changeGraphicWidth);
		this.listenTo(this.model, "change:preview", this.toggleControls);
		this.render();
	},
	
	close: function(){
		this.stopListening();
		this.destroyWidgets();
		this.remove();
	},
	
	destroyWidgets: function(){
		var size$ = this.$el.find(".sizeControlCell");
		this.destroySlider(size$);

		var opacity$ = this.$el.find(".opacityControlCell");
		this.destroySlider(opacity$);
	},
	
	toggleControls: function(model, val, options) {
		if (val === "on"){
			this.enableControls(model, val, options);
		} else {
			this.disableControls();
		}
	},

	enableControls: function() {
		this.$el.css({
			opacity: 1
		}).find(".button").css({
			cursor: "pointer"
			});
	},
	
	disableControls: function() {
		this.model.set({colorPickerOn: false});
		this.$(".previewControls").children().not(".zoomToLayerControl").css({
			opacity:.4
			}).find(".button").addBack(".button").css({
				cursor: "default"
			});

	},
	changeOpacity : function(model, val, options) {
		var value = model.get("opacity");
		this.updateSlider("opacityControlCell", value);
	},
	changeGraphicWidth : function(model, val, options) {
		var value = model.get("graphicWidth");
		this.updateSlider("sizeControlCell", value);
	},
	updateSlider : function(controlClass, newValue) {
		// update labels
		this.$el.find("." + controlClass).find(".sliderValue").text(newValue);

	},
	render : function() {
		// render preview tools for a previewed layer
		var markup = "";
		var template = OpenGeoportal.Template;

		if (this.model.has("opacity")) {
			// render opacity control
			var tooltip = "Adjust layer transparency";
			var label = "Opacity";
			markup += template.get('sliderControl')({
				controlClass : "opacityControlCell",
				label : label,
				value : this.model.get("opacity"),
				units : "%",
				tooltip : tooltip
			});

		}
		// console.log(this.model);
		if (this.model.has("graphicWidth")) {
			var label = "";
			var type = this.model.get("DataType").toLowerCase();
			if (type === "point") {
				// render sizeControl; different for point, line, and polygon
				label = "Pt size";
			} else if (type === "line") {
				label = "Ln width";
			} else if (type === "polygon") {
				label = "Border";
			} else {
				// generic vector layer
				label = "Width";
			}
			var tooltip = "Adjust size";
			markup += template.get('sliderControl')({
				controlClass : "sizeControlCell",
				label : label,
				value : this.model.get("graphicWidth"),
				units : "px",
				tooltip : tooltip
			});
		}
		if (this.model.has("color")) {
			// render a color control
			markup += template.get('colorControl')({
				color : this.model.get("color")
			});
		}
		// if (this.model.getBounds().isValid()){
		// render a zoom to layer control
		markup += template.get('zoomControl')();
		// }
		if (this.model.has("getFeature")) {
			// render getFeature control
			var toolClass = "attributeInfoControl";
			if (this.model.get("getFeature")) {
				toolClass += "On";
			} else {
				toolClass += "Off";
			}
			markup += template.get('getFeatureControl')({
				toolClass : toolClass
			});
		}

		this.$el.html(template.get('previewTools')({
			toolsMarkup : markup
		}));

		if (this.model.get("preview") === "off"){
			this.disableControls();
		}
		return this;

	},
	createOpacitySlider : function() {
		var opacity$ = this.$el.find(".opacityControlCell");
		this.destroySlider(opacity$);
		
		var opacityVal = this.model.get("opacity");
		// class = opacitySlider
		var that = this;
		var slider = opacity$.find(".previewToolsSlider")
				.slider(
						{
							min : 0,
							max : 100,
							step : 5,
							value : opacityVal, 
							slide : function(event, ui) {
								that.model.set({
									opacity : ui.value
								});

							},
							stop : function(event, ui) {
								that.model.set({
									opacity : ui.value
								});
							}
						});
		this.opacitySlider = slider;
		return slider;
	},

	createSizeSlider : function() {
		var size$ = this.$el.find(".sizeControlCell");
		this.destroySlider(size$);
		
		var minSize = 1;
		var maxSize = 6;
		if (this.model.get("DataType").toLowerCase() == "polygon") {
			minSize = 0;
			maxSize = 5;
		}
		var that = this;
		var widthVal = this.model.get("graphicWidth");
		var slider = size$.find(".previewToolsSlider").slider(
				{
					min : minSize,
					max : maxSize,
					step : 1,
					value : widthVal, 
					slide : function(event, ui) {

					},
					stop : function(event, ui) {
						that.model.set({
							graphicWidth : ui.value
						});
					}
				});
		this.sizeSlider = slider;
		return slider;
	},
	createSlider: function(control$){
		if (control$.hasClass("sizeControlCell")){
			this.createSizeSlider();
		} else if (control$.hasClass("opacityControlCell")) {
			this.createOpacitySlider();
		}
	},
	
	destroySlider: function(control$){
		if (control$.hasClass("sizeControlCell")){
			try {
				if (typeof this.sizeSlider !== "undefined" && this.sizeSlider !== null){
					this.sizeSlider.slider("destroy");
					this.sizeSlider = null;
				}
			} catch (e){
				console.log(e);
			}
		} else if (control$.hasClass("opacityControlCell")) {
			try {
				if (typeof this.opacitySlider !== "undefined" && this.opacitySlider !== null){
					this.opacitySlider.slider("destroy");
					this.opacitySlider = null;
				}
			} catch (e){
				console.log(e);
			}
		}
	},
	
	toggleSlider : function(event) {
		var control$ = jQuery(event.target).siblings(".controlContainer");
		if (control$.css("display") == "none") {
			this.openSlider(event);
		} else {
			this.closeSlider(event);
		}

	},
	
	openSlider : function(event) {
		//create the jquery ui slider obj
		var lbl$ = jQuery(event.target).parent().parent();
		this.createSlider(lbl$);
		
		var control = jQuery(event.target).siblings(".controlContainer");
		control.css("display", "block");
	},

	closeSlider : function(event) {
		var control$;
		var target$ = jQuery(event.target);
		if (target$.hasClass(".controlContainer")) {
			control$ = target$;
		} else {
			control$ = target$.closest(".controlContainer");

			if (control$.length == 0) {
				control$ = target$.siblings(".controlContainer");
			}
		}

		control$.css("display", "none");
		
		//destroy the jquery ui object
		var lbl$ = jQuery(event.target).parent().parent();
		this.destroySlider(lbl$);

	},

	zoomToLayerExtent : function() {
		var extent = [];
		extent.push(this.model.get("MinX"));
		extent.push(this.model.get("MinY"));
		extent.push(this.model.get("MaxX"));
		extent.push(this.model.get("MaxY"));

		var bbox = extent.join();
		jQuery(document).trigger("map.zoomToLayerExtent", {
			bbox : bbox
		});
	},
	
	colorPickerToggle : function(model) {
		var val = this.model.get("colorPickerOn");
		this.model.set({
			colorPickerOn : !val
		});
	},
	
	colorPicker : function(model) {

		var dialogDiv$ = null;
		if (!model.has("colorDialog")) {
			var dialogDiv = '<div class="dialog colorDialog"></div>';
			dialogDiv$ = jQuery(dialogDiv);

			dialogDiv$.appendTo("#dialogs").dialog({
				zIndex : 9999,
				autoOpen : false,
				width : 'auto',
				height : 'auto',
				title : "Colors",
				resizable : false,
				close : function(event, ui) {
					model.set({
						colorPickerOn : false
					});
				}
			});
			model.set({
				colorDialog : new OpenGeoportal.Views.ColorPicker({
					model : model,
					el : dialogDiv$
				})
			});
		} else {
			dialogDiv$ = model.get("colorDialog").$el;
		}

		if (model.changed.colorPickerOn) {
			dialogDiv$.dialog("open");
		} else {
			dialogDiv$.dialog("close");
		}
	},
	
	updateColorControl : function() {
		var paletteColor = this.model.get("color");
		this.$el.find(".colorControl").css("background-color", paletteColor);
		// trigger map sld update from here, or is there another view watching
		// these models in the map?
	},
	
	// toggle the attribute info button & functionality
	toggleFeatureInfo : function(event) {
		var getFeature = this.model.get("getFeature");
		if (!getFeature) {
			// update layer state
			this.model.set({
				getFeature : true
			});
		} else {
			// update layer state, turn off get feature
			this.model.set({
				getFeature : false
			});
		}

	},
	
	featureInfoButtonState : function(model) {

		var button$ = this.$el.find(".attributeInfoControl");
		var onClass = "attributeInfoControlOn";
		var offClass = "attributeInfoControlOff";
		var getFeature = model.get("getFeature");
		if (getFeature) {
			button$.removeClass(offClass).addClass(onClass);
		} else {
			button$.removeClass(onClass).addClass(offClass);
		}
		//this.setGetFeatureTitle(model);
	}
});

OpenGeoportal.Views.ColorPicker = Backbone.View.extend({
	tagName : "div",
	events : {
		"click .colorCell" : "selectColorCell"
	},
	initialize : function() {
		this.render();
	},

	render : function() {

		var colors = [
				[ "#828282", "#aaaaaa", "#b2b2b2", "#cccccc", "#e1e1e1",
						"#ffffff" ],
				[ "#730000", "#a80000", "#e80000", "#ff0000", "#ff7f7f",
						"#ffbebe" ],
				[ "#732600", "#a83800", "#e64c00", "#ff5500", "#ffa77f",
						"#ffebbe" ],
				[ "#734c00", "#a87000", "#e69800", "#ffaa00", "#ffd37f",
						"#ffebaf" ],
				[ "#737300", "#a8a800", "#e6e600", "#ffff00", "#ffff73",
						"#ffffbe" ],
				[ "#426e00", "#6da800", "#98e600", "#aaff00", "#d1ff73",
						"#e9ffbe" ],
				[ "#267300", "#38a800", "#4ce600", "#55ff00", "#a3ff73",
						"#d3ffbe" ],
				[ "#00734c", "#00a884", "#00e6a9", "#00ffc5", "#73ffdf",
						"#beffe8" ],
				[ "#004c73", "#0084a8", "#00a9e6", "#00c5ff", "#73dfff",
						"#bee8ff" ],
				[ "#002673", "#0049a9", "#005ce6", "#0070ff", "#73b2ff",
						"#bed2ff" ],
				[ "#4c0073", "#8400a8", "#a900e6", "#c500ff", "#df73ff",
						"#e8beff" ],
				[ "#780f52", "#a80084", "#e00fa7", "#ff00c5", "#ff73df",
						"#ffbee8" ]

		];

		var currentColorSelection = this.model.get("color");
		
		var colorRow = function(row){
			var colorRow = ['<tr>'];
			_.each(row, function(color){
		
				var selectionClass;
				if (color == currentColorSelection) {
					selectionClass = " colorCellSelected";
				} else {
					selectionClass = "";
				}
				
				var colorCell = ['<td class="colorCellParent">',
				                '<div class="colorCell' + selectionClass + '" style="background-color:' + color + '"></div>',
				                '</td>'].join('\n')
				colorRow.push(colorCell);
			});
			
			colorRow.push('</tr>');
			return colorRow.join('\n');
		};
		
		var colorTable = function(colors){
			
			var colorTable = ['<table><tbody>'];

			_.each(colors, function(row){
				colorTable.push(colorRow(row));
			});
			
			colorTable.push('</tbody></table>');
			
			return colorTable.join('\n');
		};
		
		// TODO: move to template
		/*var colorDiv = ;
		var row = null;
		for (row in allColors) {
			colorDiv += '<tr>';
			var cell = null;
			for (cell in allColors[row]) {
				colorDiv += '<td class="colorCellParent">';
				var currentColorValue = allColors[row][cell];
				var selectionClass;
				if (currentColorValue == currentColorSelection) {
					selectionClass = " colorCellSelected";
				} else {
					selectionClass = "";
				}
				colorDiv += '<div class="colorCell' + selectionClass
						+ '" style="background-color:' + allColors[row][cell]
						+ '"></div>';
				colorDiv += '</td>';
			}
			colorDiv += '</tr>';
		}
		colorDiv += ;*/

		this.$el.html(colorTable(colors));

		return this;
	},

	selectColorCell : function(event) {
		var selectedCell$ = jQuery(event.target);
		var selectedColor = selectedCell$.css("background-color");
		if (selectedColor.indexOf("rgb") > -1) {
			selectedColor = OpenGeoportal.Utility.rgb2hex(selectedColor);
		}
		this.model.set({
			color : selectedColor
		}); // here's where things happen
		this.$el.find('.colorCell').removeClass('colorCellSelected');
		selectedCell$.addClass('colorCellSelected');
	}
});
