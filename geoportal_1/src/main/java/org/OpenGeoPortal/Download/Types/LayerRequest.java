package org.OpenGeoPortal.Download.Types;

import java.io.File;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.OpenGeoPortal.Solr.SolrRecord;
import org.OpenGeoPortal.Utilities.ParseJSONSolrLocationField;

public class LayerRequest {
	final String id;
	final SolrRecord layerInfo;
	private String requestedFormat;
	private UUID jobId;
	private String emailAddress = "";
	private LayerStatus status;
	private LayerDisposition disposition;
	private File targetDirectory;
	private BoundingBox requestedBounds;
	private String epsgCode;
	public Set<File> downloadedFiles = new HashSet<File>();
	public String responseMIMEType;
	public Map<String, List<String>> responseHeaders;
	public Boolean metadata;
	private Date timeStamp;

	
	List<Map<String,String>> successMessage = new ArrayList<Map<String,String>>();
	List<Map<String,String>> errorMessage = new ArrayList<Map<String,String>>();
	List<Map<String,String>> warningMessage = new ArrayList<Map<String,String>>();
	
	public LayerRequest(SolrRecord record, String requestedFormat){
		this.id = record.getLayerId()[0];
		this.layerInfo = record;
		this.timeStamp = new Date();

		//probably best to make all values with a limited set of possibilities enums
		this.setRequestedFormat(requestedFormat);
		this.status = LayerStatus.AWAITING_REQUEST;
		this.disposition = LayerDisposition.AWAITING_REQUEST;
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
	
	public void setStatus(LayerStatus status){
		this.status = status;
	}
	
	public LayerStatus getStatus(){
		return this.status;
	}
	
	public String getLayerNameNS(){
		return this.layerInfo.getWorkspaceName() + ":" + this.layerInfo.getName();
	}

	public void setDisposition(LayerDisposition disposition) {
		this.disposition = disposition;
	}
	
	public LayerDisposition getDisposition(){
		return this.disposition;
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
	
	public void addError(String name, String message){
		errorMessage.add(statusMessage(name, message));
	}
	
	public void addSuccess(String name, String message){
		successMessage.add(statusMessage(name, message));
	}
	
	public void addWarning(String name, String message){
		warningMessage.add(statusMessage(name, message));
	}
	
	public List<Map<String,String>> getSuccesses(){
		return successMessage;
	}
	
	public List<Map<String,String>> getWarnings(){
		return warningMessage;
	}
	
	public List<Map<String,String>> getErrors(){
		return errorMessage;
	}
	
	private static Map<String,String> statusMessage(String layerName, String status){
		Map<String, String> statusMap = new HashMap<String, String>();
		statusMap.put("layer", layerName);
		statusMap.put("status", status);
		return statusMap;
	}
}
