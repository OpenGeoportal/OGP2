package org.opengeoportal.download.methods;

import org.opengeoportal.download.types.generated.ogc.wms_describelayer.WMSDescribeLayerResponse;

/*
 * 
 * DescribeLayer

The DescribeLayer operation is used primarily by clients that understand SLD-based WMS. In order to make an SLD one needs to know the structure of the data. WMS and WFS both have operations to do this, so the DescribeLayer operation just routes the client to the appropriate service.

The standard parameters for the DescribeLayer operation are:
Parameter 	Required? 	Description
service 	Yes 	Service name. Value is WMS.
version 	Yes 	Service version. Value is 1.1.1.
request 	Yes 	Operation name. Value is DescribeLayer.
layers 	Yes 	See GetMap
exceptions 	No 	Format in which to report exceptions. The default value is application/vnd.ogc.se_xml.

Geoserver supports a number of output formats for the DescribeLayer response. Server-styled HTML is the most commonly-used format. The supported formats are:
Format 	Syntax 	Notes
TEXT 	output_format=text/xml 	Same as default.
GML 2 	output_format=application/vnd.ogc.wms_xml 	The default format.
JSON 	output_format=application/json 	Simple Json representation.
JSONP 	output_format=text/javascript 	Return a JsonP in the form: paddingOutput(...jsonp...). See WMS vendor parameters to change the callback name. Note that this format is disabled by default (See Global variables affecting WMS).

An example request in XML (default) format on a layer is:

http://localhost:8080/geoserver/topp/wms?service=WMS
&version=1.1.1
&request=DescribeLayer
&layers=topp:coverage
 * 
 * 
 */
public interface WmsDescribeLayer {
	WMSDescribeLayerResponse describeLayer(String baseUrl, String qualifiedLayerName);
}
