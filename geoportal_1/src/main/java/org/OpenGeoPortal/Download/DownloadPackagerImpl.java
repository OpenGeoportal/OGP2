package org.OpenGeoPortal.Download;

import java.io.File;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.OpenGeoPortal.Download.DownloadStatusManagerImpl.DownloadRequestStatus;
import org.OpenGeoPortal.Download.Types.LayerDisposition;
import org.OpenGeoPortal.Download.Types.LayerRequest;
import org.OpenGeoPortal.Download.Types.LayerStatus;
import org.OpenGeoPortal.Layer.GeometryType;
import org.OpenGeoPortal.Utilities.OgpFileUtils;
import org.OpenGeoPortal.Utilities.ZipFilePackager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;


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
	private DownloadStatusManager downloadStatusManager;
	private File directory;

	final Logger logger = LoggerFactory.getLogger(this.getClass());

	/**
	 * @throws Exception 
	 * 
	 */
	@Async
	public void packageFiles(UUID requestId) throws Exception{
		DownloadRequestStatus downloadStatus = downloadStatusManager.getDownloadRequestStatus(requestId);
		Set <File> filesToPackage = getFilesToPackage(downloadStatus.getRequestList());
		if (filesToPackage.isEmpty()){
			throw new Exception("No files to package.");
		}
		File zipArchive = new File(directory, "OGPDownload.zip");
		ZipFilePackager.addFilesToArchive(filesToPackage, zipArchive);
		downloadStatus.setDownloadPackage(zipArchive);
	}
	
	private Set<File> getFilesToPackage(List<LayerRequest> layers){
		//we can get this from the DownloadStatusManager
	    Set<File> filesToPackage = new HashSet<File>();
	    directory = null;
	    for (LayerRequest layer : layers) {
	    	if ((layer.getStatus() == LayerStatus.DOWNLOAD_SUCCESS)&&
    			(layer.getDisposition() == LayerDisposition.DOWNLOADED_LOCALLY)){

	    		if (!layer.hasMetadata()){
	    			//get metadata for this layer, add the resulting xml file to the file list
	    			File xmlFile;
	    			if (directory == null){
	    				directory = layer.getDownloadedFiles().iterator().next().getParentFile();
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
						//e.printStackTrace();
						
					} 
	    		}
	    		
	    		filesToPackage.addAll(layer.downloadedFiles);

	    	}
	    }

		return filesToPackage;
	};

}
