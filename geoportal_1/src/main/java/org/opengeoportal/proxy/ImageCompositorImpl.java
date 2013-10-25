package org.opengeoportal.proxy;

import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.awt.image.RescaleOp;
import java.io.File;
import java.io.IOException;
import java.util.Collections;
import java.util.List;

import javax.imageio.ImageIO;

import org.opengeoportal.proxy.controllers.ImageRequest;
import org.opengeoportal.proxy.controllers.ImageRequest.ImageStatus;
import org.opengeoportal.proxy.controllers.ImageRequest.LayerImage;
import org.opengeoportal.utilities.DirectoryRetriever;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;

public class ImageCompositorImpl implements ImageCompositor {
	private static final String FORMAT_SUFFIX = "png";

	final Logger logger = LoggerFactory.getLogger(this.getClass());
	private Graphics2D compositeImageGraphicsObj;
	@Autowired
	private DirectoryRetriever directoryRetriever;
	@Autowired
	private ImageDownloader imageDownloader;


	@Async
	@Override
	public void createComposite(ImageRequest imageRequest) {
		downloadLayerImages(imageRequest);
		logger.debug("Creating image composite...");
		BufferedImage compositeImage = new BufferedImage(imageRequest.getWidth(), imageRequest.getHeight(), BufferedImage.TYPE_INT_ARGB);

		try { 
			compositeImageGraphicsObj = compositeImage.createGraphics();

			//at this point, we need to iterate over the zIndexes, construct appropriate urls, layer on top of image, then write to a file
			//should sort based on zOrder
			List<LayerImage> layerImageList = imageRequest.getLayers();
			Collections.sort(layerImageList);
			for (LayerImage layerImage: layerImageList){			
				//now we have everything we need to create a request
				//this needs to be done for each image received
				try {
					processLayer(layerImage);
					layerImage.setImageStatus(ImageStatus.SUCCESS);
				} catch (Exception e) {
					//just skip it
					logger.error("There was an error processing this layer image.  Skipping...");
					layerImage.setImageStatus(ImageStatus.FAILED);
					e.printStackTrace();
				} 
			}
			try {
				imageRequest.setDownloadFile(writeImage(compositeImage));

			} catch (IOException e) {
				e.printStackTrace();
			}//write this location + status to the manager object
		} catch (Exception e){
			e.printStackTrace();
		} finally {   
			compositeImageGraphicsObj.dispose();
		}
	}

	private void downloadLayerImages(ImageRequest imageRequest) {
		List<LayerImage> layerImageList = imageRequest.getLayers();
		for (LayerImage layerImage: layerImageList){			
			//now we have everything we need to create a request
			//this needs to be done for each image received
			try {
				layerImage.setImageFileFuture(imageDownloader.getImage(layerImage.getBaseUrl(), layerImage.getQueryString()));
			} catch (Exception e) {
				//just skip it
				layerImage.setImageStatus(ImageStatus.FAILED);
				logger.error("There was a problem getting this image.  Skipping.");
				e.printStackTrace();
			} 
		}
	}

	private File getDirectory() throws IOException{
		File downloadDirectory = this.directoryRetriever.getDownloadDirectory();
		File newDir = File.createTempFile("OGP", "", downloadDirectory);
		newDir.delete();
		//Boolean success= 
		newDir.mkdir();
		newDir.setReadable(true);
		newDir.setWritable(true);
		return newDir;
	}

	private File writeImage(BufferedImage compositeImage) throws IOException{
		File imageDirectory = getDirectory();
		File outputFile = getOutputFile(imageDirectory);
		try {
			//write image to file
			ImageIO.write(compositeImage, FORMAT_SUFFIX, outputFile);
		} catch (IOException e) {
			//...
		} 

		logger.info("Image written");
		return outputFile;
	}

	private File getOutputFile(File imageDirectory){
		File outputFile;
		do {
			String outputFileName = "OGPImage." + FORMAT_SUFFIX;
			outputFile = new File(imageDirectory, outputFileName);
		} while (outputFile.exists());
		return outputFile;
	}

	private void processLayer(LayerImage layerImage) {
		//now we have everything we need to create a request
		logger.debug("processing layer");
		BufferedImage currentImg = null;
		File imgFile = null;
		try{
			try {
				imgFile = layerImage.getImageFileFuture().get();
				currentImg = ImageIO.read(imgFile);
			} catch (Exception e) {
				logger.error("Error reading image.");
			}

			logger.debug("image retrieved");
			//this needs to be done for each image received

			//this defines opacity
			float[] scales = { 1f, 1f, 1f, 1f};
			scales[3] = layerImage.getOpacity() / 100f;
			//System.out.println(scales[3]);
			float[] offsets = new float[4];
			RescaleOp rop = new RescaleOp(scales, offsets, null);
			logger.info("drawing layer...");
			compositeImageGraphicsObj.drawImage(currentImg, rop, 0, 0);

		} finally {
			//cleaning up temp file
			if (imgFile.exists()){
				imgFile.delete();
			}
		}
	}
}
