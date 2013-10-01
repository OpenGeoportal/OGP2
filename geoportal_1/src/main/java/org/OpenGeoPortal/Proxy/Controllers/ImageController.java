package org.OpenGeoPortal.Proxy.Controllers;

import java.net.URLDecoder;
import java.net.URLEncoder;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.OpenGeoPortal.Metadata.LayerInfoRetriever;
import org.OpenGeoPortal.Proxy.ImageHandler;
import org.OpenGeoPortal.Proxy.Controllers.ImageRequest.LayerImage;
import org.OpenGeoPortal.Security.OgpUserContext;
import org.OpenGeoPortal.Solr.SearchConfigRetriever;
import org.OpenGeoPortal.Solr.SolrRecord;
import org.OpenGeoPortal.Utilities.LocationFieldUtils;
import org.OpenGeoPortal.Utilities.OgpUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.context.request.RequestContextHolder;

import com.fasterxml.jackson.databind.ObjectMapper;

@Controller
@RequestMapping("/requestImage")
public class ImageController {
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	@Autowired
	private LayerInfoRetriever layerInfoRetriever;
	@Autowired
	private SearchConfigRetriever searchConfigRetriever;
	@Autowired
	private ImageHandler imageHandler;
	
	private boolean isLocallyAuthenticated;// = true;
	@Autowired
	private OgpUserContext ogpUserContext;
	private String home;// = "Tufts";
	private ImageRequest imageRequest;

	@RequestMapping(method=RequestMethod.POST, headers = "content-type=application/x-www-form-urlencoded", consumes="application/json", produces="application/json")
	public @ResponseBody Map<String,String> processImageRequest(@RequestBody String imageRequest) throws Exception {
		 /**
		 * This controller given the above parameters + z order, grabs images
		 * from various servers and composites them.  Is passed a custom json object to maintain structure.
		 * 
		 * We should offer formats available via geoserver.
		 * 
		 * determine if a layer is within the provided bounds and exclude it if not
		 * 
		 * @author Chris Barnett
		 */
		home = this.searchConfigRetriever.getHome();
		//
		ObjectMapper mapper = new ObjectMapper();
		try {
			this.imageRequest = mapper.readValue(URLDecoder.decode(imageRequest, "UTF-8"), ImageRequest.class);
		} catch (Exception e){
			e.printStackTrace();
		}
		this.isLocallyAuthenticated = ogpUserContext.isAuthenticatedLocally();

		Map<String, String> map = new HashMap<String, String>();
		populateImageRequest();
		UUID requestId = imageHandler.requestImage(RequestContextHolder.currentRequestAttributes().getSessionId(), this.imageRequest);
		logger.debug("Image requested.");
		map.put("requestId", requestId.toString());
		return map;
	}
	
	
	private Boolean hasPermission(SolrRecord currentLayer){
	   	if (!currentLayer.getAccess().equalsIgnoreCase("public")){
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
	   	}
	}
	


	
	private void populateImageRequest() throws Exception{
		String baseQuery = generateBaseQuery(imageRequest);	
    	//I'm making the assumption that the overhead of having separate http requests
		//to Solr is far greater than iterating over these lists
		
	    List<SolrRecord> layerInfo = this.layerInfoRetriever.fetchAllLayerInfo(imageRequest.getLayerIds());
	    logger.info("Number of layers in image: " + Integer.toString(layerInfo.size()));
		for (LayerImage layerImage: imageRequest.getLayers()){
			String currentId = layerImage.getLayerId();
			for (SolrRecord solrRecord : layerInfo){
				if (!hasPermission(solrRecord)){
					//skip layers the user doesn't have permission to retrieve
					//the client should never send these layers, since the user shouldn't be able to preview them
					continue;
				}
				if (solrRecord.getLayerId().equalsIgnoreCase(currentId)){
					layerImage.setSolrRecord(solrRecord);
					String layerQueryString = "&layers=" + solrRecord.getWorkspaceName() + ":" + solrRecord.getName();
					String currentSLD = layerImage.getSld();
	    		   	if ((currentSLD != null)&&(!currentSLD.equals("null")&&(!currentSLD.isEmpty()))){
	    		   		layerQueryString += "&sld_body=" + URLEncoder.encode(currentSLD, "UTF-8");
	    		   	}
	    		   	
	    		   	layerImage.setQueryString(baseQuery + layerQueryString);
	    		   	logger.info(layerImage.getQueryString());
	    			if (this.searchConfigRetriever.hasWmsProxy(solrRecord.getInstitution(), solrRecord.getAccess())){ 
	    				layerImage.setBaseUrl(this.searchConfigRetriever.getWmsProxyInternal(solrRecord.getInstitution(), solrRecord.getAccess()));
	    			}  else {
	        		   	try {
	    					layerImage.setBaseUrl(OgpUtils.filterQueryString(LocationFieldUtils.getWmsUrl(solrRecord.getLocation())));
	    				} catch (Exception e1) {
	    					e1.printStackTrace();
	    				}
	    			}
					
				}
			}
		}
		
	}
	
	private String generateBaseQuery(ImageRequest imageRequest){
        //switch based on format to add dpi settings, change/add header info
		/*try {
			logger.info("format: " + imageRequest.getFormat());
		} catch (NullPointerException e){
			logger.info("format is null");
		}
		try {
			logger.info("srs: " + imageRequest.getSrs());
		} catch (NullPointerException e){
			logger.info("srs is null");
		}
		try {
			logger.info("bbox: " + imageRequest.getBbox());
		} catch (NullPointerException e){
			logger.info("bbox is null");
		}*/
		
        String genericQueryString;
    	genericQueryString = "service=wms&version=1.1.1&request=GetMap&format=" + imageRequest.getFormat() + "&SRS=" + imageRequest.getSrs();
        genericQueryString += "&styles=&bbox=" + imageRequest.getBbox();

    	if (imageRequest.getFormat().equals("image/png")){
	    	
    		/*int requestedDpi = 90;//dpi & size options?
    		url$ += "&format_options=dpi:" + Integer.toString(requestedDpi) + ";";
    		width = Integer.toString(Math.round(Integer.parseInt(width) * requestedDpi / 90));
    		height = Integer.toString(Math.round(Integer.parseInt(height) * requestedDpi / 90));
    		*/
    		genericQueryString += "&tiled=false&transparent=true";
    	} 
    	genericQueryString += "&height=" + imageRequest.getHeight() + "&width=" + imageRequest.getWidth();
    	logger.debug(genericQueryString);
    	return genericQueryString;
	}
}
