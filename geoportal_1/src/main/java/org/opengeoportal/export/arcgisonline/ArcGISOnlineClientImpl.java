package org.opengeoportal.export.arcgisonline;

import org.apache.http.impl.client.CloseableHttpClient;
import org.opengeoportal.download.MetadataRetriever;
import org.opengeoportal.layer.BoundingBox;
import org.opengeoportal.metadata.LayerInfoRetriever;
import org.opengeoportal.solr.SolrRecord;
import org.opengeoportal.utilities.QuickDownload;
import org.opengeoportal.utilities.http.OgpHttpClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.io.File;
import java.net.URL;
import java.util.*;


/**
 * Created by cbarne02 on 6/29/15.
 */
public class ArcGISOnlineClientImpl {

    private ArcGISOnlineToken arcGISOnlineToken = null;

    private RestTemplate restTemplate;
    private String serverName = "http://www.arcgis.com";

    @Autowired
    private LayerInfoRetriever layerInfoRetriever;

    @Autowired
    private MetadataRetriever metadataRetriever;

    @Autowired
    private QuickDownload quickDownload;

    @Autowired
    @Qualifier("httpClient.pooling")
    OgpHttpClient ogpHttpClient;


    final Logger logger = LoggerFactory.getLogger(ArcGISOnlineClientImpl.class);
    private String username;

    public RestTemplate getRestTemplate() {

        CloseableHttpClient httpclient = ogpHttpClient.getCloseableHttpClient();
        HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory(httpclient);

        return new RestTemplate(factory);

    }

    public boolean requestToken(URL endpoint, String username, String password, String referer) {
        this.username = username;
        TokenRequest tokenRequest = new TokenRequest(username, password, referer);

        try {
            arcGISOnlineToken = getRestTemplate().postForObject(endpoint.toString(), tokenRequest, ArcGISOnlineToken.class);

            return true;

        } catch (HttpClientErrorException e) {
            //{"error": "an unknown error occurred"}
            return false;
        }
    }

    public boolean tokenIsValid() {
        if (arcGISOnlineToken == null) {
            return false;
        } else return arcGISOnlineToken.getExpiry().before(new Date());
    }

    /**
     * query current items in the user's content to avoid duplicates
     *
     * @return
     */
    public List<Content.Item> getItems() throws Exception {
        //http://www.arcgis.con/sharing/rest/content/users/<username>?f=json
        final String uri = "http://www.arcgis.con/sharing/rest/content/users/{username}?f=json";

        Map<String, String> params = new HashMap<String, String>();
        params.put("username", username);

        if (tokenIsValid()) {

            Content content = getRestTemplate().getForObject(uri, Content.class, params);

            return content.getItems();

        }
        //TODO: get new token
        throw new Exception("Invalid Token");

    }

    public File getShapefile(String layerId) throws Exception {
        return this.quickDownload.downloadZipFile(layerId, new BoundingBox("-180.0", "-90.0", "180.0", "90.0"));
    }

    //POST http://www.arcgis.con/sharing/rest/content/users/<username>/<folder-id>/addItem?f=json

    public UploadRequest createUploadRequest(String layerId) throws Exception {
        UploadRequest uploadRequest = new UploadRequest();
        SolrRecord info = layerInfoRetriever.getAllLayerInfo(layerId);
        uploadRequest.setTitle(info.getLayerDisplayName());
        uploadRequest.setDescription(info.getDescription());
        uploadRequest.setType("Shapefile");
        uploadRequest.setExtent(info.getMinX() + ", " + info.getMinY() + ", " + info.getMaxX() + ", " + info.getMaxY());
        uploadRequest.setTags(info.getThemeKeywords().replace(" ", ", "));
        uploadRequest.setData(getShapefile(layerId));
        return uploadRequest;
    }

    public ItemStatus addItem(String layerId) throws Exception {
        final String uri = "http://www.arcgis.con/sharing/rest/content/users/{username}/addItem?f=json";
        Map<String, String> params = new HashMap<String, String>();
        params.put("username", username);

        UploadRequest uploadRequest = createUploadRequest(layerId);

        try {

            return getRestTemplate().postForObject(uri, uploadRequest, ItemStatus.class, params);


        } catch (HttpClientErrorException e) {
            //{"error": "an unknown error occurred"}
            logger.error(e.getMessage());
            logger.error(e.getStatusText());
            throw new Exception(e.getMessage());
        }
    }

    public void addFeatureService(ItemStatus itemStatus) {
        ///content/users/<userName>/createService
/*        http://www.arcgis.com/sharing/rest/content/users/jsmith/publish
        itemId=345313e619df46f387f9ededbe15ac56
                filetype=shapefile
        publishParameters={"name":"Streets Service"}*/
        /*
        http://www.arcgis.com/sharing/rest/content/users/jsmith/publish
itemId=345313e619df46f387f9ededbe15ac56
filetype=shapefile
publishParameters={"name":"Streets Service"}

The job ID of the publishing process. All publishing operations are executed asynchronously. The caller is supposed to hold on to the job ID and check for job status of the job. The status can be checked using Status passing in jobType as a query parameter, e.g.jobType=publish .
         */
    }
}
