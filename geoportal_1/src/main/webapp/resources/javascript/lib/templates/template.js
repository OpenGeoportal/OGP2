if (typeof OpenGeoportal == 'undefined') {
	OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object") {
	throw new Error("OpenGeoportal already exists and is not an object");
}

OpenGeoportal.Template = function() {

	var cartHeaderHtml =	'<div id="optionDetails" class="shadowDown">';
	cartHeaderHtml +=	'<div id="optionText"></div></div>';
	
	this.cartHeader = _.template(cartHeaderHtml);
	
	var tableHeaderHtml = '<div class="tableHeaders">';
	tableHeaderHtml += '<% _.each(headers, function(col) { %><div class="tableCell <%= col.columnClass %>"><%= col.header %></div><% }); %>';
	tableHeaderHtml += '</div>';
	
	this.tableHeader = _.template(tableHeaderHtml);
	
	var tableViewHtml = '<div class="tableWrapper"><%= tableHeader %>';
	tableViewHtml += '<div class="rowContainer"><%= tableFooter %></div></div>';
	this.tableView = _.template(tableViewHtml);


	var mapToolBarHtml = '<div id="mapToolBar"><div id="ogpMapButtons">'
			+ '</div>' + '</div>';

	var genericDivHtml = '<div id="<%= elId %>" class="<%= elClass %>" ></div>';
	this.genericDiv = _.template(genericDivHtml);
	
	var divNoIdHtml = '<div class="<%= elClass %>" ></div>';
	this.divNoId = _.template(divNoIdHtml);
	
	var mapHtml = '<div id="<%= mapId %>OLMap">' + this.genericDiv({
		elId : "nwCorner",
		elClass : "corner slideHorizontal"
	}) + this.genericDiv({
		elId : "neCorner",
		elClass : "corner"
	}) + this.genericDiv({
		elId : "swCorner",
		elClass : "corner slideHorizontal"
	}) + this.genericDiv({
		elId : "seCorner",
		elClass : "corner"
	}) + '</div>';
	this.map = _.template(mapToolBarHtml + mapHtml);

	this.mapButton = _
			.template('<button class="mapStyledButton <%= displayClass %>" title="<%= title %>" ><%= buttonText %></button>');
	this.basemapMenu = _.template('<div id="basemapMenu"></div>');

	var loadIndicatorHtml =  '<div class="loadIndicator"></div>';
	this.loadIndicator = _.template(loadIndicatorHtml);
	
	var requestIndicatorHtml = '<div class="raised">';
	requestIndicatorHtml += '<div id="processingIndicator" class="loadIndicator"></div><div id="requestTicker" class="loadInfo"></div></div></div>';
	this.requestIndicator = _.template(requestIndicatorHtml);

	var selectHtml = '<div class="styledSelect">' + "<div>"
			+ '<button class="select"><%= obj.buttonLabel %></button><%= obj.caption %>'
			+ "</div>"
			+ "<ul><%= obj.menuHtml %></ul>"
		    + '</div>';

	this.styledSelectBody = _.template(selectHtml);
	
	var selectAllHtml = '<div class="showAll offsetColor button">select all</div>';
	this.selectAllCaption = _.template(selectAllHtml);

	var simpleMenuHtml = '<li><a class="<%= className %>"><%= name %></a>'
			+ '<input type="hidden" value="<%= value %>" /></li>';
	this.simpleMenuItem = _.template(simpleMenuHtml);

	var showOnlyHtml = '<div class="showOnly button offsetColor">only</div>';
	this.showOnlyControl = _.template(showOnlyHtml);
	
	var controlMenuHtml = '<li><a class="<%= className %>"><%= icon %><div class="selectText"><%= name %></div><%= control %></a>';
	controlMenuHtml += '<input type="hidden" value="<%= value %>" /></li>';
	this.controlMenuItem = _.template(controlMenuHtml);

	var genericButtonHtml = '<button id="<%= buttonId %>" class="button"><%= buttonLabel %></button>';
	this.genericButton = _.template(genericButtonHtml);

	var dialogHeaderButtonHtml = '<button id="<%= buttonId %>" class="<%= displayClass %> button"><%= buttonLabel %></button>';
	this.dialogHeaderButton = _.template(dialogHeaderButtonHtml);

	/***************************************************************************
	 * Preview Tools
	 **************************************************************************/
	var previewToolContainerHtml = '<tr class="controls"><td class="previewTools" colspan="<%=colspan%>"><div></div></td></tr>';
	this.previewToolsContainer = _.template(previewToolContainerHtml);

	var cartPreviewToolContainerHtml = '<div class="controls"><div class="previewTools" ><div></div></div></div>';
	this.cartPreviewToolsContainer = _.template(cartPreviewToolContainerHtml);
	// html content/formatting for expanded row
	var previewToolHtml = '<div class="previewControls"><%=toolsMarkup%>';
	previewToolHtml += '</div>';
	this.previewTools = _.template(previewToolHtml);

	var sliderHtml = '<div class="<%=controlClass%>">';
	sliderHtml += '<div class="sliderControl">';
	sliderHtml += '<div class="sliderDisplay">';
	sliderHtml += '<span class="sliderLabel"><%=label%>:</span>';
	sliderHtml += '<span class="sliderValue"><%=value%></span>';
	sliderHtml += '<span class="sliderUnits"><%=units%></span>';
	sliderHtml += '</div>';
	sliderHtml += '<div class="sliderArrow button"></div>';
	sliderHtml += '<div class="controlContainer">';
	sliderHtml += '<div class="previewToolsSlider" title="<%=tooltip%>"></div>';
	sliderHtml += '</div>';
	/* remove the class "previewToolsSlider" to use the default jquery ui slider */
	sliderHtml += '</div></div>';

	this.sliderControl = _.template(sliderHtml);

	var colorHtml = '<div class="colorControlCell"><div class="colorControl button" title="Change the layer color" style="background-color:<%=color%>"></div></div>';
	this.colorControl = _.template(colorHtml);

	// can probably make all of these from this generic control html
	var zoomHtml = '<div class="button zoomToLayerControl" title="Zoom to geographic extent of layer"></div>';
	this.zoomControl = _.template(zoomHtml);

	var getFeatureHtml = '<div class="button attributeInfoControl <%=toolClass%>" title="Click a previewed feature on the map to view its attributes"></div>';
	this.getFeatureControl = _.template(getFeatureHtml);

	var genericControl = '<div class="button <%= controlClass %> <%=displayClass%>" title="<%= tooltip %>"><%= text %></div>';
	this.genericControl = _.template(genericControl);

	var genericIconHtml = '<div class="<%= controlClass %> <%= displayClass %>" title="<%= tooltip %>"><%= text %></div>';
	this.genericIcon = _.template(genericIconHtml);

	var genericDialogHtml = '<div id="<%= elId %>" class="dialog"></div>';
	this.genericDialogShell = _.template(genericDialogHtml);

	var genericIframeHtml = '<iframe class="<%= iframeClass%>" src="<%= iframeSrc %>" />';
	this.genericIframe = _.template(genericIframeHtml);

	var toMetadataTopHtml = '<div id="toMetadataTop"></div>';
	this.toMetadataTop = _.template(toMetadataTopHtml);

	var metadataContentHtml = '<div id="metadataContent"></div><div id="metadataFooter"><%= layerId %></div>';
	this.metadataContent = _.template(metadataContentHtml);

	var iframeDownloadHtml = '<iframe class="<%= iframeClass%>" src="<%= iframeSrc %>" onload="jQuery(document).trigger(\'iframeload\')"/>';
	this.iframeDownload = _.template(iframeDownloadHtml);

	var defaultDownloadCheckboxHtml = '<input type="checkbox" class="cartCheckBox" <% if ( isChecked ) { %>checked<% } %> />';
	this.defaultDownloadCheckbox = _.template(defaultDownloadCheckboxHtml);

	var emptyTableHtml = '<div class="emptyTable"><%= message %></div>';
	this.emptyTable = _.template(emptyTableHtml);
	// var list = "<% _.each(people, function(name) { %> <li><%= name %></li> <%
	// }); %>";
	var attributeTableHtml = '<table class="attributeInfo">'
			+ '<caption class="getFeatureTitle offsetColor" title="<%= layerId %>"><%= title %></caption>'
			+ "<% _.each(tableContent, "
			+ "function(rowObj) { %><tr><td class=\"attributeName\" ><%= rowObj.header %></td><%  _.each(rowObj.values, "
			+ "function(value) { %><td><%= value %></td> <% }); %></tr><% }); %>"
			+ "</table>";
	this.attributeTable = _.template(attributeTableHtml);

	var tableCellHtml = '<td class="<%= colClass %>"><div class="cellWrapper"><%= contents %></div></td>';
	this.tableCell = _.template(tableCellHtml);

	var textTableCellHtml = '<td class="<%= colClass %>"><div class="cellWrapper" title="<%= contents %>"><%= contents %></div></td>';
	this.textTableCell = _.template(textTableCellHtml);
	
	var cartCellHtml = '<div class="tableCell <%= colClass %>"><%= contents %></div>';
	this.cartCell = _.template(cartCellHtml);

	var textCartCellHtml = '<div class="tableCell <%= colClass %>" title="<%= contents %>"><div class="cellWrapper"><%= contents %></div></div>';
	this.textCartCell = _.template(textCartCellHtml);

	/**
	 * download controls
	 */

	var formatControlHtml = '<label for="<%= controlId %>" class="<%= controlClass %>"><%= controlLabel %></label>';
	formatControlHtml += '<select id="<%= controlId %>" class="<%= controlClass %>">';
	formatControlHtml += '<% _.each(formats, function(formatEl) { %><option value="<%= formatEl.formatType %>"><%= formatEl.formatDisplay %></option><% }); %>';
	formatControlHtml += '</select><br/>';
	this.formatSelectionControl = _.template(formatControlHtml);

	var clipControlHtml = '<input id="<%= elId %>" type="checkbox" <% if (isClipped){ %>checked="checked" <% } %>/><label for="<%= elId %>">Clip data to map extent</label><br/> \n';
	this.clipControl = _.template(clipControlHtml);

	var addEmailHtml = '<div><label for="emailAddress">You have selected some layers that require an email address. Please enter your email to receive a download link:</label><br />\n';
	addEmailHtml += '<input id="emailAddress" type="text" /></div>\n';
	addEmailHtml += '<span id="emailValidationError" class="warning"></span>';
	this.requireEmailAddress = _.template(addEmailHtml);

	// How can this be done in a better way? too much logic; probably split it
	// into several templates and apply logic in the view
	var downloadNoticeHtml = "<div>You have selected <%= total %> layer<% if ( plural ) { %>s<% } %> for download.</div>";
	downloadNoticeHtml += "<% if (downloadCount > 0){ if ( emailCount === 0){%><div>A zip file will be generated with your layers. <% } else { %>";
	downloadNoticeHtml += "<div>A zip file will be generated with layers directly downloadable by the OpenGeoportal site. <% } %>";
	downloadNoticeHtml += "It may take several minutes to process your layers.<br /> ";
	downloadNoticeHtml += '<span class="notice">Do not close the OpenGeoportal website until the process is complete, or you will lose your download.</span></div><%}';
	downloadNoticeHtml += " if (emailCount > 0){ if ( downloadCount === 0) {%><br/><div>You will be emailed a link to your layers within the next few minutes. </div><% } else { %>";
	downloadNoticeHtml += "<br/><div>You will be emailed a link to layers not directly downloadable by the OpenGeoportal site within the next few minutes. </div><% }} %>";

	this.layerDownloadNotice = _.template(downloadNoticeHtml);
	

	var wmcDialogContentHtml = '<span class="sub_headerTitle"><%= wmc.title %></span>'; //'<a href="#">?</a>';
	wmcDialogContentHtml += '<br/><span><%= wmc.caption %></span><div class="owsServicesLinkContainer">';
	wmcDialogContentHtml += '<label for="<%= wmc.preferenceElId %>"><%= wmc.preferenceText %></label><select id="<%= wmc.preferenceElId %>">';
	wmcDialogContentHtml += '<% _.each(wmc.preference, function(type) { %><option value="<%= type.value %>"><%= type.label %></option><% }); %></select>';
	wmcDialogContentHtml += '<div id="<%= wmc.generateButtonId %>" class="button">Generate WMC</div>';
    wmcDialogContentHtml += '<br/></div><br/>';

    var dynamicWSDialogContentHtml = '<% _.each(webservices, function(serviceInfo){ %><span class="sub_headerTitle"><%= serviceInfo.title %></span>'; //'<a href="#">?</a>';
    dynamicWSDialogContentHtml += '<br/><span><%= serviceInfo.caption %></span><div class="owsServicesLinkContainer">';
    dynamicWSDialogContentHtml += '<textarea class="shareServicesText linkText" ><%= serviceInfo.url %></textarea> <br /></div><br/><% }); %>';
	
	var webServicesDialogContentHtml = '<div id="owsServicesArea">';
	webServicesDialogContentHtml += dynamicWSDialogContentHtml;
	webServicesDialogContentHtml += wmcDialogContentHtml;
	webServicesDialogContentHtml += '</div>';

	this.webServicesDialogContent = _.template(webServicesDialogContentHtml);
	
	var doNotShowHtml = '<label><input type="checkbox" class="doNotShow" />Do not show again</label>';
	
	var restrictedWarningHtml = '<span>This layer is restricted by licensing agreement to the <%= repository %> community. </span><%= localeWarning %><br /><span class="ignoreWarning">' + doNotShowHtml + '</span>';
	this.restrictedWarning = _.template(restrictedWarningHtml);
	
	var restrictedWarningLocalHtml = '<span class="notice">Restricted layers can be added to the Cart, but you must login before you can preview or download restricted layers.</span>';
	this.restrictedWarningLocal = _.template(restrictedWarningLocalHtml);
	
	var restrictedWarningExternalHtml = '<span class="notice">Restricted layers can be added to the Cart here, but you must use <%= repository %>\'s site and login to preview or download restricted layers.</span>';
	this.restrictedWarningExternal = _.template(restrictedWarningExternalHtml);
	
	
	var infoBubbleHtml = '<div id="<%= elId %>" class="infoBubbleBackground triangle-isoscelesBackground '
			+ '<%= arrowDirection %>Background"><div class="infoBubbleText triangle-isosceles '
			+ '<%= arrowDirection %>"><button class="closeBubble button"></button><%= content %>' 
			+ doNotShowHtml
			+ '</div></div>';
	this.infoBubble = _.template(infoBubbleHtml);
	
	var welcomeTextHtml = '<div id="welcomeText" class="welcomeText">'
		+ '<h1>Welcome</h1>' 
		+ '<p>There are two ways to begin your search:</p>'
		+ '<ol><li>Enter information using one or both search fields.</li>'
		+ '<li>Zoom in on a location using the map.</li></ol></div>';

	this.welcomeText = _.template(welcomeTextHtml);
	
	var directionsTextHtml = '<div id="directionsText" class="directionsText">'
		+ "<span>You can preview layers by clicking on the 'View' checkbox.</span><br/><br/>"
		+ '<span>Layers can be added to the \'Cart\' by clicking on the </span><div class="saveControl notInCart exampleControl"></div><span> button.</span></div>';
	
	this.directionsText = _.template(directionsTextHtml);
};