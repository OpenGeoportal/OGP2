package org.opengeoportal.ogc;

import java.util.ArrayList;
import java.util.List;

import org.opengeoportal.solr.SolrRecord;

public class AugmentedSolrRecord {
	List<OwsInfo> owsInfo = new ArrayList<OwsInfo>();
	SolrRecord solrRecord;
	
	public List<OwsInfo> getOwsInfo() {
		return owsInfo;
	}
	public void setOwsInfo(List<OwsInfo> owsInfo) {
		this.owsInfo = owsInfo;
	}
	public SolrRecord getSolrRecord() {
		return solrRecord;
	}
	public void setSolrRecord(SolrRecord solrRecord) {
		this.solrRecord = solrRecord;
	}

}
