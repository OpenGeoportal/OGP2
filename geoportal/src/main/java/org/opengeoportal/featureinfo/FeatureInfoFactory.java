package org.opengeoportal.featureinfo;

import org.opengeoportal.search.OGPRecord;
import org.opengeoportal.service.SearchService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * @author cbarne02
 *         <p>
 *         A class to create FeatureInfo type objects. We need this since
 *         our controller is of singleton scope and WmsGetFeatureInfo is
 *         prototype scope. Implementing ApplicationContextAware allows us
 *         access to the Spring Application Context for the application.
 */
@Component
public class FeatureInfoFactory implements ApplicationContextAware {
    private ApplicationContext applicationContext;
    final Logger logger = LoggerFactory.getLogger(this.getClass());

    final SearchService searchService;

    public FeatureInfoFactory(SearchService searchService) {
        this.searchService = searchService;
    }

    public FeatureInfo getObject(String layerId) throws Exception {
        logger.debug("Creating FeatureInfo bean");
        String[] beans = applicationContext.getBeanNamesForType(FeatureInfo.class);
        logger.debug(Integer.toString(beans.length) + " beans found.");
        for (String key : beans) {
            FeatureInfo bean = applicationContext.getBean(key, FeatureInfo.class);
            bean.setOGPRecord(getOgpRecord(layerId));
            if (bean.hasInfoUrl()) {
                logger.debug("Our bean is type: " + key);
                return bean;
            }
        }

        throw new Exception("No eligible bean found for FeatureInfo");
    }

    /**
     * Get the Solr record given a layerId, if the user has permission
     *
     * @param layerId
     * @return SolrRecord the solr record matching the passed layerId
     * @throws Exception
     */
    protected OGPRecord getOgpRecord(String layerId) throws Exception {
        Set<String> layerIds = new HashSet<String>();
        layerIds.add(layerId);

        List<OGPRecord> allLayerInfo = searchService.findAllowedRecordsById(new ArrayList<>(layerIds));

        if (allLayerInfo.isEmpty()) {
            throw new Exception("No allowed records returned for Layer Id: ['"
                    + layerId + "'");
        }

        OGPRecord layerInfo = allLayerInfo.get(0);
        return layerInfo;
    }

    public Class<FeatureInfo> getObjectType() {
        return FeatureInfo.class;
    }

    public boolean isSingleton() {
        return false;
    }

    @Override
    public void setApplicationContext(ApplicationContext appContext)
            throws BeansException {
        applicationContext = appContext;

    }

}
