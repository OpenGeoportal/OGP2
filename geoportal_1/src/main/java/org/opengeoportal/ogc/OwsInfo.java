package org.opengeoportal.ogc;

import java.util.List;
import java.util.Map;


public class OwsInfo {
	public enum OwsType {
		DATA,
		DISPLAY;
		
		public static OwsType parseOwsType(String type){
			if (type.trim().equalsIgnoreCase("data")){
				return DATA;
			} else {
				return DISPLAY;
			}
		}
	}
	
	public enum OwsProtocol {
		WMS(OwsType.DISPLAY),
		WFS(OwsType.DATA),
		WCS(OwsType.DATA);
		
		final OwsType type;
		OwsProtocol(OwsType type){
			this.type = type;
		}
		public static OwsProtocol parseOwsProtocol(String protocol) throws Exception{
			if (protocol.trim().equalsIgnoreCase("wms")){
				return WMS;
			} else if (protocol.trim().equalsIgnoreCase("wfs")){
				return WFS;
			} else if (protocol.trim().equalsIgnoreCase("wcs")){
				return WCS;
			} else {
				throw new Exception("Unrecognized Protocol: " + protocol);
			}
		}
	}
	
	OwsProtocol owsProtocol;
	Map<String,String> infoMap;
	OwsDescribeInfo owsDescribeInfo;
	
	public OwsProtocol getOwsProtocol() {
		return owsProtocol;
	}
	public void setOwsProtocol(OwsProtocol owsProtocol) {
		this.owsProtocol = owsProtocol;
	}
	
	public Map<String, String> getInfoMap() {
		return infoMap;
	}
	public void setInfoMap(Map<String, String> infoMap) {
		this.infoMap = infoMap;
	}
	
	public static OwsInfo findWmsInfo(List<OwsInfo> info) throws Exception{
		for (OwsInfo infoBit: info){
			if (infoBit.getOwsProtocol().equals(OwsProtocol.WMS)){
				return infoBit;
			}
		}
		throw new Exception("No WMS Info found!");
	}
	
	public static OwsInfo findWfsInfo(List<OwsInfo> info) throws Exception{
		for (OwsInfo infoBit: info){
			if (infoBit.getOwsProtocol().equals(OwsProtocol.WFS)){
				return infoBit;
			}
		}
		throw new Exception("No WFS Info found!");
	}
	
	public static OwsInfo findWcsInfo(List<OwsInfo> info) throws Exception{
		for (OwsInfo infoBit: info){
			if (infoBit.getOwsProtocol().equals(OwsProtocol.WCS)){
				return infoBit;
			}
		}
		throw new Exception("No WCS Info found!");
	}
	public OwsDescribeInfo getOwsDescribeInfo() {
		return owsDescribeInfo;
	}
	public void setOwsDescribeInfo(OwsDescribeInfo owsDescribeInfo) {
		this.owsDescribeInfo = owsDescribeInfo;
	}

}
