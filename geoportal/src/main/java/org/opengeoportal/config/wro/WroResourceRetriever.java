package org.opengeoportal.config.wro;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import ro.isdc.wro.http.ConfigurableWroFilter;
import ro.isdc.wro.model.WroModel;
import ro.isdc.wro.model.group.Group;
import ro.isdc.wro.model.resource.Resource;
import ro.isdc.wro.model.resource.ResourceType;
import ro.isdc.wro.model.resource.processor.impl.css.CssUrlRewritingProcessor;


public class WroResourceRetriever {
    @Autowired
    private ConfigurableWroFilter configurableWroFilter;

    protected final Logger logger = LoggerFactory.getLogger(this.getClass());

    private Set<WroConfig> wro = null;

    public void load() {
        wro = new HashSet<>();

        WroModel model = configurableWroFilter.getWroManagerFactory().create().getModelFactory().create();
        for (Group grp : model.getGroups()) {

            WroConfig group = new WroConfig();
            wro.add(group);
            group.setName(grp.getName());

            List<String> cssList = new ArrayList<>();
            group.setCss(cssList);
            List<String> jsList = new ArrayList<>();
            group.setJs(jsList);

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


    }

    public Set<WroConfig> getWroConfigSets() {
        if (wro == null) {
            load();
        }
        return wro;
    }

    private static boolean hasWildCards(String url) {
        return url.contains("*");
    }

}
