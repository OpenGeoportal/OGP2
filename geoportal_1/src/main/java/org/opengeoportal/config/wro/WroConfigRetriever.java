package org.opengeoportal.config.wro;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import org.apache.commons.configuration.ConfigurationException;
import org.apache.commons.configuration.XMLConfiguration;
import org.opengeoportal.config.ConfigRetriever;
import org.opengeoportal.config.XmlProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;


public class WroConfigRetriever implements ConfigRetriever {

	@Autowired
	@Qualifier("properties.wro")
	XmlProperties xmlProperties;
	
	List<WroConfig> config = new ArrayList<WroConfig>();

	protected final Logger logger = LoggerFactory.getLogger(this.getClass());
	
	
	@Override
	public List<WroConfig> getConfig() throws IOException {
		if (config.isEmpty()){
			load();
		}
		return config;
	}

	@Override
	public void reload() throws ConfigurationException {
		xmlProperties.reload();
		config.clear();
	}

	@Override
	public void load() throws IOException {
		//we have a list of datatypes to display/search from ogp_config.xml
		WroConfig wro = new WroConfig();
		XMLConfiguration xml = xmlProperties.getConfig();
		
		String[] cssList =  xml.getStringArray("group[@name='ogp']/css");

		String[] jsList =  xml.getStringArray("group[@name='ogp']/js");

		wro.setCss(removeLeadingSlash(cssList));
		wro.setJs(removeLeadingSlash(jsList));

		config.add(wro);
	}
	
	//hacky, but it will do for now
	private static String[] removeLeadingSlash(String[] urls){
		String[] newurls = new String[urls.length];
		for (int i = 0; i < urls.length; i++ ){
			if (urls[i].startsWith("/")){
				newurls[i] = urls[i].replaceFirst("/", "");
			} else {
				newurls[i] = urls[i];
			}
		}
		return newurls;
	}

}
