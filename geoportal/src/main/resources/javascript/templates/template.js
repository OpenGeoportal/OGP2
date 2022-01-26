if (typeof OpenGeoportal == 'undefined') {
	OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object") {
	throw new Error("OpenGeoportal already exists and is not an object");
}

_.templateSettings = {
    interpolate: /\{\{(.+?)\}\}/g,
    evaluate: /\<\%(.+?)\%\>/g
};

OpenGeoportal.Template = {

    cachedTemplates: {},

    // Returns compiled template
    get: function (tplName) {
        // If compiled template already exists, return that
        if (this.cachedTemplates.hasOwnProperty(tplName)) {
            return this.cachedTemplates[tplName];
        }

        if (this.templates.hasOwnProperty(tplName)) {
            // Compile and store the template functions
            this.cachedTemplates[tplName] = _.template(this.templates[tplName]);
        }

        return this.cachedTemplates[tplName];
    },

    templates: {
        cartHeader: ['<div id="optionDetails" class="shadowDown">',
            '<div id="optionText"></div></div>'].join('\n'),

        tableHeader: [
            '<div class="tableHeaders">',
            '<% _.each(headers, function(col) { %><div class="tableCell {{ col.columnClass }}">{{ col.header }}</div><% }); %>',
            '</div>'].join('\n'),

        tableView: ['<div class="tableWrapper">', '{{ tableHeader }}',
            '<div class="rowContainer">', '{{ tableFooter }}', '</div>',
            '</div>'].join('\n'),

        genericDiv: '<div id="{{ elId }}" class="{{ elClass }}" ></div>',

        divNoId: '<div class="{{ elClass }}" ></div>',

        map: ['<div id="mapToolBar">', '<div id="ogpMapButtons">',
            '</div>', '</div>', '<div id="{{ mapId }}OLMap">',
            '{{ renderCorner({elId : "nwCorner", elClass : "corner slideHorizontal"}) }}',
            '{{ renderCorner({elId : "neCorner", elClass : "corner"}) }}',
            '{{ renderCorner({elId : "swCorner", elClass : "corner slideHorizontal"}) }}',
            '{{ renderCorner({elId : "seCorner", elClass : "corner"}) }}',
            '</div>'].join('\n'),

        mapButton: '<button class="mapStyledButton {{ displayClass }}" title="{{ title }}" >{{ buttonText }}</button>',

        loadIndicator: '<div class="loadIndicator"></div>',

        requestIndicator: ['<div class="raised">',
            '<div id="processingIndicator" class="loadIndicator"></div>',
            '<div id="requestTicker" class="loadInfo"></div>', '</div>',
            '</div>'].join('\n'),

        styledSelectBody: [
            '<div class="styledSelect">',
            "<div>",
            '<button class="select"><span class="button-text">{{ obj.buttonLabel }}</span></button>{{ obj.caption }}',
            "</div>", "<ul>{{ obj.menuHtml }}</ul>", '</div>'].join('\n'),

        selectAllCaption: '<div class="showAll offsetColor button">select all</div>',

        simpleMenuItem: ['<li class="{{ className }}"><div><div class="selectTextWrapper">{{ name }}</div>',
            '<input type="hidden" value="{{ value }}" /></div>', '</li>']
            .join('\n'),

        simpleMenuItemSuffix: ['<li class="{{ className }}"><div><div class="selectTextWrapper">{{ name }}</div>',
            '<div class="menuItemSuffix">{{ suffix }}</div>',
            '<input type="hidden" value="{{ value }}" />', '</div></li>']
            .join('\n'),

        showOnlyControl: '<div class="showOnly button offsetColor">only</div>',

        controlMenuItem: ['<li class="{{ className }}"><div>', '<div class="menuIcon">{{ icon }}</div>',
            '<div class="selectTextWrapper"><div class="selectText">{{ name }}</div>',
            '<div class="facetCount {{ countClass }}">', '{{ count }}</div></div>', '{{ control }}',
            '<input type="hidden" value="{{ value }}" />', '</div></li>']
            .join('\n'),

        genericButton: '<button id="{{ buttonId }}" class="button">{{ buttonLabel }}</button>',

        dialogHeaderButton: '<button id="{{ buttonId }}" class="{{ displayClass }} button">{{ buttonLabel }}</button>',


        genericDialogShell: '<div id="{{ elId }}" class="dialog"></div>',

        genericIframe: '<iframe class="{{ iframeClass }}" src="{{ iframeSrc }}" />',

        toMetadataTop: '<div id="toMetadataTop"><span>{{ content }}</span></div>',

        metadataContent: '<div id="{{ elId }}" class="metadataDialogContent"></div><div class="metadataDialogFooter">{{ layerId }}</div>',

        iframeDownload: '<iframe class="{{ iframeClass }}" src="{{ iframeSrc }}" onload="jQuery(document).trigger(\'iframeload\')"/>',

        defaultDownloadCheckbox: '<div class="button cartCheckBox"><input id="{{ elId }}" type="checkbox" <% if ( isChecked ) { %>checked<% } %>/><label for="{{ elId }}"><div class="checkBox"></div><div class="checkLabel"></div></label></div>',

        emptyTable: '<div class="emptyTable">{{ message }}</div>',

        // TODO: extract logic
        attributeTable: [
            '<div class="attrHeader">',
            '<h3 class="getFeatureTitle offsetColor" title="{{ title }}">{{ title }}</h3>',
            '<% if (totalPages > 1){ %>',
            '<div class="featurePage"><button class="button prev offsetColor<% if (page == 1){ %> inactive<% } %>">&lt;</button>',
            '{{ page }} of {{ totalPages }}<button class="button next offsetColor<% if (page == totalPages){ %> inactive<% } %>">&gt;</button></div>',
            "<% } %></div>",
            '<% if (previews.length > 0 || downloads.length > 0) { %><div class="attrExtrasContainer">',
            "<% if (previews.length > 0){ _.each(previews, function(value) {%>",
            '<div class="attrPreview"><div class="loading"></div><img src="{{ value }}" alt="Retrieving preview..." /></div>',
            "<% });} %>",
            "<% if (downloads.length > 0){ _.each(downloads, function(value) {%>",
            '<div class="attrDownload"><a class="attrDownloadButton button" href="{{ value }}" download>Download</a></div>',
            "<% });} %>",
            "</div><% } %>",
            '<div class="attrContainer"><table class="attributeInfo"><%_.each(tableContent, ',
            "function(value, key, list) { %><tr><td class=\"attributeName\" >{{ key }}</td>",
            "<td>{{ value }}</td></tr><% }); %>", "</table></div>"]
            .join(" "),

        tableCell: '<td class="{{ colClass }}"><div class="cellWrapper">{{ contents }}</div></td>',

        textTableCell: '<td class="{{ colClass }}"><div class="cellWrapper" title="{{ contents }}">{{ contents }}</div></td>',

        cartCell: '<div class="tableCell {{ colClass }}">{{ contents }}</div>',

        textCartCell: '<div class="tableCell {{ colClass }}" title="{{ contents }}"><div class="cellWrapper">{{ contents }}</div></div>',

        checkboxControl: '<div class="button {{ controlClass }}" title="{{ tooltip }}"><input id="{{ elId }}" type="checkbox" <% if ( isChecked ) { %>checked<% } %>/><label for="{{ elId }}"><div class="checkBox"></div><div class="checkLabel">{{ text }}</div></label></div>',

        restrictedWarning: [
            '<span>This layer is restricted by licensing agreement to the {{ repository }} community. </span>{{ localeWarning }}<br /><span class="ignoreWarning">',
            '<div class="button doNotShow"><input id="{{ elId }}_dns" type="checkbox" <% if ( isChecked ) { %>checked<% } %>/><label for="{{ elId }}_dns"><div class="checkBox"></div><div class="checkLabel">Do not show again</div></label></div>', '</span'].join('\n'),

        restrictedWarningLocal: '<span class="notice">Restricted layers can be added to the Cart, but you must login before you can preview or download restricted layers.</span>',
        restrictedWarningExternal: '<span class="notice">Restricted layers can be added to the Cart here, but you must use {{ repository }}\'s site and login to preview or download restricted layers.</span>',

        infoBubble: [
            '<div id="{{ elId }}" class="infoBubbleBackground triangle-isoscelesBackground {{ arrowDirection }}Background">',
            '<div class="infoBubbleText triangle-isosceles {{ arrowDirection }}">',
            '<button class="closeBubble button"></button>{{ content }}',
            '<div class="button doNotShow"><input id="{{ elId }}_dns" type="checkbox" <% if ( isChecked ) { %>checked<% } %>/><label for="{{ elId }}_dns"><div class="checkBox"></div><div class="checkLabel">Do not show again</div></label></div>',
            '</div></div>'].join('\n'),

        welcomeText: [
            '<div id="welcomeText" class="welcomeText">',
            '<h1>Welcome</h1>',
            '<p>There are two ways to begin your search:</p>',
            '<ol><li>Enter information using one or both search fields.</li>',
            '<li>Zoom in on a location using the map.</li></ol></div>']
            .join('\n'),

        directionsText: [
            '<div id="directionsText" class="directionsText">',
            "<span>You can preview layers by clicking on the 'View' checkbox.</span><br/><br/>",
            "<span>Layers can be added to the 'Cart' by clicking on the </span>",
            '<div class="saveControl notInCart exampleControl"></div><span> button.</span></div>']
            .join('\n'),

        /***********************************************************************
         * Preview Tools
         **********************************************************************/


        previewToolsContainer: '<tr class="controls"><td class="previewTools" colspan="{{ colspan }}"><div></div></td></tr>',
        cartPreviewToolsContainer: '<div class="controls"><div class="previewTools" ><div></div></div></div>',

        // html content/formatting for expanded row
        previewTools: ['<div class="previewControls">',
            '{{ toolsMarkup }}', '</div>'].join('\n'),

        /*
         * remove the class "previewToolsSlider" to use the default jquery
         * ui slider
         */
        sliderControl: ['<div class="{{ controlClass }}">',
            '<div class="sliderControl">',
            '<div class="sliderDisplay">',
            '<span class="sliderLabel">{{ label }}:</span>',
            '<span class="sliderValue">{{ value }}</span>',
            '<span class="sliderUnits">{{ units }}</span>', '</div>',
            '<div class="sliderArrow button"></div>',
            '<div class="controlContainer">',
            '<div class="previewToolsSlider" title="{{ tooltip }}">',
            '</div>', '</div>', '</div>', '</div>'].join('\n'),
        colorControl: [
            '<div class="colorControlCell controlOff" tabindex="0">',
            '<div class="colorControlWrapper">',
            '<div class="colorControl button" title="Change the layer color" style="background-color:{{ color }}">',
            '</div>', '</div>', '</div>'].join('\n'),
        zoomControl: '<div class="button zoomToLayerControl" title="Zoom to geographic extent of layer"></div>',
        getFeatureControl: '<div class="button attributeInfoControl {{ toolClass }}" title="Click a previewed feature on the map to view its attributes"></div>',
        genericControl: '<div class="button {{ controlClass }} {{ displayClass }}" title="{{ tooltip }}">{{ text }}</div>',
        genericIcon: '<div class="{{ controlClass }} {{ displayClass }}" title="{{ tooltip }}">{{ text }}</div>',


        /**
         * download controls
         */
        formatSelectionControl: [
            '<label for="{{ controlId }}" class="{{ controlClass }}">{{ controlLabel }}</label>',
            '<select id="{{ controlId }}" class="{{ controlClass }}">',
            '<% _.each(formats, function(formatEl) { %><option value="{{ formatEl.formatType }}">{{ formatEl.formatDisplay }}</option><% }); %>',
            '</select><br/>'].join('\n'),
        clipControlLabel: 'Clip data to map extent',
        requireEmailAddress: [
            '<div><label for="emailAddress">You have selected some layers that require an email address. Please enter your email to receive a download link:</label><br />',
            '<input id="emailAddress" type="text" /></div>',
            '<span id="emailValidationError" class="warning"></span>']
            .join('\n'),

        // How can this be done in a better way? too much logic; probably
        // split it
        // into several templates and apply logic in the view
        layerDownloadNotice: [
            '<div>You have selected {{ total }} layer<% if ( plural ) { %>s<% } %> for download.</div>',
            '<% if (downloadCount > 0){ if ( emailCount === 0){%><div>A zip file will be generated with your layers. <% } else { %>',
            '<div>A zip file will be generated with layers directly downloadable by the OpenGeoportal site. <% } %>',
            'It may take several minutes to process your layers.<br />',
            '<span class="notice">Do not close the OpenGeoportal website until the process is complete, or you will lose your download.</span></div>',
            '<%} if (emailCount > 0){ if ( downloadCount === 0) {%><br/><div>You will be emailed a link to your layers within the next few minutes. </div><% } else { %>',
            '<br/><div>You will be emailed a link to layers not directly downloadable by the OpenGeoportal site within the next few minutes. </div><% }} %>']
            .join('\n'),

        /**
         * web services
         */

        wmcDialog: [
            '<span class="sub_headerTitle">{{ title }}</span>',
            '<br/><span>{{ caption }}</span>',
            '<div class="owsServicesLinkContainer">',
            '<label for="{{ preferenceElId }}">{{ preferenceText }}</label>',
            '<select id="{{ preferenceElId }}">',
            '<% _.each(preference, function(type) { %>',
            '<option value="{{ type.value }}">{{ type.label }}</option>',
            '<% }); %>',
            '</select>',
            '<div id="{{ generateButtonId }}" class="button">Generate WMC</div>',
            '<br/></div><br/>'].join('\n'),
        dynamicWSDialog: [
            '<% _.each(dynamic, function(serviceInfo){ %>',
            '<span class="sub_headerTitle">{{ serviceInfo.title }}</span>',
            '<br/><span>{{ serviceInfo.caption }}</span>',
            '<div class="owsServicesLinkContainer">',
            '<textarea class="shareServicesText linkText" >{{ serviceInfo.url }}</textarea> <br /></div><br/><% }); %>']
            .join('\n'),
        webServicesDialog: ['<div id="owsServicesArea">',
            '{{ content }}', '</div>'].join('\n')


    }

};
