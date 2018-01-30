package org.opengeoportal.image;

import java.io.File;
import java.io.UnsupportedEncodingException;
import java.net.URL;
import java.net.URLEncoder;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Future;

import org.opengeoportal.config.proxy.ProxyConfigRetriever;
import org.opengeoportal.download.RequestStatusManager;
import org.opengeoportal.image.ImageRequest.ImageStatus;
import org.opengeoportal.image.ImageRequest.LayerImage;
import org.opengeoportal.metadata.LayerInfoRetriever;
import org.opengeoportal.solr.SolrRecord;
import org.opengeoportal.utilities.LocationFieldUtils;
import org.opengeoportal.utilities.OgpUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

public class ImageHandlerImpl implements ImageHandler {
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	@Autowired
	private RequestStatusManager requestStatusManager;
	@Autowired
	private ImageCompositor imageCompositor;
	@Autowired
	private ImageDownloaderFactory imageDownloaderFactory;
	@Autowired
	private LayerInfoRetriever layerInfoRetriever;
	@Autowired
	private ProxyConfigRetriever proxyConfigRetriever;
	private String baseWMSQuery;
	private String baseAGServerQuery;

	/**
	 * register the request, download the requested layers, composite them
	 * @param sessionId
	 * @param imageRequest
	 * @return
	 * @throws Exception
	 */
	@Override
	public UUID requestImage(String sessionId, ImageRequest imageRequest) throws Exception {

		UUID requestId = registerRequest(sessionId, imageRequest);
		logger.debug("Image Request registered: " + requestId.toString());
		downloadLayerImages(imageRequest);
		imageCompositor.createComposite(imageRequest);
		
		return requestId;
	}

	/**
	 * register the request to the RequestStatusManager with the user's session ID as the key
	 * @param sessionId
	 * @param imageRequest
	 * @return
	 */
	private UUID registerRequest(String sessionId, ImageRequest imageRequest) {
		UUID requestId = UUID.randomUUID();
		requestStatusManager.addImageRequest(requestId, sessionId, imageRequest);
		return requestId;
	}

	/**
	 * iterate over layers in the request, generate urls to retrieve them and make the request via ImageDownloader
	 * @param imageRequest
	 * @throws Exception
	 */
	private void downloadLayerImages(ImageRequest imageRequest) throws Exception {

		//populateImageRequest depends on setBaseQuery running first
		setBaseQuery(imageRequest.getFormat(), imageRequest.getBbox(), imageRequest.getSrs(), 
				imageRequest.getHeight(), imageRequest.getWidth());

		populateImageRequest(imageRequest);
		
		List<LayerImage> layerImageList = imageRequest.getLayers();

		for (LayerImage layerImage: layerImageList){			
			//now we have everything we need to create a request
			//this needs to be done for each image received
			try {
                logger.debug("Image URL:" + layerImage.getUrl().toString());
                ImageDownloader imageDownloader = imageDownloaderFactory.getObject();
				Future<File> imgFile = imageDownloader.getImage(layerImage.getUrl());
				layerImage.setImageFileFuture(imgFile);

			} catch (Exception e) {
				//just skip it
				layerImage.setImageStatus(ImageStatus.FAILED);
				logger.error("There was a problem getting this image.  Skipping.");
				e.printStackTrace();
			} 
		}

	}

	/**
	 * Get info from solr for each layer, filter out any layers the user doesn't have access to. Add a generated url
	 * with appropriate params to the request object
	 *
	 * @param imageRequest
	 * @throws Exception
	 */
	private void populateImageRequest(ImageRequest imageRequest) throws Exception {	
		//only retrieve records the user has permission to access data for
		List<SolrRecord> layerInfo = this.layerInfoRetriever.fetchAllowedRecords(imageRequest.getLayerIds());
		logger.info("Creating composite of {} image(s).", Integer.toString(layerInfo.size()));

		for (LayerImage layerImage : imageRequest.getLayers()) {
			
			String currentId = layerImage.getLayerId();
			
			for (SolrRecord solrRecord : layerInfo){
				
				if (solrRecord.getLayerId().equalsIgnoreCase(currentId)){
					layerImage.setSolrRecord(solrRecord);
					populateLayerUrl(layerImage);				
				}
			}
		}
		
	}

	/**
	 * decide which type of url to construct and construct it
	 * @param layerImage
	 */
	private void populateLayerUrl(LayerImage layerImage){

		SolrRecord solrRecord = layerImage.getSolrRecord();
		String locationField = solrRecord.getLocation();
		URL url = null;

		if (LocationFieldUtils.hasWmsUrl(locationField)) {
			url = getWMSUrl(solrRecord, layerImage.getSld());
		} else if (LocationFieldUtils.hasArcGISRestUrl(locationField)) {
			url = getAGServerUrl(solrRecord);
		}

		layerImage.setUrl(url);
	}

