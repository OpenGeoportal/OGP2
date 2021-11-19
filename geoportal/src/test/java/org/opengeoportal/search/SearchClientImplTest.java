package org.opengeoportal.search;

import org.junit.jupiter.api.Test;
import org.opengeoportal.config.search.SearchConfigRetriever;
import org.opengeoportal.config.search.SearchConfigRetrieverImpl;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.junit.jupiter.api.Assertions.*;

class SearchClientImplTest {

    @Test
    void testCreateLayerIdQueryString() {
        SearchConfigRetriever searchConfigRetriever = new SearchConfigRetrieverImpl();
        SearchClient searchClient = new SearchClientImpl(searchConfigRetriever);
        ArrayList<String> layerIds = Stream.of("Harvard.abc_123", "Tufts.abc123")
                .collect(Collectors.toCollection(ArrayList::new));
        String query = searchClient.createLayerIdQueryString(layerIds);

        // order of layerIds not guaranteed
        assertThat(query).satisfiesAnyOf(
                queryParam -> assertThat(queryParam).isEqualTo("LayerId:Tufts.abc123 OR LayerId:Harvard.abc_123"),
                queryParam -> assertThat(queryParam).isEqualTo("LayerId:Harvard.abc_123 OR LayerId:Tufts.abc123")
        );
    }
}