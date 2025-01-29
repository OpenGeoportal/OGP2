package org.opengeoportal.ogc;

import org.opengeoportal.search.OGPRecord;

import java.util.ArrayList;
import java.util.List;

public class AugmentedSolrRecord {
	List<OwsInfo> owsInfo = new ArrayList<OwsInfo>();
	OGPRecord ogpRecord;
	
	public List<OwsInfo> getOwsInfo() {
		return owsInfo;
	}
	public void setOwsInfo(List<OwsInfo> owsInfo) {
		this.owsInfo = owsInfo;
	}
	public OGPRecord getOgpRecord() {
		return ogpRecord;
	}
	public void setOgpRecord(OGPRecord ogpRecord) {
		this.ogpRecord = ogpRecord;
	}

}