	/**
	 * generate an ArcGIS Server url
	 * @param solrRecord
	 * @return
	 */
	private URL getAGServerUrl(SolrRecord solrRecord) {
		String layerQueryString = "&LAYERS=show:" + solrRecord.getName();


		String baseUrl = "";

		URL url = null;
		try {
			baseUrl = proxyConfigRetriever.getInternalUrl("ArcGISRest",
					solrRecord.getInstitution(), solrRecord.getAccess(),
					solrRecord.getLocation());
			// filter any query terms
			baseUrl = OgpUtils.filterQueryString(baseUrl);
			if (baseUrl.endsWith("/")) {
				baseUrl = baseUrl.substring(0, baseUrl.length());
			}

			//look for "MapServer" path
			int i = baseUrl.toLowerCase().indexOf("mapserver");
			if (i > -1) {
				baseUrl = baseUrl.substring(0, i - 1);
			}

			baseUrl += "/MapServer/export";

			url = new URL(baseUrl + "?" + baseAGServerQuery + layerQueryString);
		} catch (Exception e1) {
			e1.printStackTrace();
			logger.error("Problem retrieving a URL for this layer.");
			//there's some problem retrieving a url.  skip the layer
		}

		return url;
	}

	/**
	 * generate a WMS GetMap url (untiled)
	 * @param solrRecord
	 * @param sld
	 * @return
	 */
	private URL getWMSUrl(SolrRecord solrRecord, String sld) {

		String layerQueryString = "&layers=" + solrRecord.getWorkspaceName() + ":" + solrRecord.getName();
		if ((sld != null) && (!sld.equals("null") && (!sld.isEmpty()))) {
	   		try {
				layerQueryString += "&sld_body=" + URLEncoder.encode(sld, "UTF-8");
			} catch (UnsupportedEncodingException e) {
				//problem with the sld encoding...just ignore the sld.
				logger.error("There was a problem with the SLD encoding.  Requesting image without SLD. ");
			}
	   	}

	   	String baseUrl = "";

		URL url = null;
	   	try{
			baseUrl = this.proxyConfigRetriever.getInternalUrl("wms", solrRecord.getInstitution(), solrRecord.getAccess(), solrRecord.getLocation());
			url = new URL(baseUrl + "?" + baseWMSQuery + layerQueryString);
	   	} catch (Exception e1) {
	   		e1.printStackTrace();
	   		logger.error("Problem retrieving a URL for this layer.");
	   		//there's some problem retrieving a url.  skip the layer
	   	}

		return url;
	
	}
	
	private void setBaseQuery(String format, String bbox, String srs, int height, int width){
		setBaseWMSQuery(format, bbox, srs, height, width);
		setBaseAGServerQuery(format, bbox, srs, height, width);
	}

	private void setBaseWMSQuery(String format, String bbox, String srs, int height, int width) {
		
        String genericQueryString;
    	genericQueryString = "SERVICE=WMS&version=1.1.1&REQUEST=GetMap&FORMAT=" + format + "&SRS=" + srs;
        genericQueryString += "&STYLES=&BBOX=" + bbox;

    	if (format.equals("image/png")){
	    	
    		/*int requestedDpi = 90;//dpi & size options?
    		url$ += "&format_options=dpi:" + Integer.toString(requestedDpi) + ";";
    		width = Integer.toString(Math.round(Integer.parseInt(width) * requestedDpi / 90));
    		height = Integer.toString(Math.round(Integer.parseInt(height) * requestedDpi / 90));
    		*/
    		genericQueryString += "&TILED=false&TRANSPARENT=true";
    	} 
    	genericQueryString += "&HEIGHT=" + height + "&WIDTH=" + width;
    	logger.debug(genericQueryString);
		baseWMSQuery = genericQueryString;
	}

	private void setBaseAGServerQuery(String format, String bbox, String srs, int height, int width) {
		//http://data1.commons.psu.edu/ArcGIS/rest/services/pasda/NaturalLandsTrust2010/MapServer/export?TRANSPARENT=true&DPI=91&LAYERS=show%3A15&FORMAT=png&BBOX=-7983694.729219%2C4539747.983281%2C-7827151.695312%2C4696291.017188&SIZE=256%2C256&F=image&BBOXSR=3857&IMAGESR=3857
		String genericQueryString;
		srs = srs.toLowerCase().replace("epsg:", "");
		genericQueryString = "BBOXSR=" + srs + "&IMAGESR=" + srs + "&BBOX=" + bbox;

		if (format.equals("image/png")) {
			format = "png";
			genericQueryString += "&F=image&FORMAT=" + format + "&TRANSPARENT=true";
		}
		genericQueryString += "&SIZE=" + width + "," + height + "&DPI=91";
		logger.debug(genericQueryString);
		baseAGServerQuery = genericQueryString;
	}
	

}
