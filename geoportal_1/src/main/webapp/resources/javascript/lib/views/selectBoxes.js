if (typeof OpenGeoportal == 'undefined'){
	OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object"){
    throw new Error("OpenGeoportal already exists and is not an object");
}

if (typeof OpenGeoportal.Views == 'undefined'){
	OpenGeoportal.Views = {};
} else if (typeof OpenGeoportal.Views != "object"){
    throw new Error("OpenGeoportal.Views already exists and is not an object");
}


/******
 * Sorting
 *****/

/**
 * creates html and behaviours for a css styled dropdown 
 * 
 * @param divId the id of the div element to turn into a styled dropdown
 * @param paramObj .text is the displayed text, .menuHtml is the Html for the dropdown menu
 */

/**
 * creates html and behaviours for a css styled dropdown 
 * 
 * @param divId the id of the div element to turn into a styled dropdown
 * @param paramObj .text is the displayed text, .menuHtml is the Html for the dropdown menu
 */

var originalVal = $.fn.val;
$.fn.val = function(value) {
    if (typeof value == 'undefined') {
        if ($(this).attr('ogpSelectMenu')) {
            return $(this).attr("ogpValue");
        }
        return originalVal.call(this);
    }
    else {
        if ($(this).attr('ogpSelectMenu')) {
            $(this).attr("ogpValue", value);
        }

        return originalVal.call(this, value);
    }
};
 


OpenGeoportal.Views.AbstractSelectMenu = Backbone.View.extend({	

	uiInit: function(selectFunction){
		var that = this;
		this.$el.addClass("dropdown").attr("ogpSelectMenu", true);
		this.$el.find(".select").first().button({
			icons: {
				secondary: "ui-icon-triangle-1-s"
			}
		})
		.click(function(event) {
			event.preventDefault;
			var menu = $( this ).parent().next().toggle().position({
				my: "left top",
				at: "left bottom",
				of: this
			});
			that.$el.one( "mouseleave", function() {
				event.preventDefault;
				menu.hide();        
			});
			return false;
		})
		.parent()
		.buttonset()
		.next()
		.hide()
		.menu( {
			select: function(event, ui){that.selectCallback(event, ui, that);}
		});
	},
	getButtonLabel: function(){
		return this.getAttributeName(this.options.buttonLabel, "Select one");
	},
	getSelectionAttribute: function(){
		return this.getAttributeName(this.options.selectionAttribute, "selected");
	},
	getValueAttribute: function(){
		return this.getAttributeName(this.options.valueAttribute, "value");
	},
	getDisplayAttribute: function(){
		return this.getAttributeName(this.options.displayAttribute, this.getValueAttribute());
	},	
	getItemClass: function(){
		return this.getAttributeName(this.options.itemClass, "menuItem");
	},
	getAttributeName: function(optionAttribute, defaultValue){
		if (typeof optionAttribute == "undefined"){
			return defaultValue;
		} else {
			return optionAttribute;
		}
	},
	getValue: function(){
		return this.$el.attr("ogpValue");
	},
	selectCallback: function(event, ui, context){
		console.log("selected " + ui.item.text());
	},
	uiItemSelected: function(thisObj){
		jQuery(thisObj).addClass("selected");
	},
	uiItemDeselected: function(thisObj){
		jQuery(thisObj).removeClass("selected");
	},
	setValue: function(){throw new Error("no function for setValue defined.");},
	initRender: function(){
		//template
		var template = OpenGeoportal.ogp.appState.get("template");
		this.$el.html(template.styledSelectBody(this.getTemplateParams()));

		this.uiInit();
		this.setValue();
		return this;
	}
});



