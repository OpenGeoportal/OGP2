package org.opengeoportal.proxy;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.List;
import java.util.UUID;

import org.opengeoportal.config.proxy.ProxyConfigRetriever;
import org.opengeoportal.download.RequestStatusManager;
import org.opengeoportal.metadata.LayerInfoRetriever;
import org.opengeoportal.proxy.controllers.ImageRequest;
import org.opengeoportal.proxy.controllers.ImageRequest.LayerImage;
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
	private LayerInfoRetriever layerInfoRetriever;
	@Autowired
	private ProxyConfigRetriever proxyConfigRetriever;
	
	@Override
	public UUID requestImage(String sessionId, ImageRequest imageRequest) throws Exception {
		List<SolrRecord> layerInfo = this.layerInfoRetriever.fetchAllLayerInfo(imageRequest.getLayerIds());

		populateImageRequest(imageRequest, layerInfo);
		UUID requestId = registerRequest(sessionId, imageRequest);
		logger.debug("Image Request registered: " + requestId.toString());
		imageCompositor.createComposite(imageRequest);
		return requestId;
	}
	
	private UUID registerRequest(String sessionId, ImageRequest imageRequest) {
		UUID requestId = UUID.randomUUID();
		requestStatusManager.addImageRequest(requestId, sessionId, imageRequest);
		return requestId;
	}
	
	private void populateImageRequest(ImageRequest imageRequest, List<SolrRecord> layerInfo) {	
			    
	    logger.info("Number of layers in image: " + Integer.toString(layerInfo.size()));
	    
		String baseQuery = generateBaseQuery(imageRequest.getFormat(), imageRequest.getBbox(), imageRequest.getSrs(),
				imageRequest.getHeight(), imageRequest.getWidth());
		
		for (LayerImage layerImage: imageRequest.getLayers()){
			
			String currentId = layerImage.getLayerId();
			
			for (SolrRecord solrRecord : layerInfo){
				
				if (false){
					//should use a Spring Security filter for this
					//skip layers the user doesn't have permission to retrieve
					//the client should never send these layers, since the user shouldn't be able to preview them
					continue;
				}
				
				if (solrRecord.getLayerId().equalsIgnoreCase(currentId)){
					layerImage.setSolrRecord(solrRecord);
					populateLayerUrl(layerImage, baseQuery);				
				}
			}
		}
		
	}
	
	private void populateLayerUrl(LayerImage layerImage, String baseQuery){
		
		SolrRecord solrRecord = layerImage.getSolrRecord();
		
		String layerQueryString = "&layers=" + solrRecord.getWorkspaceName() + ":" + solrRecord.getName();
		String currentSLD = layerImage.getSld();
	   	if ((currentSLD != null)&&(!currentSLD.equals("null")&&(!currentSLD.isEmpty()))){
	   		try {
				layerQueryString += "&sld_body=" + URLEncoder.encode(currentSLD, "UTF-8");
			} catch (UnsupportedEncodingException e) {
				//problem with the sld encoding...just ignore the sld.
				logger.error("There was a problem with the SLD encoding.  Requesting image without SLD. ");
			}
	   	}

	   	layerImage.setQueryString(baseQuery + layerQueryString);
	   	String baseUrl = "";
	   	try{
	   		if (this.proxyConfigRetriever.hasProxy("wms", solrRecord.getInstitution(), solrRecord.getAccess())){ 
	   			baseUrl = this.proxyConfigRetriever.getInternalProxy("wms", solrRecord.getInstitution(), solrRecord.getAccess());
	   		}  else {
	   			baseUrl = OgpUtils.filterQueryString(LocationFieldUtils.getWmsUrl(solrRecord.getLocation()));

	   		}
	   		layerImage.setBaseUrl(baseUrl);

	   	} catch (Exception e1) {
	   		e1.printStackTrace();
	   		logger.error("Problem retrieving a URL for this layer.");
	   		//there's some problem retrieving a url.  skip the layer
	   	}
	}
	
	private String generateBaseQuery(String format, String bbox, String srs, int height, int width){
		
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
    	return genericQueryString;
	}
	
	
	//use Spring Security hasPermission expression instead
	private Boolean hasPermission(SolrRecord currentLayer){
		return true;
		//this should come from something in the security package
	   	/*if (!currentLayer.getAccess().equalsIgnoreCase("public")){
	   		try {
				if (currentLayer.getInstitution().equalsIgnoreCase(this.home)){
					if (!this.isLocallyAuthenticated){
						return false;
					} else {
						return true;
					}
				} else {
					return false;
				}
			} catch (Exception e) {
				e.printStackTrace();
				return false;
			}
	   		
	   	} else {
	   		return true;
	   	}*/
	}
}
