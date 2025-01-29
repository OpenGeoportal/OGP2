package org.opengeoportal.metadata;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import javax.xml.transform.*;
import javax.xml.transform.stream.StreamSource;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * @author cbarne02
 *         <p>
 *         Provides and caches Transformers for transforming XML via XSLT. Since
 *         there are only a couple of transforms used and Transformers are
 *         expensive to create, it makes sense to cache them.
 */
@Component
public class CachingTransformerProvider {
    final Logger logger = LoggerFactory.getLogger(CachingTransformerProvider.class);

    TransformerFactory transformerFactory = TransformerFactory.newInstance();
    Map<String, Transformer> transformerCache = new HashMap<String, Transformer>();

    public Transformer getTransformer(Resource stylesheetResource, String key)
            throws TransformerConfigurationException, IOException {
        if (!transformerCache.containsKey(key)){
            createTransformer(key, stylesheetResource);
        }
        return transformerCache.get(key);
    }

    public Transformer getIdentityTransformer(String key)
            throws TransformerConfigurationException, IOException {
        if (!transformerCache.containsKey(key)){
            createIdentityTransformer(key);
        }
        return transformerCache.get(key);
    }

    private Transformer getCached(String key){
        Transformer transformer = null;
        if (transformerCache.containsKey(key)) {
            transformer = transformerCache.get(key);
            transformer.reset();
            transformer.setOutputProperty(OutputKeys.INDENT, "yes");
            transformer.setOutputProperty("{http://xml.apache.org/xslt}indent-amount", "2");
        }
        return transformer;
    }

    private void createTransformer(String key, Resource xsltResource) throws IOException, TransformerConfigurationException {
        Source xslt = new StreamSource(xsltResource.getInputStream());
        transformerFactory.setURIResolver(new URIResolver() {
            @Override
            public Source resolve(String href, String base) throws TransformerException {
                logger.debug(href);
                logger.debug(base);
                try {
                    logger.debug(String.valueOf(xsltResource.getURI()));
                    logger.debug(String.valueOf(xsltResource.getURL()));
                    logger.debug(String.valueOf(xsltResource.createRelative(href)));
                } catch (IOException e) {
                    e.printStackTrace();
                }
                try {
                    return new StreamSource(xsltResource.createRelative(href).getInputStream());
                } catch (IOException e) {
                    e.printStackTrace();

                }
                return null;
            }
        });
        Transformer transformer = transformerFactory.newTransformer(xslt);
        transformer.setOutputProperty(OutputKeys.INDENT, "yes");
        transformer.setOutputProperty("{http://xml.apache.org/xslt}indent-amount", "2");

        transformerCache.put(key, transformer);
    }

    private void createIdentityTransformer(String key) throws IOException, TransformerConfigurationException {
        Transformer transformer = transformerFactory.newTransformer();
        transformer.setOutputProperty(OutputKeys.INDENT, "yes");
        transformer.setOutputProperty("{http://xml.apache.org/xslt}indent-amount", "2");

        transformerCache.put(key, transformer);
    }
}
