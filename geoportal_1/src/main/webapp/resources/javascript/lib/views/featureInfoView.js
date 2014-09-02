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


OpenGeoportal.Views.LayerAttributeView = Backbone.View.extend({
	className: "dialog",
	
	events: {
		"click .prev": "goPrev",
		"click .next": "goNext",
		"mouseenter td.attributeName": "attributeDescriptionMouseover"
	},
	
	initialize: function(){
		this.listenTo(this.collection, "reset", this.render);
		this.template = OpenGeoportal.ogp.template;
	},

	page: 0,
	
	goPrev: function(){
		if (this.page > 0){
			this.page--;
			this.render();	
		}
	},
	
	goNext: function(){
		if (this.page + 1 < this.collection.length){
			this.page++;
			this.render();
		}
	},
	
	createFeatureAttributeHtml: function(){

		if (this.collection.length === 0){
			return '<p>There is no data for "' + this.collection.title
			+ '" at this point.</p>';
		}
		
		var content = "";
		var template = this.template;

		var pageData = this.collection.at(this.page);
		
		content = template.attributeTable({
			page: this.page + 1, //0 based index
			totalPages: this.collection.length,
			title : this.collection.title,
			tableContent : pageData.attributes
		});
		
		return content;
		
	},
	
	dialogInitialized: false,
	
	initRender: function(){
		
		this.dialogInitialized = true;
		// create a new dialog instance
		jQuery("#dialogs").append(this.$el);


		// limit the height of the dialog. some layers will have hundreds of
		// attributes
		var containerHeight = jQuery("#container").height();

		var linecount = 1;
		
		if (this.collection.length !== 0){
			linecount = _.size(this.collection.at(0).attributes); //should be the number of attributes for the feature
		}
		
		var dataHeight = linecount * 20;
		if (dataHeight > containerHeight) {
			dataHeight = containerHeight;
		} else {
			dataHeight = "auto";
		}
		
		//console.log(dataHeight);
		
		var that = this;
		
		this.$el.dialog({
			zIndex : 2999,
			title : "Feature Attributes",
			width : 'auto',
			height: dataHeight,
			dialogClass: "attributesDialog",
			autoOpen : false,
			show: { duration: 200 },
			close: function( event, ui ) {
				that.close();
			}
		});
		
		this.$el.dialog('open');
	},
	
	close: function(){
		this.collection.stopListening();
		//in case close is called before the dialog is instantiated
		if (typeof this.$el.dialog("instance") !== "undefined"){
			this.$el.dialog("destroy");
		}
		this.remove();
	},
	
	renderAttributeDialog: function(dialogContent){

		if (!this.dialogInitialized){
			this.initRender();
		}

		this.$el.html(dialogContent);

	},
	
	render: function(){
		var content = this.createFeatureAttributeHtml();
		this.renderAttributeDialog(content);
		return this;
	},

	attributeDescriptionMouseover: function(e) {
		// mouseover to display attribute descriptions
		var def = this.collection.dictionary.get(jQuery(e.currentTarget).text().trim());
		if (typeof def === "undefined" || def.length === 0){
			def = "No description provided.";
		}
		jQuery(e.currentTarget).attr('title', def);

	}

});


	

