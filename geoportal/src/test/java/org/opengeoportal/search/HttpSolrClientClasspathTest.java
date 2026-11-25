package org.opengeoportal.search;

import org.apache.solr.client.solrj.SolrClient;
import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.SolrServerException;
import org.apache.solr.client.solrj.impl.HttpSolrClient;
import org.junit.jupiter.api.Test;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * solrj's Jetty-based HTTP/2 client is excluded in the POM because SearchClientImpl only uses
 * HttpSolrClient (Apache HttpClient). This checks that a query still runs without Jetty on the
 * classpath: it must fail with a connection error, not a NoClassDefFoundError.
 */
class HttpSolrClientClasspathTest {

    @Test
    void queryWithoutJettyFailsOnlyOnConnection() throws IOException {
        // port 1 is unassigned, so the connection is refused
        try (SolrClient client = new HttpSolrClient.Builder("http://127.0.0.1:1/solr/ogp")
                .withConnectionTimeout(1000)
                .withSocketTimeout(1000)
                .build()) {
            assertThatThrownBy(() -> client.query(new SolrQuery("*:*")))
                    .isInstanceOfAny(SolrServerException.class, IOException.class);
        }
    }
}
