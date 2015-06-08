package org.opengeoportal.metadata;


import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.xml.sax.SAXException;

import java.io.IOException;

/**
 * Created by cbarne02 on 6/5/15.
 * <p/>
 * Provide a concrete MetadataParser instance for the given metadata type.
 * Right now, we're providing only FGDC, so it doesn't make much sense, but it will be easier to add
 * parsers for different metadata types.
 */
public class MetadataParserFactory implements ApplicationContextAware {

    private ApplicationContext context;

    public MetadataParser getMetadataParser(String string) throws IOException, SAXException {
        FgdcMetadataParser metadataParser = context.getBean(FgdcMetadataParser.class);
        metadataParser.parse(string);
        return metadataParser;
    }

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        this.context = applicationContext;
    }
}
