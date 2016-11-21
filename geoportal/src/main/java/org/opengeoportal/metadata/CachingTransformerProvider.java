package org.opengeoportal.metadata;

import java.util.HashMap;
import java.util.Map;

import javax.xml.transform.OutputKeys;
import javax.xml.transform.Source;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerConfigurationException;
import javax.xml.transform.TransformerFactory;

/**
 * @author cbarne02
 *         <p>
 *         Provides and caches Transformers for transforming XML via XSLT. Since
 *         there are only a couple of transforms used and Transformers are
 *         expensive to create, it makes sense to cache them.
 */
public class CachingTransformerProvider {

    TransformerFactory transformerFactory = TransformerFactory.newInstance();
    Map<String, Transformer> transformerCache = new HashMap<String, Transformer>();

    public Transformer getTransformer(Source xslt, String key)
            throws TransformerConfigurationException {
        Transformer transformer = null;
        if (transformerCache.containsKey(key)) {
            transformer = transformerCache.get(key);
            transformer.reset();
            transformer.setOutputProperty(OutputKeys.INDENT, "yes");
            transformer.setOutputProperty("{http://xml.apache.org/xslt}indent-amount", "2");
        } else {
            if (xslt == null) {
                transformer = transformerFactory.newTransformer();
            } else {
                transformer = transformerFactory.newTransformer(xslt);

            }
            transformer.setOutputProperty(OutputKeys.INDENT, "yes");
            transformer.setOutputProperty("{http://xml.apache.org/xslt}indent-amount", "2");

            transformerCache.put(key, transformer);
        }
        return transformer;
    }

    public Transformer getTransformer(String key)
            throws TransformerConfigurationException {
        return getTransformer(null, key);
    }
}
