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
        //render the dialog when the collection has been fetched
		this.listenTo(this.collection, "reset", this.render);
		this.template = OpenGeoportal.Template;
	},

	page: 0,

    /**
     * paging controls. Go to the previous feature in the result set
     */
	goPrev: function(){
		if (this.page > 0){
			this.page--;
			this.render();	
		}
	},

    /**
     * paging controls. Go to the next feature in the result set
     */
	goNext: function(){
		if (this.page + 1 < this.collection.length){
			this.page++;
			this.render();
		}
	},

    dictionary: {},
    setDictionaryPromise: function (promise) {
        var that = this;
        promise.done(function (data) {
            that.dictionary = data;
        });
    },
    /**
     * create the HTML for the dialog
     * @returns {*}
     */
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
		
		content = template.get('attributeTable')({
			previews: img_keys,
			downloads: download_keys,
			page: this.page + 1, //0 based index
			totalPages: this.collection.length,
			title : this.collection.title,
			tableContent : pageData.attributes
		});
		
		return content;
		
	},

    /**
     * iterate over the attributes and render any links to images
     * @param attrs
     * @returns {Array}
     */
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

    /**
     * iterate over the attributes and render any links to downloads
     * @param attrs
     * @returns {Array}
     */
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

    /**
     * Determin if the string is a link
     * @param str
     * @returns {boolean}
     */
	isLink: function(str){
		if (str.indexOf("http") === 0 || str.indexOf("href") !== -1){
			return true;
		} else {
			return false;
		}
	},

    /**
     * Get the href attribute from a string. The feature attribute value may be an html img tag.
     * @param str
     * @returns {*}
     */
	getHref: function(str){
		if (str.indexOf("href") !== -1){
            return $(str).attr("href");
		} else {
			return str
		}
	},
	
	containsAny: function(str, arr){
		var contains = false;
		_.each(arr, function(i){
			if (str.indexOf(i) !== -1){
				contains = true;

			}
		});
		return contains;
	},

    /**
     * Render a download link from feature attribute value as an html 'a' element
     * @param ref
     * @returns {string}
     */
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

    getMaxSize: function () {
        var size = {};
        var $container = $("#container");
        var fullWidth = $container.width();
        size.w = fullWidth - ((fullWidth - $("#left_col").width()) * 2 / 5);
        size.h = $container.height() * 1 / 3;

        return size;
    },

    initDialog: function () {
		
		this.dialogInitialized = true;
		// create a new dialog instance
        $("#dialogs").append(this.$el);


		// limit the height of the dialog. some layers will have hundreds of
		// attributes
        $container = $("#container");
        var containerHeight = $container.height();

		var linecount = 1;
		
		if (this.collection.length !== 0){
			linecount = _.size(this.collection.at(0).attributes); //should be the number of attributes for the feature
		}

        var maxsize = this.getMaxSize();

        /*		var dataHeight = linecount * 20;
		if (dataHeight > containerHeight) {
			dataHeight = containerHeight;
		} else {
			dataHeight = "auto";
         }*/

        //TODO: calculate the size as the Math.min of maxsize and content size, maxWidth and maxSize should come from content size

		var that = this;
		
		this.$el.dialog({
			zIndex : 2999,
			title : "Feature Attributes",
            containment: $container,
            minWidth: 350,
            minHeight: 175,
            maxWidth: maxsize.w,
            maxHeight: maxsize.h,
            width: 'auto',
            height: 'auto',
			dialogClass: "attributesDialog",
			autoOpen : false,
			show: { duration: 200 },
            position: {my: "right bottom", at: "right-10 bottom-75", of: $("#map")},
			close: function( event, ui ) {
				that.close();
			},
			resize: function( event, ui ) {
				that.adjustTableHeight();
			}
		});
		
	},

    /**
     * close and clean up the view and jquery ui dialog
     */
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


    render: function () {

        this.$el.html(this.createFeatureAttributeHtml());

        if (!this.dialogInitialized) {
            this.initDialog();
        }

        this.$el.dialog('open');

        this.adjustTableHeight();
        this.$el.find(".attrExtrasContainer .button").button();
        this.startSpinner();

		return this;
	},

    /**
     * Fetch the feature attribute collection
     * @param view {OpenGeoportal.LayerAttributeView}
     * @param params
     */
    fetchAttributes: function (params) {
        //destroy any existing attribute views & collections, abort ongoing requests if possible
        return this.collection.fetch({
            data: params,
            reset: true,
            beforeSend: function () {
                $(document).trigger({type: "showLoadIndicator", loadType: "getFeature", layerId: params.ogpid});

            },
            complete: function () {
                $(document).trigger({type: "hideLoadIndicator", loadType: "getFeature", layerId: params.ogpid});
            }
        });
    },

    /*    //TODO: write feature to geojson code
     fetchGeometry: function(params){
     var ajaxParams = {};
     //retrieve geojson for feature
     return $.ajax(ajaxParams);
     },*/
    /**
     * mouseover to display attribute descriptions.  The dictionary model has been populated with values from the xml
     * metadata
     *
     * @param e event
     */
	attributeDescriptionMouseover: function(e) {
		// mouseover to display attribute descriptions
        var def = this.dictionary[$(e.currentTarget).text().trim()];
		if (typeof def === "undefined" || def.length === 0){
			def = "No description provided.";
		}
        $(e.currentTarget).attr('title', def);

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


	

