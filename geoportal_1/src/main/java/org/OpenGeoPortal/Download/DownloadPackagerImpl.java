package org.OpenGeoPortal.Download;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipException;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

import org.OpenGeoPortal.Download.Config.DownloadConfigRetriever;
import org.OpenGeoPortal.Download.Types.LayerDisposition;
import org.OpenGeoPortal.Download.Types.LayerRequest;
import org.OpenGeoPortal.Download.Types.LayerStatus;
import org.OpenGeoPortal.Solr.SearchConfigRetriever;
import org.OpenGeoPortal.Utilities.FileName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;


/**
 * packages downloaded layers together in a zip file. should be called by download job if certain conditions are met (downloads are finished)
 * 
 * @author Chris Barnett
 *
 */
public class DownloadPackagerImpl implements DownloadPackager {
	private MetadataRetriever metadataRetriever;
	@Autowired
	private DownloadStatusManager downloadStatusManager;
	
	/**
	 * a MetadataRetriever is injected
	 * @param metadataRetriever
	 */
	public void setMetadataRetriever(MetadataRetriever metadataRetriever){
		this.metadataRetriever = metadataRetriever;
	}
	
	/**
	 * 
	 */
	@Async
	public void packageFiles(UUID requestId){
		
		
	}
	
	/**
	 * defines what post processing happens after layers are downloaded.  In this case, retrieves metadata if needed,
	 * adds all the files to a zip archive
	 */
	/*void doWork() {
		final File downloadDirectory = this.getDownloadDirectory();
		try {
			this.addFilesToZipArchive();
			this.setLayerLink(this.downloadDirectoryName + "/" + this.zipArchive.getName());
		} catch (Exception e) {
			System.out.println("File Download Error(doWork): " + e.getMessage());
		} 
	}*/

	private Set<File> getFilesToPackage(){
		//we can get this from the DownloadStatusManager
	    Set<File> filesToPackage = new HashSet<File>();
	    downloadStatusManager.
	    for (LayerRequest layer : this.layers) {
	    	if ((layer.getStatus() == LayerStatus.DOWNLOAD_SUCCESS)&&
    			(layer.getDisposition() == LayerDisposition.DOWNLOADED_LOCALLY)){

	    		if (!layer.metadata){
	    			//get metadata for this layer, add the resulting xml file to the file list
	    			File xmlFile;
	    			if (layer.isVector()&&(!layer.requestedFormat.equals("kmz"))){
	    				xmlFile = new File(this.getDownloadDirectory(), FileName.filter(layer.name) + ".shp.xml");
	    			} else {
	    				xmlFile = new File(this.getDownloadDirectory(), FileName.filter(layer.name) + ".xml");
	    			}

	    			try {
						layer.downloadedFiles.add(this.metadataRetriever.getXMLFile(layer.name, xmlFile));
					} catch (Exception e) {
						// TODO Auto-generated catch block
						//couldn't get the metadata, but don't kill the download
						e.printStackTrace();
					} 
	    		}
	    		
	    		filesToPackage.addAll(layer.downloadedFiles);

	    	}
	    }

		return filesToPackage;
	};

}
