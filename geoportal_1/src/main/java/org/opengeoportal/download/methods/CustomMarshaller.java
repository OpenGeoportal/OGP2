package org.opengeoportal.download.methods;

import javax.xml.parsers.ParserConfigurationException;
import javax.xml.parsers.SAXParserFactory;
import javax.xml.transform.Source;
import javax.xml.transform.sax.SAXSource;

import org.springframework.oxm.jaxb.Jaxb2Marshaller;
import org.xml.sax.SAXException;
import org.xml.sax.SAXNotRecognizedException;
import org.xml.sax.SAXNotSupportedException;
import org.xml.sax.XMLReader;

public class CustomMarshaller extends Jaxb2Marshaller {

	
	/*XMLReader reader = SAXParserFactory.newInstance().newSAXParser().getXMLReader();

	//System.setProperty( "javax.xml.parsers.SAXParserFactory", "org.apache.xerces.jaxp.SAXParserFactoryImpl" );

	reader.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
	reader.setFeature("http://xml.org/sax/features/validation", false);

	SAXSource source = new SAXSource(reader, new InputSource(is));
	JAXBElement element = u.unmarshal(source, MyElement.class);*/
	
	@Override
	public Object unmarshal(Source source){		
		XMLReader reader = null;
		try {
			reader = SAXParserFactory.newInstance().newSAXParser().getXMLReader();
		} catch (SAXException e1) {
			// TODO Auto-generated catch block
			e1.printStackTrace();
		} catch (ParserConfigurationException e1) {
			// TODO Auto-generated catch block
			e1.printStackTrace();
		}
		// saxSource.getXMLReader();
		
		try {
			reader.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
			reader.setFeature("http://xml.org/sax/features/validation", false);
		} catch (SAXNotRecognizedException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (SAXNotSupportedException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		logger.info("trying to parse with custom parser");

		SAXSource ssource = new SAXSource(reader, SAXSource.sourceToInputSource(source));
		return super.unmarshal(ssource);
	}
}
