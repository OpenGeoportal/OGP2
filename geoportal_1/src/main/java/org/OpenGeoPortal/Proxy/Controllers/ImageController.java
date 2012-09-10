package org.OpenGeoPortal.Proxy.Controllers;

import java.io.IOException;
import java.net.URLEncoder;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import javax.servlet.http.HttpServletRequest;

import org.OpenGeoPortal.Authentication.OgpUserContext;
import org.OpenGeoPortal.Download.Types.BoundingBox;
import org.OpenGeoPortal.Metadata.LayerInfoRetriever;
import org.OpenGeoPortal.Proxy.ImageCompositor;
import org.OpenGeoPortal.Proxy.Controllers.ImageRequest.LayerImage;
import org.OpenGeoPortal.Solr.SearchConfigRetriever;
import org.OpenGeoPortal.Solr.SolrRecord;
import org.codehaus.jackson.JsonNode;
import org.codehaus.jackson.JsonProcessingException;
import org.codehaus.jackson.map.ObjectMapper;
import org.codehaus.jackson.node.ArrayNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.context.request.RequestContextHolder;

@Controller
@RequestMapping("/getImage")
public class ImageController {
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	@Autowired
	private LayerInfoRetriever layerInfoRetriever;
	@Autowired
	private SearchConfigRetriever searchConfigRetriever;
	private ImageCompositor imageCompositor;
	private String proxyTo;
	private String home;
	private boolean isLocallyAuthenticated;
	@Autowired
	private OgpUserContext ogpUserContext;
	
	public String getProxyTo() {
		return proxyTo;
	}

	public void setProxyTo(String proxyTo) {
		this.proxyTo = proxyTo;
	}

