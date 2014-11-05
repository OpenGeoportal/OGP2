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
		
		var img_keys = this.handleImages(pageData.attributes);
		var download_keys = this.handleDownloads(pageData.attributes);
		
		content = template.attributeTable({
			previews: img_keys,
			downloads: download_keys,
			page: this.page + 1, //0 based index
			totalPages: this.collection.length,
			title : this.collection.title,
			tableContent : pageData.attributes
		});
		
		return content;
		
	},
	
	handleImages: function(attrs){
		// http://ims.er.usgs.gov/gda_services/download?item_id=5636170&response_type=jpeg
		var that = this;
		var lst = [];
		_.each(attrs, function(value, key, list){
			value = value.trim().toLowerCase();
			if (that.isLink(value) && that.containsAny(value, [".png", ".gif", ".jpg", "response_type=jpeg"])){
				// store the raw value
				lst.push(that.getHref(value));
				// update the attribute list with link
				attrs[key] = that.renderLink(value);
			}
		});
		return lst;
	},
	
	handleDownloads: function(attrs){
		// http://ims.er.usgs.gov/gda_services/download?item_id=5636169

		var lst = [];
		var that = this;
		_.each(attrs, function(value, key, list){
			value = value.trim().toLowerCase();
			if (that.isLink(value) && that.containsAny(value, [".zip", ".gz.tar", "download?"])){
				//filter out the preview image from usgs topos
				if (value.indexOf('response_type=jpeg') !== -1){
					return;
				}
				// store the raw value
				lst.push(that.getHref(value));
				// update the attribute list with link
				attrs[key] = that.renderLink(value);
			}
		});
		
		return lst;
	},
	
	isLink: function(str){
		if (str.indexOf("http") === 0 || str.indexOf("href") !== -1){
			return true;
		} else {
			return false;
		}
	},
	
	getHref: function(str){
		if (str.indexOf("href") !== -1){
			return jQuery(str).attr("href");
		} else {
			return str
		}
	},
	
	containsAny: function(str, arr){
		var contains = false;
		_.each(arr, function(i){
			if (str.indexOf(i) !== -1){
				contains = true;
				return;
			}
		});
		return contains;
	},
	
	renderLink: function(ref){
		var link = "";
		if (ref.indexOf('href') !== -1){
			link = ref;
		} else {
			link = '<a href="' + ref + '" download>' + ref + '</a>';
		}
		return link;
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
			},
			resize: function( event, ui ) {
				that.adjustTableHeight();
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
	
	adjustTableHeight: function(){
		var header = this.$el.find(".attrHeader");
		var others = header.height() + parseInt(header.css("padding-top")) + parseInt(header.css("padding-bottom"));
		var hgt = this.$el.height() - others;
		this.$el.find(".attrContainer").height(hgt);	
	},
	
	renderAttributeDialog: function(dialogContent){

		if (!this.dialogInitialized){
			this.initRender();
		}

		this.$el.html(dialogContent);
		this.adjustTableHeight();
		this.$el.find(".attrExtrasContainer .button").button();
		this.startSpinner();

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

	},
	
	onImageLoad : function(){
		var that = this;
		this.$el.find('.attrPreview img').on('load', function(){
			if (that.$el.find('.loading').is(":visible")){
				that.$el.find('.loading').hide();
				that.stopSpinner();				 
			}	
		});

	},

	
	startSpinner : function(){
		this.onImageLoad();
		Spinners.create(this.$el.find('.loading'), {
			radius: 5,
			height : 5,
			width : 5,
			dashes : 8,
			color : '#4E4E4F'
			}).play();
	},
	
	stopSpinner : function(){
		Spinners.get(this.$el.find('.loading')).remove();
	}

});


	