OpenGeoportal.Views.CollectionSelect = OpenGeoportal.Views.AbstractSelectMenu.extend({
	initialize: function() {
		var selectionEvent = "change:" + this.getSelectionAttribute();
		this.listenTo(this.collection, selectionEvent, this.setValue);
		this.listenTo(this.collection, selectionEvent, this.render);
		this.initRender();
		this.render();
	},
	getTemplateParams: function(){

		var menuHtml = "";	
		var buttonLabel = this.getButtonLabel();
		var template = OpenGeoportal.ogp.appState.get("template");
		var valueAttr = this.getValueAttribute();
		var displayAttr = this.getDisplayAttribute();
		var itemClass = this.getItemClass();

		this.collection.each(function(currModel){
			var value = currModel.get(valueAttr);
			var name = currModel.get(displayAttr);
			menuHtml += template.simpleMenuItem({name: name, value: value, className: itemClass});
		});

		return {menuHtml: menuHtml, buttonLabel: buttonLabel};
	},

	setValue: function(){
		var selectionAttr = this.getSelectionAttribute();
		var selectedModel = this.collection.filter(function(model){
				return model.get(selectionAttr);
		});
		if (selectedModel.length !== 0 ){
			this.$el.attr("ogpValue", selectedModel[0].get(this.getValueAttribute()));
			this.$el.trigger("change");
		}
	},
	
	selectCallback: function(event, ui, context){
		var valueAttr = this.getValueAttribute();
		var selectAttr = this.getSelectionAttribute();
		var prevSelected = this.collection.find(function(model) {
			return model.get(selectAttr) == true;
		});
		var selValue = ui.item.find("input[type=hidden]").first().val();
		var selModel = this.collection.find(function(model) {
			return model.get(valueAttr) === selValue;
		});
		prevSelected.set(selectAttr, false);//, {silent: true});//just trigger the listener once
		selModel.set(selectAttr, true);
		this.setValue();
		this.$el.find("ul.ui-menu").hide();
	},
	
	render: function(){
		var selectionAttr = this.getSelectionAttribute();
		var selectedModel = this.collection.filter(function(model){
				return model.get(selectionAttr);
			})[0];
		var value = "";
		var display = this.getButtonLabel();
		if (typeof selectedModel != "undefined"){
			value = selectedModel.get(this.getValueAttribute());
			if (value.length !== 0){
				display = selectedModel.get(this.getDisplayAttribute());
			}
		}
		
		var that = this;
		this.$el.find("li > a").each(function(){
			if (jQuery(this).next().val() === value){
				that.uiItemSelected(this);
			} else {
				that.uiItemDeselected(this);
			}
		});
		this.$el.find(".ui-button-text").text(display);

		return this;
	}
});

OpenGeoportal.Views.CollectionMultiSelect = OpenGeoportal.Views.AbstractSelectMenu.extend({
	initialize: function() {
		var selectionEvent = "change:" + this.getSelectionAttribute();
		this.listenTo(this.collection, selectionEvent, this.setValue);
		this.listenTo(this.collection, selectionEvent, this.render);
		this.initRender();
		this.render();
	},
	getTemplateParams: function(){
		var menuHtml = "";	
		var buttonLabel = this.getButtonLabel();
		var template = OpenGeoportal.ogp.appState.get("template");
		var valueAttr = this.getValueAttribute();
		var displayAttr = this.getDisplayAttribute();
		var itemClass = this.getItemClass();

		this.collection.each(function(currModel){
			var value = currModel.get(valueAttr);
			var name = currModel.get(displayAttr);
			menuHtml += template.simpleMenuItem({name: name, value: value, className: itemClass});
		});

		return {menuHtml: menuHtml, buttonLabel: buttonLabel};
	},
	selectCallback: function(event, ui, context){
		var valueAttr = this.getValueAttribute();
		var selValue = ui.item.find("input[type=hidden]").first().val();
		var selModel = this.collection.find(function(model) {
			return model.get(valueAttr) === selValue;
		});
		this.toggleSelected(selModel);
	},
	toggleSelected: function(model){
		var selectionAttr = this.getSelectionAttribute();
		var newVal = true;
		if (model.has(selectionAttr)){
			newVal = !model.get(selectionAttr);
		} 
		
		model.set(selectionAttr, newVal);
		return newVal;
	},
	setValue: function(){
		var selectionAttr = this.getSelectionAttribute();
		var valueAttr = this.getValueAttribute();
		var value = [];
		var selectedModels = this.collection.each(function(model){
				if (model.get(selectionAttr)){
					value.push(model.get(valueAttr));
				}
		});

		this.$el.attr("ogpValue", value);
		this.$el.trigger("change");
	},
	getValueAsArray: function(){
		return this.getValue().split(",");
	},
	render: function(){
		var selectionAttr = this.getSelectionAttribute();
		var valueAttr = this.getValueAttribute();
		var that = this;
		this.$el.find("li > a").each(function(){
			var anchor$ = jQuery(this);
			that.collection.each(function(model){
				var value = model.get(valueAttr);

				if (anchor$.next().val() === value){
					if (model.get(selectionAttr)){
						that.uiItemSelected(anchor$[0]);
					} else {
						that.uiItemDeselected(anchor$[0]);
					}
				}
			});
		});
		return this;
	}

});

