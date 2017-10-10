package org.opengeoportal.export.geocommons;

public class DataSetStatusOld {
	String id;
	String title;
	String status;
	
	DataSetStatusOld(String id, String title, String status){
		this.id = id;
		this.title = title;
		this.status = status;
	}
	
	public String getId() {
		return id;
	}
	public void setId(String id) {
		this.id = id;
	}
	
	public String getTitle(){
		return this.title;
	}
	
	public void setTitle(String title){
		this.title = title;
	}
	
	public String getStatus() {
		return status;
	}
	public void setStatus(String status) {
		this.status = status;
	}
	
}
