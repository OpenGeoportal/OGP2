package org.OpenGeoPortal.Download.Controllers;

import org.OpenGeoPortal.Download.Types.LayerRequest.Status;
import org.OpenGeoPortal.Layer.BoundingBox;

public class RequestedLayerStatus {
	private Status status;
	private String id;
	private String bounds;
	private String name;
	
	public Status getStatus() {
		return status;
	}
	public void setStatus(Status status) {
		this.status = status;
	}
	public String getId() {
		return id;
	}
	public void setId(String id) {
		this.id = id;
	}
	public String getBounds() {
		return bounds;
	}
	public void setBounds(BoundingBox bounds) {
		this.bounds = bounds.toStringLatLon();
	}	
	public void setBounds(String bounds) {
		this.bounds = bounds;
	}
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	


}
