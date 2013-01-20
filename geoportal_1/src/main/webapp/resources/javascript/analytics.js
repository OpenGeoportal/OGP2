if (typeof org == 'undefined'){ 
	org = {};
} else if (typeof org != "object"){
	throw new Error("org already exists and is not an object");
}

// Repeat the creation and type-checking code for the next level
if (typeof org.OpenGeoPortal == 'undefined'){
	org.OpenGeoPortal = {};
} else if (typeof org.OpenGeoPortal != "object"){
    throw new Error("org.OpenGeoPortal already exists and is not an object");
}
/*org.OpenGeoPortal.Analytics
*	object to hold analytics methods; current impl is a wrapper for google analytics;
*/
org.OpenGeoPortal.Analytics = (function(){

	var instance;

	window._gaq || (window._gaq = []);

	function init() {
		var googleAnalyticsId = org.OpenGeoPortal.InstitutionInfo.getGoogleAnalyticsId();

		if (googleAnalyticsId) {
			// add google analytics to page, the site's google analytics id goes in ogpConfig.js
			window._gaq.push(['_setAccount', googleAnalyticsId]);
			window._gaq.push(['_trackPageview']);

			(function() {
				var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
				ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
				var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
			})();
		}
	}

	function Analytics() {
		//Prevent GA script tag from being added more than once
		if (!instance) {
			instance = init() || true;
		}

		/**
		 * Wraps Google Analytics _trackEvent method. Accepts a variable number
		 * 	of arguments, the first four of which will be submitted along with
		 * 	the _trackEvent call.
		 * @public
		 */
		this.track = function() {
			var args = ['_trackEvent'];

			args = args.concat(Array.prototype.slice.call(arguments, 0, 4));

			window._gaq.push(args);
		}
	}

	return Analytics;

})();
