package org.opengeoportal.proxy;

import java.io.File;
import java.io.UnsupportedEncodingException;
import java.net.URL;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Future;

import org.opengeoportal.config.exception.ConfigException;
import org.opengeoportal.config.proxy.InternalServerMapping;
import org.opengeoportal.config.proxy.ProxyConfigRetriever;
import org.opengeoportal.download.RequestStatusManager;
import org.opengeoportal.proxy.ImageRequest.ImageStatus;
import org.opengeoportal.proxy.ImageRequest.LayerImage;
import org.opengeoportal.proxy.exception.EmptyImageRequestException;
import org.opengeoportal.search.OGPRecord;
import org.opengeoportal.search.exception.SearchServerException;
import org.opengeoportal.service.SearchService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

@Component
@Scope("prototype")
public class ImageHandlerImpl implements ImageHandler {
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	private final RequestStatusManager requestStatusManager;
	private final ImageCompositor imageCompositor;
	private final ImageDownloaderFactory imageDownloaderFactory;
	private final SearchService searchService;
	private final ProxyConfigRetriever proxyConfigRetriever;
	private String baseQuery;

	@Autowired
	public ImageHandlerImpl(RequestStatusManager requestStatusManager, ImageCompositor imageCompositor,
							ImageDownloaderFactory imageDownloaderFactory, SearchService searchService,
							ProxyConfigRetriever proxyConfigRetriever) {
		this.requestStatusManager = requestStatusManager;
		this.imageCompositor = imageCompositor;
		this.imageDownloaderFactory = imageDownloaderFactory;
		this.searchService = searchService;
		this.proxyConfigRetriever = proxyConfigRetriever;
	}

	@Override
	public UUID requestImage(String sessionId, ImageRequest imageRequest) throws Exception {

		UUID requestId = registerRequest(sessionId, imageRequest);
		logger.debug("Image Request registered: " + requestId.toString());
		try {
			downloadLayerImages(imageRequest);
			imageCompositor.createComposite(imageRequest);

		} catch (ConfigException e) {
			logger.error(e.getMessage());
			throw new Exception("Problem with configuration.");
		}

		return requestId;
	}
	
	private UUID registerRequest(String sessionId, ImageRequest imageRequest) {
		UUID requestId = UUID.randomUUID();
		requestStatusManager.addImageRequest(requestId, sessionId, imageRequest);
		return requestId;
	}	

	
	private void downloadLayerImages(ImageRequest imageRequest) throws Exception, ConfigException {
		List<LayerImage> layerImageList = imageRequest.getLayers();

		setBaseQuery(imageRequest.getFormat(), imageRequest.getBbox(), imageRequest.getSrs(), 
				imageRequest.getHeight(), imageRequest.getWidth());
		//populateImageRequest depends on setBaseQuery running first
		try {
			populateImageRequest(imageRequest);
		} catch (EmptyImageRequestException | SearchServerException e){
			logger.error(e.getMessage());
			return;
		}

		for (LayerImage layerImage: layerImageList){			
			//now we have everything we need to create a request
			//this needs to be done for each image received
			logger.debug(layerImage.getUrl().toString());
			ImageDownloader imageDownloader = imageDownloaderFactory.getObject();
			OGPRecord record = layerImage.getOgpRecord();

			if (hasCredentials(record)) {
				InternalServerMapping serverMapping = proxyConfigRetriever.getInternalServerMapping("wms",
						record.getInstitution(), record.getAccess());
				try {
					Future<File> imgFile = imageDownloader.getImage(layerImage.getUrl(),
							serverMapping.getUsername(), serverMapping.getPassword());
					layerImage.setImageFileFuture(imgFile);

				} catch (Exception e) {
					//just skip it
					layerImage.setImageStatus(ImageStatus.FAILED);
					logger.error("There was a problem getting this image.  Skipping.");
					e.printStackTrace();
				}
			} else {
				try {
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

	}

	private boolean hasCredentials(OGPRecord ogpRecord) {
		InternalServerMapping serverMapping = null;
		try {
			serverMapping = proxyConfigRetriever.getInternalServerMapping("wms",
					ogpRecord.getInstitution(), ogpRecord.getAccess());
			return proxyConfigRetriever.hasCredentials(serverMapping);
		} catch (ConfigException e) {
			logger.debug(e.getMessage());
		}

		return false;
	}
	
	private void populateImageRequest(ImageRequest imageRequest) throws EmptyImageRequestException, SearchServerException {
		//only retrieve records the user has permission to access data for
		List<? extends OGPRecord> layerInfo = this.searchService.findAllowedRecordsById(new ArrayList<>(imageRequest.getLayerIds()));
	    logger.debug("Number of layers in image: " + Integer.toString(layerInfo.size()));
		if (layerInfo.size() == 0){
			throw new EmptyImageRequestException("No layers in image request.");
		}
		for (LayerImage layerImage: imageRequest.getLayers()){
			
			String currentId = layerImage.getLayerId();
			
			for (OGPRecord record : layerInfo){
				
				if (record.getLayerId().equalsIgnoreCase(currentId)){
					layerImage.setOgpRecord(record);
					populateLayerUrl(layerImage);				
				}
			}
		}
		
	}
	
	private void populateLayerUrl(LayerImage layerImage){
		
		OGPRecord record = layerImage.getOgpRecord();
		
		String layerQueryString = "&layers=" + record.getWorkspaceName() + ":" + record.getName();
		String currentSLD = layerImage.getSld();
	   	if ((currentSLD != null)&&(!currentSLD.equals("null")&&(!currentSLD.isEmpty()))){
	   		try {
				layerQueryString += "&sld_body=" + URLEncoder.encode(currentSLD, "UTF-8");
			} catch (UnsupportedEncodingException e) {
				//problem with the sld encoding...just ignore the sld.
				logger.error("There was a problem with the SLD encoding.  Requesting image without SLD. ");
			}
	   	}

	   	String baseUrl = "";

	   	try{
	   		baseUrl = this.proxyConfigRetriever.getInternalUrl("wms", record.getInstitution(),
					record.getAccess(), record.getLocation());
	   		layerImage.setUrl(new URL(baseUrl + "?" + baseQuery + layerQueryString));

	   	} catch (Exception | ConfigException e1) {
	   		logger.error("Problem retrieving a URL for this layer: " + e1.getMessage());
	   		//there's some problem retrieving a url.  skip the layer
	   	}
	}
	
	private void setBaseQuery(String format, String bbox, String srs, int height, int width){
		
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
    	baseQuery = genericQueryString;
	}
	

}