	@RequestMapping(method=RequestMethod.POST, produces="application/json")
	public @ResponseBody MultiValueMap<String,String> processImageRequest(HttpServletRequest request, Model model) throws Exception {
		 /**
		 * ultimately, this servlet, given the above parameters + z order, should be able to grab images
		 * from various servers and composite them.  Should be passed a custom json object to maintain structure.
		 * 
		 * offer formats available via geoserver.
		 * 
		 * determine if a layer is within the provided bounds and exclude it if not
		 * 
		 * @author Chris Barnett
		 */

		this.home = this.searchConfigRetriever.getHome();
		this.isLocallyAuthenticated = ogpUserContext.isAuthenticatedLocally();
		MultiValueMap<String, String> map = new LinkedMultiValueMap<String, String>();
		ImageRequest imageRequest = createImageRequest(request);
	            
		String sessionId = RequestContextHolder.currentRequestAttributes().getSessionId();
		UUID requestId = imageCompositor.requestImage(sessionId, imageRequest);
		map.add("requestId", requestId.toString());
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
				// TODO Auto-generated catch block
				e.printStackTrace();
				return false;
			}
	   	} else {
	   		return true;
	   	}
	}
	
	private ImageRequest createImageRequest(HttpServletRequest request) throws JsonProcessingException, IOException{
		ImageRequest imageRequest = new ImageRequest();
		//read the POST'ed JSON object
		ObjectMapper mapper = new ObjectMapper();
		JsonNode rootNode = mapper.readTree(request.getInputStream());
		imageRequest.setSrs(rootNode.path("srs").getTextValue());
		String bounds = rootNode.path("bbox").getTextValue();
		String[] arrBounds = bounds.split(",");
		imageRequest.setBounds(new BoundingBox(arrBounds[0], arrBounds[1], arrBounds[2], arrBounds[3]));
		imageRequest.setFormat(URLEncoder.encode(rootNode.path("format").getTextValue(), "UTF-8"));
		imageRequest.setHeight(rootNode.path("height").asInt());
		imageRequest.setWidth(rootNode.path("width").asInt());
		
		String baseQuery = generateBaseQuery(imageRequest);
		ArrayNode layers = (ArrayNode) rootNode.path("layers");

		Iterator<JsonNode> layerIterator = layers.iterator();
	    Set<String> layerIds = new HashSet<String>();

		while (layerIterator.hasNext()){
			//actually, lets use zIndex as a key, and make this a sorted map
			JsonNode currentLayer = layerIterator.next();
			LayerImage currentLayerImage = imageRequest.new LayerImage();
			String layerId = currentLayer.path("layerId").getTextValue();
			currentLayerImage.setLayerId(layerId);
			layerIds.add(layerId);
			String queryString = baseQuery;
			String sld = currentLayer.path("sld").getTextValue();
  		   	if ((sld != null)&&(!sld.equals("null")&&(!sld.isEmpty()))){
		   		queryString += "&sld_body=" + sld;//URLEncoder.encode(currentSLD, "UTF-8");
				currentLayerImage.setSld(sld);
		   	}
			int opacity = currentLayer.path("opacity").asInt();
			currentLayerImage.setOpacity(opacity);
			currentLayerImage.setQueryString(queryString);
			imageRequest.addLayerImage(currentLayerImage);
		}
    	//I'm making the assumtion that the overhead of having separate http requests
		//to Solr is far greater than iterating over these lists
	    List<SolrRecord> layerInfo = null;
	    try {
			layerInfo = this.layerInfoRetriever.fetchAllLayerInfo(layerIds);
		} catch (Exception e) {
			//e.printStackTrace();
			//response.sendError(500);
		}
		
		for (LayerImage layerImage: imageRequest.getLayerImages()){
			String currentId = layerImage.getLayerId();
			for (SolrRecord solrRecord : layerInfo){
				if (!hasPermission(solrRecord)){
					//skip layers the user doesn't have permission to retrieve
					layerInfo.remove(solrRecord);
					continue;
				}
				if (solrRecord.getLayerId().equalsIgnoreCase(currentId)){
					layerImage.setSolrRecord(solrRecord);
	    		   	layerImage.setQueryString(layerImage.getQueryString() + "&layers=" + solrRecord.getWorkspaceName() + ":" + solrRecord.getLayerDisplayName());

	    		   	//a kludge;  really the simplegenericproxy should be able to handle this
	    		   	//System.out.println(this.layerInfoRetriever.hasProxy(currentLayerMap));
	    			if (this.layerInfoRetriever.hasProxy(solrRecord)){
	    				layerImage.setBaseUrl(this.proxyTo);
	    			}  else {
	        		   	try {
	    					layerImage.setBaseUrl(this.layerInfoRetriever.getWMSUrl(solrRecord));
	    				} catch (Exception e1) {
	    					// TODO Auto-generated catch block
	    					e1.printStackTrace();
	    				}
	    			}
					layerInfo.remove(solrRecord);
				}
			}
		}
		
		return imageRequest;
	}
	
	private String generateBaseQuery(ImageRequest imageRequest){
        //switch based on format to add dpi settings, change/add header info
        String genericQueryString;
    	genericQueryString = "service=wms&version=1.1.1&request=GetMap&format=" + imageRequest.getFormat() + "&SRS=" + imageRequest.getSrs();
        genericQueryString += "&styles=&bbox=" + imageRequest.getBounds().toString();

    	if (imageRequest.getFormat().equals("image/png")){
	    	
    		/*int requestedDpi = 90;//dpi & size options?
    		url$ += "&format_options=dpi:" + Integer.toString(requestedDpi) + ";";
    		width = Integer.toString(Math.round(Integer.parseInt(width) * requestedDpi / 90));
    		height = Integer.toString(Math.round(Integer.parseInt(height) * requestedDpi / 90));
    		*/
    		genericQueryString += "&tiled=false&transparent=true";
    	} 
    	genericQueryString += "&height=" + imageRequest.getHeight() + "&width=" + imageRequest.getWidth();
    	return genericQueryString;
	}
}
