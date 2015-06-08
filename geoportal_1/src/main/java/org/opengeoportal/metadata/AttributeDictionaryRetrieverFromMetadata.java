package org.opengeoportal.metadata;

import org.opengeoportal.solr.SolrRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.xml.sax.SAXException;

import javax.xml.xpath.XPathExpressionException;
import java.io.IOException;
import java.util.*;


/**
 * Extracts attribute labels and definitions from a metadata document
 */
public class AttributeDictionaryRetrieverFromMetadata implements AttributeDictionaryRetriever {

    @Autowired
    protected LayerInfoRetriever layerInfoRetriever;

    @Autowired
    protected MetadataParserFactory metadataParserFactory;

    protected final Logger logger = LoggerFactory.getLogger(AttributeDictionaryRetrieverFromMetadata.class);


    /**
     * Populate the AttributeDictionary
     *
     * @param layerId
     * @return
     * @throws Exception
     */
    public AttributeDictionary getAttributeDictionary(String layerId) throws Exception {
        SolrRecord solrRecord = getSolrRecord(layerId);
        AttributeDictionary attributeDictionary = new AttributeDictionary();
        attributeDictionary.setLayerId(solrRecord.getLayerId());
        attributeDictionary.setTitle(solrRecord.getLayerDisplayName());

        String metadata = solrRecord.getFgdcText();
        if (!metadata.isEmpty()) {
            attributeDictionary.setAttributeTable(getAttributeMetadata(metadata));
        }

        return attributeDictionary;
    }

    /**
     * Get the Solr record given a layerId, if the user has permission
     *
     * @param layerId
     * @return SolrRecord the solr record matching the passed layerId
     * @throws Exception
     */
    protected SolrRecord getSolrRecord(String layerId) throws Exception {
        Set<String> layerIds = new HashSet<String>();
        layerIds.add(layerId);

        List<SolrRecord> allLayerInfo = this.layerInfoRetriever
                .fetchAllowedRecords(layerIds);

        if (allLayerInfo.isEmpty()) {
            throw new Exception("No allowed records returned for Layer Id: ['"
                    + layerId + "'");
        }

        SolrRecord layerInfo = allLayerInfo.get(0);
        return layerInfo;
    }


    /**
     * Retrieves attribute definitions from XML metadata
     *
     * @param xmlString
     * @return Map<String,String> map of attribute labels and their definitions,
     * if defined in the metadata
     * @throws XPathExpressionException
     * @throws SAXException
     * @throws IOException
     */
    public Map<String, String> getAttributeMetadata(String xmlString)
            throws XPathExpressionException, SAXException, IOException {
        MetadataParser metadataParser = metadataParserFactory.getMetadataParser(xmlString);

        return metadataParser.getAttributeMap();
    }


}
