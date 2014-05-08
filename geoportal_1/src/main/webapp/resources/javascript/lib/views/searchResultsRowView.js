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

OpenGeoportal.Views.SearchResultsRow = OpenGeoportal.Views.LayerRow.extend({

	events : {
		"click .viewMetadataControl" : "viewMetadata",
		"click .previewControl" : "togglePreview",
		"click .colExpand" : "toggleExpand",
		"click .colTitle" : "toggleExpand",
		"mouseover" : "doMouseoverOn",
		"mouseout" : "doMouseoverOff",
		"click .saveControl" : "toggleSave"
			
	},

	subClassInit: function(){
		//listen for saved items (in cart collection)
		this.cart = OpenGeoportal.ogp.appState.get("cart");

	},

	toggleSave: function(){
		//if not in cart, add it.  if in cart, remove it.
		this.cart.toggleCartState(this.model);
		this.render();
	}
});
