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
	constructor: function (options) {
		//allow options to be passed in the constructor argument as in previous Backbone versions.
		    this.options = options;
		    Backbone.View.apply(this, arguments);
		  },
		  events: {
			  "click .select" : "toggleMenu",
			  "blur .ui-menu" : "hideMenu"
		  },
	uiInit: function(selectFunction){
		var that = this;
		this.$el.addClass("dropdown").attr("ogpSelectMenu", true);
		this.$el.find(".select").first().button({
			icons: {
				secondary: "ui-icon-triangle-1-s"
			}
		})
		.parent()
		.buttonset()
		.next('ul')
		.hide()
		.menu( {
			select: function(event, ui){that.selectCallback(event, ui, that);},
			position :{
				my: "left top",
				at: "left bottom",
				of: this
			}
		});
	},
	hideMenu: function(){
		var menu$ = this.$el.find(".ui-menu");
		menu$.slideUp({duration: 100});
		jQuery(document).off("focusin.dropdown click.dropdown");
	},
	showMenu: function(){
		var menu$ = this.$el.find(".ui-menu");
		var that = this;

		menu$.slideDown({
			duration: 100,
			done: function(){
				menu$.menu("focus", null, menu$.find( ".ui-menu-item:first" ) );
				menu$.find( ".ui-menu-item > a:first" ).focus();
				jQuery(document).on("focusin.dropdown click.dropdown", function(e){
					if (!$(e.target).parents(menu$).is(menu$) && !$(e.target).is(menu$) 
							&& !$(e.target).parent().siblings(menu$).is(menu$)){
						that.hideMenu();
					}
				});
			}			
		});
	},
	toggleMenu: function(e){
		e.preventDefault;
		
		var menu$ = this.$el.find(".select").first().parent().next();
		if (menu$.css("display") != "none"){
			this.hideMenu();
		} else {
			this.showMenu();
		}
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
		this.template = OpenGeoportal.ogp.template;
		this.$el.html(this.template.styledSelectBody(this.getTemplateParams()));

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
		var valueAttr = this.getValueAttribute();
		var displayAttr = this.getDisplayAttribute();
		var itemClass = this.getItemClass();
		var that = this;
		this.collection.each(function(currModel){
			var value = currModel.get(valueAttr);
			var name = currModel.get(displayAttr);
			menuHtml += that.template.simpleMenuItem({name: name, value: value, className: itemClass});
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
	
	changeSelected: function(newVal){
		var valueAttr = this.getValueAttribute();
		var selectAttr = this.getSelectionAttribute();

		var prevSelected = this.collection.find(function(model) {
			return model.get(selectAttr) == true;
		});
		prevSelected.set(selectAttr, false);//, {silent: true});//just trigger the listener once
		
		var selModel = this.collection.find(function(model) {
			return model.get(valueAttr) === newVal;
		});
		selModel.set(selectAttr, true);


		this.setValue();
		this.$el.find("ul.ui-menu").hide();
	},
	
	selectCallback: function(event, ui, context){

		var selValue = ui.item.find("input[type=hidden]").first().val();
		this.changeSelected(selValue);
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
	  events: {
		  "click .select" : "toggleMenu",
		  //"focusout .ui-menu" : "hideMenu",
		  "click .showOnly": "showOnly",
		  "click .showAll": "selectAll",
		  "focus .select" : "toggleMenu"
	},
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
		var valueAttr = this.getValueAttribute();
		var displayAttr = this.getDisplayAttribute();
		var itemClass = this.getItemClass();
		var that = this;
		this.collection.each(function(currModel){
			var value = currModel.get(valueAttr);
			var name = currModel.get(displayAttr);
			menuHtml += that.template.simpleMenuItem({name: name, value: value, className: itemClass});
		});
		return {menuHtml: menuHtml, buttonLabel: buttonLabel};
	},
	lastFocus: null,
	selectCallback: function(event, ui, context){
		var valueAttr = this.getValueAttribute();
		this.lastFocus = ui.item;
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
	showOnly: function(e){
		this.unselectAll();
		var selValue = jQuery(e.target).closest(".ui-menu-item").find("input[type=hidden]").first().val();
		this.selectItem(selValue);
		
	},
	selectItem: function(itemVal){
		var valueAttr = this.getValueAttribute();
		var selectAttr = this.getSelectionAttribute();
		
		var selModel = this.collection.find(function(model) {
			return model.get(valueAttr) === itemVal;
		});
		selModel.set(selectAttr, true);

	},
	
	unselectItem: function(newVal){
		var valueAttr = this.getValueAttribute();
		var selectAttr = this.getSelectionAttribute();
		
		var selModel = this.collection.find(function(model) {
			return model.get(valueAttr) === itemVal;
		});
		selModel.set(selectAttr, false);

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
		if (this.lastFocus !== null){
			$(".ui-menu" ).menu( "focus", null, this.lastFocus );
		}
		return this;
	}

});

OpenGeoportal.Views.CollectionMultiSelectWithCheckbox = OpenGeoportal.Views.CollectionMultiSelect.extend({

	//note: some inherited functions don't take the collectionFilter into account
	getTemplateParams: function(){
		var menuHtml = "";	
		var buttonLabel = this.getButtonLabel();
		var valueAttr = this.getValueAttribute();
		var displayAttr = this.getDisplayAttribute();
		var itemClass = this.getItemClass();
		var iconRenderer = this.options.iconRenderer;
		var controlClass = this.options.controlClass;
		var selectionAttr = this.getSelectionAttribute();


		var collectionFilter = this.options.collectionFilter;

		var extraControl = "";
		
		if (typeof this.options.showOnly !== "undefined" && this.options.showOnly){
			extraControl = this.template.showOnlyControl();
			//make sure we start in the right state
			this.checkSelected();
			//if using 'only' and 'select all' controls, do a check on selection to see if all are selected
			var selectionEvent = "change:" + selectionAttr;
			this.listenTo(this.collection, selectionEvent, this.checkSelected);
		}
		
		var that = this;
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

			var control = extraControl + that.template.genericControl({displayClass: isSelected, controlClass: controlClass, text: "", tooltip: ""});
			menuHtml += that.template.controlMenuItem({icon: icon, control: control, name: name, value: value, className: itemClass});
		});

		var params = {menuHtml: menuHtml, buttonLabel: buttonLabel};
		
		if (typeof this.options.showOnly !== "undefined" && this.options.showOnly){
			params.caption = this.template.selectAllCaption();
		}
		
		return params;
	},
	selectAll: function(){
		
		var selectAttr = this.getSelectionAttribute();
		var collectionFilter = this.options.collectionFilter;
		this.collection.each(function(model){
			if (typeof collectionFilter != "undefined"){
				if(model.get(collectionFilter.attr) !== collectionFilter.val){
					return;
				}
			}
			model.set(selectAttr, true);
		});
		
	},
	
	unselectAll: function(){
		
		var selectAttr = this.getSelectionAttribute();
		var collectionFilter = this.options.collectionFilter;
		
		this.collection.each(function(model){
			if (typeof collectionFilter != "undefined"){
				if(model.get(collectionFilter.attr) !== collectionFilter.val){
					return;
				}
			}
			model.set(selectAttr, false);
		});
	},
	allSelected: function(){
		var selectAttr = this.getSelectionAttribute();
		var collectionFilter = this.options.collectionFilter;

		var all = true;
		this.collection.each(function(model){
			if (typeof collectionFilter != "undefined"){
				if(model.get(collectionFilter.attr) !== collectionFilter.val){
					return;
				}
			}
			if (!model.get(selectAttr)){
				all = false;
				return;
			}
		});
		
		return all;
	},
	noneSelected: function(){
		var selectAttr = this.getSelectionAttribute();
		var collectionFilter = this.options.collectionFilter;

		var all = true;
		this.collection.each(function(model){
			if (typeof collectionFilter != "undefined"){
				if(model.get(collectionFilter.attr) !== collectionFilter.val){
					return;
				}
			}
			if (model.get(selectAttr)){
				all = false;
				return;
			}
		});
		
		return all;
	},
	checkSelected: function(){
		//use visibility here so we don't disturb the formatting
		if (this.allSelected()){
			this.$el.find(".showAll").css("visibility", "hidden");
			this.$el.prev('label').addClass("offsetColor");
		} else {
			this.$el.find(".showAll").css("visibility", "visible");
			this.$el.prev('label').removeClass("offsetColor");
		}
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
		this.headings = this.options.headings;
		this.listenTo(this.model, "change", this.setValue);
		this.listenTo(this.model, "change", this.render);
		this.initRender();
		this.render();
	},
	getTemplateParams: function(){
		var menuHtml = "";	
		var colName = this.model.get("column");		
		var buttonLabel = "Sort Results";
		var displayAttr  = "displayName";
		var valueAttr = "columnName";
		var that = this;

		this.headings.each(function(currModel){

			if (!currModel.get("organize")){
				return;
			}
			
			var value = currModel.get(valueAttr);
			var name = currModel.get(displayAttr) + '<div class="sortArrows"></div>';
			
			var selected = "";

			if (colName.toLowerCase() == value.toLowerCase()){
				selected = "selected";
			}
			menuHtml += that.template.simpleMenuItem({name: name, value: value, className: selected});
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
		var direction = this.model.get("direction"); //"asc" or "desc"
		var currModel = this.headings.findWhere({columnName: colName});
		var name = "";
		if (currModel.has("displayName")){
			name = currModel.get("displayName");
		} else {
			name = currModel.get("header");
		}
		//this.$el.find(".select").first().button( "option", "label", name );
		this.$el.find("li > a").each(function(){
			var sort$ = jQuery(this).find(".sortArrows");
			sort$.removeClass("sortDown sortUp");
			if (jQuery(this).next().val() == colName){
				that.uiItemSelected(this);
				if (direction === "asc"){
					sort$.addClass("sortUp");
				} else if (direction === "desc"){
					sort$.addClass("sortDown");
				}
			} else {
				that.uiItemDeselected(this);
			}
		});
		//the render should also remove "selected" for all and add "selected" for the selected item
		return this;
	}
});
