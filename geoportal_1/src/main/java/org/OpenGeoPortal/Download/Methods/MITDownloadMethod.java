package org.OpenGeoPortal.Download.Methods;

import java.util.HashSet;
import java.util.Set;

import org.OpenGeoPortal.Download.Types.BoundingBox;

public class MITDownloadMethod extends AbstractDownloadMethod implements PerLayerDownloadMethod {	
	private static final Boolean INCLUDES_METADATA = true;
	private static final String METHOD = "GET";
	
	@Override
	public Boolean includesMetadata() {
		return INCLUDES_METADATA;
	}

	@Override
	public String getMethod(){
		return METHOD;
	}
	
	@Override
	public Set<String> getExpectedContentType(){
		Set<String> expectedContentType = new HashSet<String>();
		expectedContentType.add("application/zip");
		return expectedContentType;
	}
	
	private String getDataType() {
		String geometry = this.currentLayer.getLayerInfo().getDataType();
		if (geometry.equals("line")){
			geometry = "arc";
		}
		return geometry;
	}
	
	private String getLayerName() {
		String layerName = this.currentLayer.getLayerInfo().getName();
		layerName = layerName.substring(layerName.indexOf(":") + 1);
		//temporary?  name is wrong in solr index
		layerName = layerName.toUpperCase();
		if (layerName.indexOf("SDE_DATA") < 0){
			layerName = "SDE_DATA." + layerName;
		}
		return layerName;
	}
	
	@Override
	public String createDownloadRequest() throws Exception {
		BoundingBox bounds = this.getClipBounds();
		String layerName = getLayerName();
		String geometry = getDataType();
		
		String getFeatureRequest = "layer=" + layerName + "&bbox=" + bounds.toString() + "&geom=" + geometry;
		return getFeatureRequest;
	}

	@Override
	public String getUrl() {
		return this.currentLayer.getDownloadUrl();
	}
}
