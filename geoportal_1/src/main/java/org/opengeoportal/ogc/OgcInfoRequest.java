package org.opengeoportal.ogc;

import java.io.InputStream;

/**
 * Interface for creating and parsing OGC OWS info requests (WCS DescribeCoverage, WMS DescribeLayer,
 * WFS DescribeFeature)
 */
public interface OgcInfoRequest {

	/**
	 * Form the info request using info supplied by the client and found in the layer's Solr record
	 * @param layerName
	 * @return
	 * @throws Exception
	 */
	String createRequest(String layerName) throws Exception;

	/**
	 * Parse the XML response
	 * @param inputStream
	 * @return
	 * @throws Exception
	 */
	OwsInfo parseResponse(InputStream inputStream) throws Exception;

	/**
	 * GET or POST
	 * @return
	 */
	String getMethod();

	/**
	 * WFS, WCS, WMS
	 * @return
	 */
	String getOgcProtocol();

	/**
	 * protocol version
	 * @return
	 */
	String getVersion();

}
