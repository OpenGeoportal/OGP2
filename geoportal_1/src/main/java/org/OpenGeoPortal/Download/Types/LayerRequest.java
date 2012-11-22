package org.OpenGeoPortal.Download.Types;

import java.io.File;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.Future;

import org.OpenGeoPortal.Solr.SolrRecord;
import org.OpenGeoPortal.Utilities.ParseJSONSolrLocationField;

public class LayerRequest {
	final String id;
	final SolrRecord layerInfo;
	private String requestedFormat;
	private UUID jobId;
	private String emailAddress = "";
	private Status status;
	private File targetDirectory;
	private BoundingBox requestedBounds;
	private String epsgCode;
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
	
	public String getLayerNameNS(){
		return this.layerInfo.getWorkspaceName() + ":" + this.layerInfo.getName();
	}

	public String getWmsUrl(){
		return ParseJSONSolrLocationField.getWmsUrl(this.layerInfo.getLocation());
	}
	
	public String getWfsUrl(){
		return ParseJSONSolrLocationField.getWfsUrl(this.layerInfo.getLocation());
	}
	
	public String getWcsUrl(){
		return ParseJSONSolrLocationField.getWcsUrl(this.layerInfo.getLocation());
	}
	
	public String getDownloadUrl(){
		return ParseJSONSolrLocationField.getDownloadUrl(this.layerInfo.getLocation());
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
}
