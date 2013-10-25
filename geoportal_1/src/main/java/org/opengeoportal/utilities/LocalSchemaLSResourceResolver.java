package org.opengeoportal.utilities;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.w3c.dom.DOMImplementation;
import org.w3c.dom.bootstrap.DOMImplementationRegistry;
import org.w3c.dom.ls.DOMImplementationLS;
import org.w3c.dom.ls.LSInput;
import org.w3c.dom.ls.LSResourceResolver;

public class LocalSchemaLSResourceResolver implements LSResourceResolver {
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	private Resource resource;

	public Resource getResource() {
		return resource;
	}

	public void setResource(Resource resource) {
		this.resource = resource;
	}

	@Override
	public LSInput resolveResource(String type, String namespaceURI, String publicId, String systemId, String baseURI) {
        DOMImplementationRegistry registry = null;
        logger.info("resolve resource");
        try {
            registry = DOMImplementationRegistry.newInstance();
        } catch (ClassNotFoundException ex) {
        } catch (InstantiationException ex) {
        } catch (IllegalAccessException ex) {
        } catch (ClassCastException ex) {
        }
        
        try { 
        	DOMImplementation impl2 = registry.getDOMImplementation("XML 1.0 LS 3.0");
            DOMImplementationLS domImplLS = (DOMImplementationLS) impl2;
            LSInput lsInput = domImplLS.createLSInput();
            lsInput.setByteStream(resource.getInputStream());
            return lsInput;
        } catch (IOException e) {
			e.printStackTrace();
            return null;
		}

    }

}
