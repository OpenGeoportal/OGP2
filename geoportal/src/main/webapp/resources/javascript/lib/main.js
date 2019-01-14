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
            if (_.has(userState, "previewed") && userState.previewed.length > 0) {
                prev = userState.previewed;
            }
            ogp.previewed = new OpenGeoportal.PreviewedLayers(prev);
            ogp.userState.registerState("previewed", ogp.previewed);

            var rq = null;
            if (_.has(userState, "requestQueue") && userState.requestQueue.length > 0) {
                rq = userState.requestQueue;
            }
            ogp.requestQueue = new OpenGeoportal.RequestQueue(rq);
            // any requests still in 'REQUESTING' status don't have a requestId, so can't be retrieved currently
            ogp.requestQueue.each(function(request){
               if (request.get("status") === "REQUESTING"){
                   request.set({status: "ABORTED"});
               }
            });
            // resume any mid-process requests
            ogp.requestQueue.checkPoll();

            ogp.userState.registerState("requestQueue", ogp.requestQueue);

            var cart = null;
            if (_.has(userState, "cart") && userState.cart.length > 0) {
                cart = userState.cart;
            }
            ogp.cart = new OpenGeoportal.CartCollection(cart, {
                userAuth: ogp.login.model,
                template: OpenGeoportal.Template,
                widgets: OpenGeoportal.Widgets
            });

            ogp.userState.registerState("cart", ogp.cart);


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

            ogp.userState.registerState("panel", ogp.panel);


            /*
             Create the map
             */

            var mapState = null;
            if (_.has(userState, "map")) {
                mapState = userState.map;
            }

            ogp.mapState = new OpenGeoportal.Models.MapState(mapState);

            ogp.userState.registerState("map", ogp.mapState);

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
            create the metadata viewer
             */

            ogp.metadataViewer = new OpenGeoportal.MetadataViewer();
            ogp.userState.registerCallback('metadataViewer',
                $.proxy(ogp.metadataViewer.getViewerState, ogp.metadataViewer));

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
                metadataViewer: ogp.metadataViewer,
                userAuth: ogp.login.model,
                previewed: ogp.previewed,
                config: OpenGeoportal.Config
            });


            /*
             bootstrap Search related objects
             */

            var query = null;
            if (_.has(userState, "query")) {
                query = userState.query;
            }


            // model that holds state for query terms
            ogp.queryTerms = new OpenGeoportal.Models.QueryTerms(query, {
                config: OpenGeoportal.Config
            });

            ogp.userState.registerState("query", ogp.queryTerms);


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
            var sort = null;
            if (_.has(userState, "resultSort")){
                sort = userState.resultSort;
            }

            var tableSort = new OpenGeoportal.TableSortSettings(sort);

            ogp.results = new OpenGeoportal.ResultsCollection(null, {
                previewed: ogp.previewed,
                facets: ogp.facets,
                queryTerms: ogp.queryTerms,
                sort: tableSort
            });

            ogp.userState.registerState("resultSort", tableSort);

            // restore metadata viewer state
            if (_.has(userState, "metadataViewer")){
                var mvState = userState.metadataViewer;
                if (mvState.viewerOn){
                    var role = mvState.role;
                    var id = mvState.LayerId;
                    // find the model.
                    if (role === "cartItem"){
                        var metadataModel = ogp.cart.findWhere({LayerId: id});
                        if (!_.isUndefined(metadataModel)){
                            ogp.metadataViewer.viewMetadata(metadataModel, role);
                        }
                    } else if (role ==="preview"){
                        var metadataModel = ogp.previewed.findWhere({LayerId: id});
                        if (!_.isUndefined(metadataModel)){
                            ogp.metadataViewer.viewMetadata(metadataModel, role);
                        }
                    } else if (role === "searchResult"){
                        // if results collection, need to wait for res
                        $(document).one("newResults", function(){
                            var metadataModel = ogp.results.findWhere({LayerId: id});
                            if (!_.isUndefined(metadataModel)){
                                ogp.metadataViewer.viewMetadata(metadataModel, role);
                            }
                        });

                    }

                }
            }

            //Holds app-wide state for previewed layers... opacity, color, etc.
            var layerState = null;
            if (_.has(userState, "layerState") && userState.layerState.length > 0){
                layerState = userState.layerState;
            }
            ogp.layerState = new OpenGeoportal.TableRowSettings(layerState);


            ogp.userState.registerState("layerState", ogp.layerState);

            // save the user state before page is unloaded
            $(window).on('beforeunload', ogp.userState.synchronousSave);

            /*
             Some objects should be created only once the map is ready
             */
            ogp.map.ready.then(function () {

                $(".introMask").fadeOut('fast');

                // The search results table
                var columnState = null;
                if (_.has(userState, "columnState")){
                    columnState = userState.columnState;
                }
                ogp.resultsTableObj = new OpenGeoportal.Views.SearchResultsTable(
                    {
                        collection: ogp.results,
                        el: $("#searchResults"),
                        template: OpenGeoportal.Template,
                        tableControls: ogp.tableControls,
                        columnState: columnState,
                        layerState: ogp.layerState,
                        userAuth: ogp.login.model,
                        previewed: ogp.previewed,
                        metadataViewer: ogp.metadataViewer,
                        cart: ogp.cart
                    });

                ogp.userState.registerCallback('columnState',
                    $.proxy(ogp.resultsTableObj.getColumnState, ogp.resultsTableObj));

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
