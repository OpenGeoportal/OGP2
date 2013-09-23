if (typeof OpenGeoportal == 'undefined'){
	OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object"){
    throw new Error("OpenGeoportal already exists and is not an object");
}
if (typeof OpenGeoportal.Models == 'undefined'){
	OpenGeoportal.Models = {};
} else if (typeof OpenGeoportal.Models != "object"){
    throw new Error("OpenGeoportal.Models already exists and is not an object");
}


OpenGeoportal.Models.QueryTerms = Backbone.Model.extend({
	defaults: {
		mapExtent: {minX: -180, maxX: 180, minY: -90, maxY: 90},
		ignoreSpatial: false,
		displayRestricted: ["Tufts"],
		sortBy: "score",
		sortDir: "asc",
		what: "",
		where: "",
		keyword: "",
		originator: "",
		dataType: [],
		repository: [],
		dateFrom: null,
		dateTo: null,
		isoTopic: "",
		facets: "",
		searchType: "basic"
	}
});