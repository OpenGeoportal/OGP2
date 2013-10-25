package org.opengeoportal.ogc.wcs;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.opengeoportal.layer.BoundingBox;

public class WcsGetCoverage1_1_1 {
	
	public static String getMethod(){
		return "POST";
	}
	
	public static String createWcsGetCoverageRequest(String layerName, Map<String,String> describeCoverageMap, BoundingBox bounds, int epsgCode, String outputFormat) throws Exception {
		
		//--generate POST message
		String getCoverageRequest = "<wcs:GetCoverage version=\"1.1.1\" service=\"WCS\" " +
				"xmlns:wcs=\"http://www.opengis.net/wcs/1.1.1\" " + 
				"xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" " +
				"xmlns=\"http://www.opengis.net/wcs/1.1.1\" " +
				"xmlns:ows=\"http://www.opengis.net/ows/1.1\" " +
				"xmlns:gml=\"http://www.opengis.net/gml\" " +
				"xmlns:ogc=\"http://www.opengis.net/ogc\" " +
				"xsi:schemaLocation=\"http://www.opengis.net/wcs/1.1.1 http://schemas.opengis.net/wcs/1.1.1/wcsAll.xsd\">" +
				"<ows:Identifier>" + layerName + "</ows:Identifier>" +
				"<wcs:DomainSubset>" +
				bounds.generateOWSBoundingBox() +
				"</wcs:DomainSubset>" +
				"<wcs:Output store=\"true\" format=\"" + outputFormat + "\">" +
				generateGridCRS(describeCoverageMap) +
				"</wcs:Output>" +
			"</wcs:GetCoverage>";
		 
		
    	return getCoverageRequest;
	}
	
	
	
	private static String generateGridCRS(Map<String,String> describeCoverageMap){
		//should check which are required elements
		List<String> gridtagList = new ArrayList<String>();
		gridtagList.add("GridBaseCRS");
		gridtagList.add("GridType");
		gridtagList.add("GridOffsets");
		gridtagList.add("GridCS");

		String gridCRS = "<wcs:GridCRS>";
		for (String gridtag: gridtagList){
			for (String key :describeCoverageMap.keySet()){
				if (key.toLowerCase().contains(gridtag.toLowerCase())){
					gridCRS += "<wcs:" + gridtag + ">";
					gridCRS += describeCoverageMap.get(key).trim();
					gridCRS += "</wcs:" + gridtag + ">";
				}
			}
		}

		gridCRS += "</wcs:GridCRS>";
		
		return gridCRS;
	}

}
