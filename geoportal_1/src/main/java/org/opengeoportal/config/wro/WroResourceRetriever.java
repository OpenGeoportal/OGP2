package org.opengeoportal.config.wro;

import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import ro.isdc.wro.http.ConfigurableWroFilter;
import ro.isdc.wro.model.WroModel;
import ro.isdc.wro.model.group.Group;
import ro.isdc.wro.model.resource.Resource;
import ro.isdc.wro.model.resource.ResourceType;


public class WroResourceRetriever {
    @Autowired
    private ConfigurableWroFilter configurableWroFilter;

    protected final Logger logger = LoggerFactory.getLogger(this.getClass());

    private WroConfig wro = null;

    public void load() {
        wro = new WroConfig();

        List<String> cssList = new ArrayList<>();

        List<String> jsList = new ArrayList<>();

        WroModel model = configurableWroFilter.getWroManagerFactory().create().getModelFactory().create();
        for (Group grp : model.getGroups()) {
            if (!grp.getName().equalsIgnoreCase("ogp")) {
                continue;
            }
            for (Resource resource : grp.getResources()) {
                String uri = resource.getUri();
                if (resource.getType() == ResourceType.CSS) {
                    if (!hasWildCards(uri)) {
                        cssList.add(uri);
                    }
                } else if (resource.getType() == ResourceType.JS) {
                    if (!hasWildCards(uri)) {
                        jsList.add(uri);
                    }
                }

            }
        }

        wro.setCss(cssList);
        wro.setJs(jsList);

    }

    public WroConfig getWroConfig() {
        if (wro == null) {
            load();
        }
        return wro;
    }

    private static boolean hasWildCards(String url) {
        return url.contains("*");
    }

}
