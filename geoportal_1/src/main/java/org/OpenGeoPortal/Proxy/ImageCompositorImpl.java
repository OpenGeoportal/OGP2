package org.OpenGeoPortal.Proxy;

import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.awt.image.RescaleOp;
import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import javax.imageio.ImageIO;

import org.OpenGeoPortal.Proxy.Controllers.ImageRequest;
import org.OpenGeoPortal.Proxy.Controllers.ImageRequest.LayerImage;
import org.OpenGeoPortal.Utilities.DirectoryRetriever;
import org.OpenGeoPortal.Utilities.HttpRequester;
import org.OpenGeoPortal.Utilities.ZipFilePackager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;

public class ImageCompositorImpl implements ImageCompositor {
	private static final String DOWNLOAD_DIRECTORY = "download";
    private static final String FORMAT_SUFFIX = "png";

	final Logger logger = LoggerFactory.getLogger(this.getClass());
	private Graphics2D compositeImageGraphicsObj;
	@Autowired
	private DirectoryRetriever directoryRetriever;
	@Autowired
	private HttpRequester httpRequester;
	@Autowired
	private ImageStatusManager imageStatusManager;
	
	@Override
	@Async
	public UUID requestImage(String sessionId, ImageRequest imageRequest){
		UUID requestID = registerRequest(sessionId, imageRequest);
		try {
			createComposite(imageRequest);
		} catch (IOException e) {
			//should write some status info to the manager object
			e.printStackTrace();
		}
		return requestID;
	}
	
	private UUID registerRequest(String sessionId, ImageRequest imageRequest) {
		UUID requestId = UUID.randomUUID();
		logger.info(requestId.toString());
		ImageStatus imageStatus = new GenericImageStatus();
		imageStatusManager.addImageStatus(requestId, sessionId, imageStatus);
		return requestId;
	}

	public void createComposite(ImageRequest imageRequest) throws IOException{
	    BufferedImage compositeImage = new BufferedImage(imageRequest.getWidth(), imageRequest.getHeight(), BufferedImage.TYPE_INT_ARGB);
	    
	    try { 
	    	compositeImageGraphicsObj = compositeImage.createGraphics();

	    	//at this point, we need to iterate over the zIndexes, construct appropriate urls, layer on top of image, then write to a file
	    	//should sort based on zOrder
	    	List<LayerImage> layerImages = imageRequest.getLayerImages();
	    	Collections.sort(layerImages);
	    	for (LayerImage layerImage: layerImages){			
    		   	//now we have everything we need to create a request
    		   	//this needs to be done for each image received
	    		try {
	    			processLayer(layerImage.getBaseUrl(), layerImage.getQueryString(), layerImage.getOpacity());
	    		} catch (MalformedURLException e) {
	    			//just skip it
	    		} 
	    	}
	    	writeImageArchive(compositeImage);//write this location + status to the manager object
	    } finally {   
	        compositeImageGraphicsObj.dispose();
		}
    }
	
	private File writeImageArchive(BufferedImage compositeImage) throws IOException{
    	File imageDirectory = directoryRetriever.getDirectory(DOWNLOAD_DIRECTORY);
		File outputFile = getOutputFile(imageDirectory);
        try {
            //write image to file
            ImageIO.write(compositeImage, FORMAT_SUFFIX, outputFile);
        } catch (IOException e) {
            //...
        } 
        File archive = ZipFilePackager.zipUpFile(outputFile);
        return archive;
	}
	
		private File getOutputFile(File imageDirectory){
    		File outputFile;
			do {
    			String outputFileName = "OGPImage" + Math.round(Math.random() * 10000) + "." + FORMAT_SUFFIX;
    			outputFile = new File(imageDirectory, outputFileName);
    		} while (outputFile.exists());
			return outputFile;
		}
	
	private void processLayer(String serviceURL, String requestString, int opacity) throws MalformedURLException{
	   	//now we have everything we need to create a request
	   	
	   	BufferedImage currentImg = null;
	    try {
	    	currentImg = ImageIO.read(this.httpRequester.sendRequest(serviceURL, requestString,
	    			"GET", null));
	    } catch (IOException e) {}
            
	   	//this needs to be done for each image received
        
        //this defines opacity...do I need this, or will sld take care of it?
        float[] scales = { 1f, 1f, 1f, 1f};
        scales[3] = opacity / 100f;
        //System.out.println(scales[3]);
        float[] offsets = new float[4];
        RescaleOp rop = new RescaleOp(scales, offsets, null);
		compositeImageGraphicsObj.drawImage(currentImg, rop, 0, 0);
	}
}
