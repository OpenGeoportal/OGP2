/**
 * This javascript module creates all the global objects, namespaces them
 * It is the main function of the OGP application
 *
 * author: Chris Barnett
 *
 */

if (typeof OpenGeoportal === 'undefined') {
    OpenGeoportal = {};
} else if (typeof OpenGeoportal !== "object") {
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

            var userState = OpenGeoportal.Config.userStateBootstrap || {};

            var hasUserState = !_.isEmpty(userState);
            console.log('bootstrapped state');
            console.log(userState);

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
            var prev = null;
            if (_.has(userState, "previewed")) {
                prev = userState.previewed;
            }
            ogp.previewed = new OpenGeoportal.PreviewedLayers(prev);
            ogp.userState.listenForModelUpdates("previewed", ogp.previewed, "add remove");

            var rq = null;
            if (_.has(userState, "requestQueue")) {
                rq = userState.requestQueue;
            }
            ogp.requestQueue = new OpenGeoportal.RequestQueue(rq);

            ogp.userState.listenForModelUpdates("requestQueue", ogp.requestQueue, "add remove");

            var cart = null;
            if (_.has(userState, "cart")) {
                cart = userState.cart;
            }
            ogp.cart = new OpenGeoportal.CartCollection(cart, {
                userAuth: ogp.login.model,
                template: OpenGeoportal.Template,
                widgets: OpenGeoportal.Widgets
            });

            ogp.userState.listenForModelUpdates("cart", ogp.cart, "add remove");


            ogp.indicator = new OpenGeoportal.Views.RequestQueueLoadIndicatorView({
                collection: ogp.requestQueue,
                template: OpenGeoportal.Template
            });

            /*
             // handles behavior of "frame elements", like expansion of
             // advanced search area, left panel
             */
            var panel = null;
            if (_.has(userState, "panel")) {
                panel = userState.panel;
            }

            ogp.panel = new OpenGeoportal.Models.LeftPanel(panel);

            ogp.userState.listenForModelUpdates("panel", ogp.panel, "change:currentTab change:openWidth change:mode");


            /*
             Create the map
             */

            var mapState = null;
            if (_.has(userState, "map")) {
                mapState = userState.map;
            }

            ogp.mapState = new OpenGeoportal.Models.MapState(mapState);

            ogp.userState.listenForModelUpdates("map", ogp.mapState, "change");

            try {

                ogp.map = new OpenGeoportal.MapController({
                    template: OpenGeoportal.Template,
                    previewed: ogp.previewed,
                    requestQueue: ogp.requestQueue,
                    config: OpenGeoportal.Config,
                    mapState: ogp.mapState
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
             create the cart views
             */


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

            /*
            todo: think through query state. do we want to persist query terms, dropdown values, history across reloads?
            todo: also, make sure that UI reflects loaded state
            */
            var query = null;
            if (_.has(userState, "query")) {
                query = userState.query;
            }


            // model that holds state for query terms
            ogp.queryTerms = new OpenGeoportal.Models.QueryTerms(query, {
                config: OpenGeoportal.Config
            });

            ogp.userState.listenForModelUpdates("query", ogp.queryTerms, "change");


            ogp.search = new OpenGeoportal.Views.Query({
                model: ogp.queryTerms,
                el: "form#searchForm",
                widgets: ogp.widgets,
                tableControls: ogp.tableControls,
                map: ogp.map,
                ready: [ogp.map.ready]
            });


            ogp.facets = new OpenGeoportal.FacetCollection();
            // The collection that holds search
            // results

            ogp.results = new OpenGeoportal.ResultsCollection(null, {
                previewed: ogp.previewed,
                facets: ogp.facets,
                queryTerms: ogp.queryTerms,
                sort: new OpenGeoportal.TableSortSettings()
            });


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

                // todo: integrate this with userState.
                var hasSharedLayers = ogp.cartView.addSharedLayers();

                // introFlow dictates behavior of info
                // bubbles, first search opens Search
                // Results, etc.
                ogp.structure.introFlow({
                    sharedLayers: hasSharedLayers,
                    userState: hasUserState,
                    results: ogp.results
                });
            });

            /* downtime notice --does this still work? */
            // ogp.ui.showDowntimeNotice();
        });
