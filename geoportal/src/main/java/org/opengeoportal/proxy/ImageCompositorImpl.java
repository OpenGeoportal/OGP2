package org.opengeoportal.proxy;

import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.awt.image.IndexColorModel;
import java.awt.image.RescaleOp;
import java.io.File;
import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

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
	private Graphics2D compositeImageGraphicsObj = null;
	@Autowired
	private DirectoryRetriever directoryRetriever;

	private int width;
	private int height;
	private int maxSizeMB;
	private BufferedImage compositeImage = null;



	@Async
	@Override
	public void createComposite(ImageRequest imageRequest) {
				
		logger.debug("Starting compositing...");
		
		try { 
			
			//at this point, we need to iterate over the zIndexes, construct appropriate urls, layer on top of image, then write to a file
			//should sort based on zOrder
			List<LayerImage> layerImageList = imageRequest.getLayers();
			Collections.sort(layerImageList);
			
			//we need to do some data validation for width and height here.  if the image is too big, we will get an OutOfMemoryError
			setDimensions(imageRequest.getHeight(), imageRequest.getWidth());
			
			for (LayerImage layerImage: layerImageList){			
				
				//now we have everything we need to create a request
				//this needs to be done for each image received
				File imgFile = null;
				try {
					imgFile = layerImage.getImageFileFuture().get(4, TimeUnit.MINUTES);
				} catch (TimeoutException e) {
						//just skip it
						logger.error("There was an error retrieving this layer image.  The process timed out. Skipping...");
						layerImage.setImageStatus(ImageStatus.FAILED);
						e.printStackTrace();
						continue;
				} catch (ExecutionException e){
					logger.error("threw execution exception on 'get'.");
					layerImage.setImageStatus(ImageStatus.FAILED);
					e.printStackTrace();
					continue;
				}
					
					
				try{	
					logger.info("adding image to composite: " + layerImage.getLayerId());
					addImageToComposite(imgFile, layerImage.getOpacity());
					layerImage.setImageStatus(ImageStatus.SUCCESS);
				}  catch (Exception e){
					//just skip it
					logger.error("There was an error processing this layer image.  Skipping...");
					layerImage.setImageStatus(ImageStatus.FAILED);
					e.printStackTrace();
				}
				
			}

			if (compositeImage != null){
				imageRequest.setDownloadFile(writeImage(compositeImage));
			} else {
				throw new Exception("Image is null!");
			}

		} catch (Exception e){
			e.printStackTrace();
			for (LayerImage layerImage: imageRequest.getLayers()){	
				layerImage.setImageStatus(ImageStatus.FAILED);
			}
		} finally {   
			if (compositeImageGraphicsObj != null){
				compositeImageGraphicsObj.dispose();
			}
		}
	}


	private void setDimensions(Integer height, Integer width) throws Exception {
		//should I just throw an exception if there is a negative value?
		height = Math.abs(height);
		width = Math.abs(width);

		Long estImgSize = height.longValue() * width.longValue() * 4;	//number of bytes
		if (estImgSize >= getMaxSizeMB() * 1048576){
			//megaBytes * 1048576 bytes/MB
			throw new Exception("Image is too large! ['est. " + Long.toString(estImgSize/1048576) + " MB'] Not enough memory to process.");
		}
		this.height = height;
		this.width = width;
		
	}


	private File getDirectory() throws IOException{
		//?
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
			logger.warn("Exception writing image to disk.");
		} 

		logger.debug("Image written");
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

	private Graphics2D createCompositeImage(int width, int height){
		logger.debug("Creating image composite...");
		//we need to do some data validation for width and height here.  if the image is too big, we will get an OutOfMemoryError
		compositeImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
		compositeImageGraphicsObj = compositeImage.createGraphics();
		return compositeImageGraphicsObj;
	}
	
	private Graphics2D getCompositeImage(){
		if (compositeImageGraphicsObj == null){
			compositeImageGraphicsObj = createCompositeImage(width, height);
		}
		return compositeImageGraphicsObj;
	}
	
	private void addImageToComposite(File imgFile, int opacity) throws IOException  {
		//now we have everything we need to create a request
		logger.debug("adding layer to composite");
		if (imgFile == null){
			throw new IOException("File is null.");
		}
		
		try{
			BufferedImage currentImg = ImageIO.read(imgFile);

			logger.debug("image retrieved");
			//this needs to be done for each image received

			//this defines opacity
			float[] scales = { 1f, 1f, 1f, 1f};
			scales[3] = opacity / 100f;
			//System.out.println(scales[3]);
			float[] offsets = new float[4];
			RescaleOp rop = new RescaleOp(scales, offsets, null);

			Graphics2D composite = getCompositeImage();

			logger.debug("drawing layer...");
			try{
				composite.drawImage(currentImg, rop, 0, 0);
				
			} catch(IllegalArgumentException e){
				if (e.getMessage().contains("indexed")){
					logger.debug("trying to add indexed image.");
					composite.drawImage(rescaleAlpha(currentImg, scales[3]), 0, 0, null);
				} else {
					throw e;
				}

			}
			
		}finally {
			//cleaning up temp file
			if (imgFile.exists()){
				imgFile.delete();
			}
			
		}
	}


	public int getMaxSizeMB() {
		return maxSizeMB;
	}


	public void setMaxSizeMB(int maxSizeMB) {
		this.maxSizeMB = maxSizeMB;
	}
	


	/**
	 * https://forums.oracle.com/thread/1269537
	 * @param icm
	 * @param alphaScaleFactor
	 * @return
	 */

	public static IndexColorModel rescaleAlpha(IndexColorModel icm, float alphaScaleFactor) {

		int size = icm.getMapSize();

		byte[] reds=new byte[size], greens=new byte[size], blues=new byte[size], alphas=new byte[size];

		icm.getReds(reds);

		icm.getGreens(greens);

		icm.getBlues(blues);

		icm.getAlphas(alphas);

		rescale(alphas, alphaScaleFactor);

		return new IndexColorModel(8, size, reds, greens, blues, alphas);

	}

	/**
	 * https://forums.oracle.com/thread/1269537
	 * 
	 * @param comps
	 * @param scaleFactor
	 */


	public static void rescale(byte[] comps, float scaleFactor) {

		for(int i=0; i<comps.length; ++i) {

			int comp = 0xff & comps[i];

			int newComp = Math.round(comp*scaleFactor);

			if (newComp < 0){
				newComp = 0;
			} else if (newComp > 255){
				newComp = 255;
			}

			comps[i] = (byte) newComp;

		}

	}


	/**
	 * https://forums.oracle.com/thread/1269537
	 * @param indexed
	 * @param alphaFactor
	 * @return
	 */

	public static BufferedImage rescaleAlpha(BufferedImage indexed, float alphaFactor) {

		IndexColorModel icm = (IndexColorModel) indexed.getColorModel();

		return new BufferedImage(rescaleAlpha(icm, alphaFactor), indexed.getRaster(), false, null);

	}







}
