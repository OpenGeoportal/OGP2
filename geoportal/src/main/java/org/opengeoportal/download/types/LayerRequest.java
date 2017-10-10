package org.opengeoportal.download.types;

import java.io.File;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.Future;

import org.opengeoportal.layer.BoundingBox;
import org.opengeoportal.ogc.OwsInfo;
import org.opengeoportal.solr.SolrRecord;
import org.opengeoportal.utilities.LocationFieldUtils;
import org.opengeoportal.utilities.OgpUtils;

import com.fasterxml.jackson.core.JsonParseException;

public class LayerRequest {
	final String id;
	final SolrRecord layerInfo;
	List<OwsInfo> owsInfo;
	private String requestedFormat;
	private UUID jobId;
	private String emailAddress = "";
	private Status status;
	private File targetDirectory;
	private BoundingBox requestedBounds;
	private String epsgCode;
	private Boolean shouldHaveFiles = true; //defaults to true.  right now, only emailed layers shouldn't have Files
	public Set<File> downloadedFiles = new HashSet<File>();
	public String responseMIMEType;
	public Map<String, List<String>> responseHeaders;
	public Boolean metadata;
	private Date timeStamp;
	private Future<?> futureValue;

	public LayerRequest(SolrRecord record, String requestedFormat){
		this.id = record.getLayerId();
		this.layerInfo = record;
		this.timeStamp = new Date();

		//probably best to make all values with a limited set of possibilities enums
		this.setRequestedFormat(requestedFormat);
		this.status = Status.PROCESSING;
	}
	
	public enum Status {
		PROCESSING,
		FAILED,
		SUCCESS
	}

	public Date getTimeStamp(){
		return this.timeStamp;
	}
	
	public UUID getJobId() {
		return jobId;
	}

	public void setJobId(UUID jobId) {
		this.jobId = jobId;
	}

	public String getEmailAddress() {
		return emailAddress;
	}

	public void setEmailAddress(String emailAddress) {
		this.emailAddress = emailAddress;
	}
	
	public SolrRecord getLayerInfo(){
		return this.layerInfo;
	}

	public List<OwsInfo> getOwsInfo() {
		return owsInfo;
	}

	public void setOwsInfo(List<OwsInfo> owsInfo) {
		this.owsInfo = owsInfo;
	}

	public File getTargetDirectory() {
		return targetDirectory;
	}

	public void setTargetDirectory(File targetDirectory) {
		this.targetDirectory = targetDirectory;
	}

	public BoundingBox getRequestedBounds() {
		return requestedBounds;
	}

	public void setRequestedBounds(BoundingBox requestedBounds) {
		this.requestedBounds = requestedBounds;
	}

	public String getEpsgCode() {
		return epsgCode;
	}

	public void setEpsgCode(String epsgCode) {
		this.epsgCode = epsgCode;
	}

	public Set<File> getDownloadedFiles() {
		return downloadedFiles;
	}

	public void setDownloadedFiles(Set<File> downloadedFiles) {
		this.downloadedFiles = downloadedFiles;
	}

	public String getResponseMIMEType() {
		return responseMIMEType;
	}

	public void setResponseMIMEType(String responseMIMEType) {
		this.responseMIMEType = responseMIMEType;
	}

	public Map<String, List<String>> getResponseHeaders() {
		return responseHeaders;
	}

	public void setResponseHeaders(Map<String, List<String>> responseHeaders) {
		this.responseHeaders = responseHeaders;
	}

	public void setMetadata(Boolean metadata) {
		this.metadata = metadata;
	}

	public String getRequestedFormat() {
		return requestedFormat;
	}

	public String getId() {
		return id;
	}

	private void setRequestedFormat(String requestedFormat){
		requestedFormat = requestedFormat.toLowerCase().trim();
		if (requestedFormat.equals("kml")){
			requestedFormat = "kmz";
		}
		this.requestedFormat = requestedFormat;
	}
	
	public void setStatus(Status status){
		this.status = status;
	}
	
	public Status getStatus(){
		return this.status;
	}
	
	public String getLayerNameNS() throws Exception{
		return OgpUtils.getLayerNameNS(this.layerInfo.getWorkspaceName(), this.layerInfo.getName());
	}

	public String getWmsUrl() throws JsonParseException{
		return LocationFieldUtils.getWmsUrl(this.layerInfo.getLocation());
	}
	
	public String getWfsUrl() throws Exception{
		String url = "";

		try {
			url = LocationFieldUtils.getWfsUrl(this.layerInfo.getLocation());
		} catch (JsonParseException e){
			Map<String,String> infoMap = OwsInfo.findWmsInfo(this.getOwsInfo()).getInfoMap();
			if (infoMap.get("owsType").equalsIgnoreCase("wfs")){
				url = infoMap.get("owsUrl");
			}
		}
		if (url.isEmpty()){
			throw new Exception("No WFS url found!");
		}
		return url;
	}
	
	public String getWcsUrl() throws Exception{
		String url = "";

		try {
			url = LocationFieldUtils.getWcsUrl(this.layerInfo.getLocation());
		} catch (JsonParseException e){
			Map<String,String> infoMap = OwsInfo.findWmsInfo(this.getOwsInfo()).getInfoMap();
			if (infoMap.get("owsType").equalsIgnoreCase("wcs")){
				url = infoMap.get("owsUrl");
			}
		}
		if (url.isEmpty()){
			throw new Exception("No WCS url found!");
		}
		return url;
	}
	
	public List<String> getDownloadUrl() throws JsonParseException{
		return LocationFieldUtils.getDownloadUrl(this.layerInfo.getLocation());
	}

	public boolean hasMetadata() {
		return metadata;
	}

	public Future<?> getFutureValue() {
		return futureValue;
	}

	public void setFutureValue(Future<?> futureValue) {
		this.futureValue = futureValue;
	}

	public Boolean getShouldHaveFiles() {
		return shouldHaveFiles;
	}

	public void setShouldHaveFiles(Boolean shouldHaveFiles) {
		this.shouldHaveFiles = shouldHaveFiles;
	}

}
