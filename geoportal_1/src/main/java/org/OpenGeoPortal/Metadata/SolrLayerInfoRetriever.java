package org.OpenGeoPortal.Metadata;

import java.util.List;
import java.util.Set;

import org.OpenGeoPortal.Solr.SearchConfigRetriever;
import org.OpenGeoPortal.Solr.SolrClient;
import org.OpenGeoPortal.Solr.SolrRecord;
import org.OpenGeoPortal.Utilities.ParseJSONSolrLocationField;
import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.SolrServerException;

public class SolrLayerInfoRetriever implements LayerInfoRetriever{
	public SearchConfigRetriever searchConfigRetriever;
	private SolrClient solrClient;

	public void setSolrClient(SolrClient solrClient) {
		this.solrClient = solrClient;
	}

	public void setSearchConfigRetriever(SearchConfigRetriever searchConfigRetriever) throws Exception{
		this.searchConfigRetriever = searchConfigRetriever;
	}
	
	public List<SolrRecord> fetchAllLayerInfo(Set<String> layerIds) throws SolrServerException{
		String query = "";
		for (String layerId : layerIds){
			query += "LayerId:" + layerId.trim();
			query += " OR ";
		}
		if (query.length() > 0){
			query = query.substring(0, query.lastIndexOf(" OR "));
		}
	    SolrQuery queryObj = new SolrQuery();
	    queryObj.setQuery( query );
		List<SolrRecord> results = solrClient.getSolrServer().query(queryObj).getBeans(SolrRecord.class);
		return results;
	}

	@Override
	public String getWMSUrl(SolrRecord solrRecord) {
		String institution = solrRecord.getInstitution();//layerInfo.get("Institution");
		String accessLevel = solrRecord.getAccess();//layerInfo.get("Access");

		String wmsProxyUrl = null;
		try {
			wmsProxyUrl = this.searchConfigRetriever.getWmsProxy(institution, accessLevel);
			//System.out.println("getwmsproxy" + wmsProxyUrl + institution + accessLevel);
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		if (wmsProxyUrl != null){
			return wmsProxyUrl;
		} else {
			return ParseJSONSolrLocationField.getWmsUrl(solrRecord.getLocation());
		}
	}

	@Override
	public boolean hasProxy(SolrRecord layerInfo) {
		String institution = layerInfo.getInstitution();
		String accessLevel = layerInfo.getAccess();

		String wmsProxyUrl = null;
		try {
			wmsProxyUrl = this.searchConfigRetriever.getWmsProxy(institution, accessLevel);
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		if (wmsProxyUrl != null){
			return true;
		} else {
			return false;
		}
	}
	
	@Override
	public SolrRecord getAllLayerInfo(String layerId) throws SolrServerException{
		String query = "LayerId:" + layerId.trim();
	    SolrQuery queryObj = new SolrQuery();
	    queryObj.setQuery( query );
		List<SolrRecord> results = solrClient.getSolrServer().query(queryObj).getBeans(SolrRecord.class);
		return results.get(0);
	}

}
