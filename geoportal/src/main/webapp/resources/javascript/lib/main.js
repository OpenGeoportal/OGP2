/**
 * This javascript module creates all the global objects, namespaces them
 * It is the main function of the OGP application
 *
 * author: Chris Barnett
 *
 */

if (typeof OpenGeoportal == 'undefined') {
    OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object") {
    throw new Error("OpenGeoportal already exists and is not an object");
}

$(document)
    .ready(
        function () {

            //add support for csrf tokens in ajax requests via jQuery
            var token = $("meta[name='_csrf']").attr("content");
            var header = $("meta[name='_csrf_header']").attr("content");
            $(document).ajaxSend(function (e, xhr, options) {
                xhr.setRequestHeader(header, token);
            });


            // ogp will hold instances
            OpenGeoportal.ogp = {};
            var ogp = OpenGeoportal.ogp; // an alias

            //Initialize widgets object with commonly used UI widgets
            ogp.widgets = new OpenGeoportal.Widgets(OpenGeoportal.Template);

            //Initialize controls and icons shown in tables
            ogp.tableControls = new OpenGeoportal.TableItems({
                template: OpenGeoportal.Template,
                config: OpenGeoportal.Config
            });


            //Initialize user state object. Holds client info that gets saved to the session
            ogp.userState = new OpenGeoportal.UserState();
            ogp.userState.setInstance(ogp);

            var userState = OpenGeoportal.Config.userStateBootstrap || {};
            var hasUserState = !_.isEmpty(userState);


            /*
             Handles client portion of authentication and authorization
             */
            var user = new OpenGeoportal.Models.User({}, {
                config: OpenGeoportal.Config
            });

            ogp.login = new OpenGeoportal.Views.Login({
                model: user
            });


            //Collection of previewed layers
            ogp.previewed = new OpenGeoportal.PreviewedLayers();

            ogp.requestQueue = new OpenGeoportal.RequestQueue();


            ogp.indicator = new OpenGeoportal.Views.RequestQueueLoadIndicatorView({
                collection: ogp.requestQueue,
                template: OpenGeoportal.Template
            });

            /*
             // handles behavior of "frame elements", like expansion of
             // advanced search area, left panel
             */
            ogp.panel = new OpenGeoportal.Models.LeftPanel();
            if (hasUserState) {
                ogp.panel.set("mode", "open");
            }

            /*
             Create the map
             */

            try {

                ogp.map = new OpenGeoportal.MapController({
                    template: OpenGeoportal.Template,
                    previewed: ogp.previewed,
                    requestQueue: ogp.requestQueue,
                    config: OpenGeoportal.Config,
                    panel: ogp.panel
                });
                ogp.map.initMap("map");

            } catch (e) {
                console.log("problem creating the map...");
                console.log(e);
            }


            /*
             Some ui related objects
             */
            ogp.structure = new OpenGeoportal.Structure({
                template: OpenGeoportal.Template,
                panelModel: ogp.panel
            });
            ogp.structure.init();

            /*
             If there is user state passed from the session, bootstrap here.
             */
            var bootstrapModels = new OpenGeoportal.BootstrapModels(ogp);
            bootstrapModels.bootstrapUserState(userState);

            /*
             create the cart collections and views
             */
            ogp.cart = new OpenGeoportal.CartCollection([], {
                userAuth: ogp.login.model,
                template: OpenGeoportal.Template,
                widgets: OpenGeoportal.Widgets
            });

            new OpenGeoportal.Views.CartHeader({
                collection: ogp.cart,
                el: $("#cartHeader"),
                widgets: ogp.widgets,
                template: OpenGeoportal.Template
            });

            ogp.cartView = new OpenGeoportal.Views.CartTable({
                collection: ogp.cart,
                el: $("#cart"),
                template: OpenGeoportal.Template,
                tableControls: ogp.tableControls,
                userAuth: ogp.login.model,
                previewed: ogp.previewed,
                config: OpenGeoportal.Config
            });


            /*
             bootstrap Search related objects
             */
            // model that holds state for query terms
            ogp.queryTerms = new OpenGeoportal.Models.QueryTerms({}, {
                config: OpenGeoportal.Config
            });

            ogp.search = new OpenGeoportal.Views.Query({
                model: ogp.queryTerms,
                el: "form#searchForm"
            });

            // The collection that holds search
            // results
            try {

                var resParams = {
                    previewed: ogp.previewed,
                    queryTerms: ogp.queryTerms,
                    sort: new OpenGeoportal.TableSortSettings()
                };
                ogp.results = new OpenGeoportal.ResultsCollection(resParams);
            } catch (e) {
                console.log(e);
            }

            //Holds app-wide state for previewed layers... opacity, color, etc.
            ogp.layerState = new OpenGeoportal.TableRowSettings();


            /*
             Some objects should be created only once the map is ready
             */
            ogp.map.ready.then(function () {

                $(".introMask").fadeOut('fast');

                // The search results table

                ogp.resultsTableObj = new OpenGeoportal.Views.SearchResultsTable(
                    {
                        collection: ogp.results,
                        el: $("#searchResults"),
                        template: OpenGeoportal.Template,
                        tableControls: ogp.tableControls,
                        layerState: ogp.layerState,
                        userAuth: ogp.login.model,
                        previewed: ogp.previewed,
                        cart: ogp.cart
                    });

                // if the url is a share link, add the
                // shared layers to the cart
                var hasSharedLayers = ogp.cartView.addSharedLayers();

                // introFlow dictates behavior of info
                // bubbles, first search opens Search
                // Results, etc.
                ogp.structure.introFlow({
                    sharedLayers: hasSharedLayers,
                    userState: hasUserState
                });
            });

            /* downtime notice --does this still work? */
            // ogp.ui.showDowntimeNotice();
        });
