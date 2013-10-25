package org.opengeoportal.download;

import java.io.File;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.Future;

import org.opengeoportal.download.DownloadRequest;
import org.opengeoportal.download.MethodLevelDownloadRequest;
import org.opengeoportal.download.types.LayerRequest;
import org.opengeoportal.download.types.LayerRequest.Status;
import org.opengeoportal.layer.GeometryType;
import org.opengeoportal.utilities.OgpFileUtils;
import org.opengeoportal.utilities.ZipFilePackager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.AsyncResult;


/**
 * packages downloaded layers together in a zip file. should be called by download job if certain conditions are met (downloads are finished)
 * 
 * @author Chris Barnett
 *
 */
public class DownloadPackagerImpl implements DownloadPackager {
	@Autowired
	private MetadataRetriever metadataRetriever;
	@Autowired
	private RequestStatusManager requestStatusManager;
	private File directory;

	final Logger logger = LoggerFactory.getLogger(this.getClass());

	/**
	 * @throws Exception 
	 * 
	 */
	@Async
	public Future<Boolean> packageFiles(UUID requestId) throws Exception{
		//first determine if all requests are complete
		DownloadRequest downloadRequest = requestStatusManager.getDownloadRequest(requestId);
		if (!downloadRequest.isReadyForPackaging()){
			logger.info("Request is not yet complete; not ready to package.");
			return new AsyncResult<Boolean>(false);
		}
		List<LayerRequest> layerList = new ArrayList<LayerRequest>();
		List<MethodLevelDownloadRequest> requests = downloadRequest.getRequestList();
		for (MethodLevelDownloadRequest request: requests){
			layerList.addAll(request.getRequestList());
		}
		Set<File> filesToPackage = getFilesToPackage(layerList);

		logger.debug(directory.getAbsolutePath());
		logger.info("Packaging files");
		File zipArchive = new File(directory, "OGPDownload.zip");
		ZipFilePackager.addFilesToArchive(filesToPackage, zipArchive);
		downloadRequest.setDownloadPackage(zipArchive);
		return new AsyncResult<Boolean>(true);
	}
	
	private Set<File> getFilesToPackage(List<LayerRequest> layers) throws Exception{
		//we can get this from the DownloadStatusManager
		logger.debug("Getting files to package...");
	    Set<File> filesToPackage = new HashSet<File>();
	    directory = null;
	    logger.debug(Integer.toString(layers.size()) + " layer(s) found");
	    for (LayerRequest layer : layers) {
	    	if (!layer.getShouldHaveFiles()){
	    		//skip
	    		continue;
	    	}
	    	logger.debug(layer.getStatus().toString());
	    	if (layer.getStatus() == Status.SUCCESS){
	    		Set<File> downloadedFiles = layer.getDownloadedFiles();
	    		if (downloadedFiles.isEmpty()){
	    			logger.error("No files found for: " + layer.getLayerNameNS());
	    			continue;
	    		}
	    		logger.debug(layer.getId());
    			if (directory == null){
    				directory = downloadedFiles.iterator().next().getParentFile();
    			}
	    		if (!layer.hasMetadata()){
	    			//get metadata for this layer, add the resulting xml file to the file list
	    			addMetadata(directory, layer);
	    		} else {
	    			logger.debug("Metadata is included");
	    		}
	    		//logger.debug(Integer.toString(layer.downloadedFiles.size()) + " File(s)");
	    		filesToPackage.addAll(layer.getDownloadedFiles());

	    	} else {
	    		logger.debug("Not doing anything");
	    	}
	    }
		if (filesToPackage.isEmpty()){
			logger.info("No files to package");
			throw new Exception("No files to package.");
		}

		return filesToPackage;
	}
	
	private void addMetadata(File directory, LayerRequest layer){
		//get metadata for this layer, add the resulting xml file to the file list
		logger.info("Retrieving metadata...");
		File xmlFile;
		for (File temp: layer.downloadedFiles){
			logger.debug(temp.getName());
		}
		if (GeometryType.isVector(GeometryType.parseGeometryType(layer.getLayerInfo().getDataType()))&&(!layer.getRequestedFormat().equals("kmz"))){
			xmlFile = new File(directory, OgpFileUtils.filterName(layer.getLayerInfo().getName()) + ".shp.xml");
		} else {
			xmlFile = new File(directory, OgpFileUtils.filterName(layer.getLayerInfo().getName()) + ".xml");
		}

		try {
			layer.downloadedFiles.add(this.metadataRetriever.getXMLFile(layer.getLayerInfo().getName(), xmlFile));
		} catch (Exception e) {
			//couldn't get the metadata, but don't kill the download
			logger.error(e.getMessage());
			e.printStackTrace();
		} 
	}

}