OpenGeoportal.Views.CollectionMultiSelectWithCheckbox = OpenGeoportal.Views.CollectionMultiSelect.extend({
	getTemplateParams: function(){
		var menuHtml = "";	
		var buttonLabel = this.getButtonLabel();
		var template = OpenGeoportal.ogp.appState.get("template");
		var valueAttr = this.getValueAttribute();
		var displayAttr = this.getDisplayAttribute();
		var itemClass = this.getItemClass();
		var iconRenderer = this.options.iconRenderer;
		var controlClass = this.options.controlClass;
		var selectionAttr = this.getSelectionAttribute();
		var collectionFilter = this.options.collectionFilter;
		
		this.collection.each(function(currModel){
			if (typeof  collectionFilter != "undefined"){
				if(currModel.get(collectionFilter.attr) !== collectionFilter.val){
					return;
				}
			}
			
			var value = currModel.get(valueAttr);
			var name = currModel.get(displayAttr);
			var icon = iconRenderer(value);
			var isSelected = "checkOff";
			if (currModel.get(selectionAttr)){
				isSelected = "checkOn";
			}
			var control = template.genericControl({displayClass: isSelected, controlClass: controlClass, text: "", tooltip: ""});
			menuHtml += template.controlMenuItem({icon: icon, control: control, name: name, value: value, className: itemClass});
		});

		return {menuHtml: menuHtml, buttonLabel: buttonLabel};
	},
	uiItemSelected: function(thisObj){
		jQuery(thisObj).addClass("selected");
		jQuery(thisObj).find(".checkOff").removeClass("checkOff").addClass("checkOn");
	},
	uiItemDeselected: function(thisObj){
		jQuery(thisObj).removeClass("selected");
		jQuery(thisObj).find(".checkOn").removeClass("checkOn").addClass("checkOff");
	}
});

OpenGeoportal.Views.Sort = OpenGeoportal.Views.AbstractSelectMenu.extend({
	initialize: function() {
		this.listenTo(this.model, "change", this.setValue);
		this.listenTo(this.model, "change", this.render);
		this.initRender();
		this.render();
	},
	getTemplateParams: function(){
		var menuHtml = "";	
		var colName = this.model.get("column");		
		var buttonLabel = this.getButtonLabel();
		var displayAttr  = "displayName";
		var valueAttr = "columnName";
		var template = OpenGeoportal.ogp.appState.get("template");		
		
		var headings = OpenGeoportal.ogp.resultsTableObj.tableHeadingsObj;
		headings.each(function(currModel){

			if (!currModel.get("organize")){
				return;
			}
			
			var value = currModel.get(valueAttr);
			var name = currModel.get(displayAttr);
			var selected = "";

			if (colName.toLowerCase() == value.toLowerCase()){
				selected = "selected";
			}
			menuHtml += template.simpleMenuItem({name: name, value: value, className: selected});
		});
		return {menuHtml: menuHtml, buttonLabel: buttonLabel};
	},
	selectCallback: function(event, ui, context){
		this.model.setColumn(ui.item.find("input[type=hidden]").first().val());
	},
	setValue: function(){
		this.$el.attr("ogpValue", this.model.get("column"));
		this.$el.trigger("change");
	},
	render: function(){
		var that = this;
		var menuHtml = "";	
		var colName = this.model.get("column");	
		var direction = this.model.get("direction"); //TODO: should render an arrow, up or down, for the selected column
		var headings = OpenGeoportal.ogp.resultsTableObj.tableHeadingsObj;
		var currModel = headings.findWhere({columnName: colName});
		var name = "";
		if (currModel.has("displayName")){
			name = currModel.get("displayName");
		} else {
			name = currModel.get("header");
		}
		this.$el.find(".select").first().button( "option", "label", name );
		this.$el.find("li > a").each(function(){
			if (jQuery(this).next().val() == colName){
				that.uiItemSelected(this);
			} else {
				that.uiItemDeselected(this);
			}
		});
		//the render should also remove "selected" for all and add "selected" for the selected item
		return this;
	}
});
