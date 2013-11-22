package org.opengeoportal.config.proxy;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Properties;
import java.util.Set;

import org.apache.commons.lang.StringUtils;
import org.opengeoportal.config.PropertiesFile;
import org.opengeoportal.utilities.LocationFieldUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ProxyConfigRetrieverFromProperties implements ProxyConfigRetriever {

	PropertiesFile propertiesFile;
	List<ProxyConfig> proxyConfig;

	protected final Logger logger = LoggerFactory.getLogger(this.getClass());

	public PropertiesFile getPropertiesFile() {
		return propertiesFile;
	}

	public void setPropertiesFile(PropertiesFile propertiesFile) {
		this.propertiesFile = propertiesFile;
	}

	@Override
	public List<ProxyConfig> getConfig(){
		return proxyConfig;
	}
	
	@Override
	public List<ProxyConfig> load() throws IOException {
		Properties props = propertiesFile.getProperties();
		proxyConfig = new ArrayList<ProxyConfig>();

		//populate a List of ProxyConfig objects

		Set<Object> keys = props.keySet();
		for (Object key: keys){
			String key$ = (String)key;
			if (key$.startsWith("proxy.")){
				//do something
				List<String> keyList = Arrays.asList(StringUtils.split(key$, "."));
				String repositoryId = null;
				if (keyList.size() >= 2){
					repositoryId = keyList.get(1);
				} else {
					logger.error("Something is wrong with the property key. ['" + key$ + "']");
					continue;
				}
				
				
				ProxyConfig pc = getProxyConfig(repositoryId);
				
				if (keyList.contains("accessLevel")){
					
					List<String> accessLevels = Arrays.asList(props.getProperty(key$).split(","));
					pc.setAccessLevels(accessLevels);
				} else {
					
					List<String> typeList = new ArrayList<String>();
					Boolean appendServiceEndpoint = false;
					
					if (keyList.contains("geoserver")){
						
						typeList.add("wms");
						typeList.add("wfs");
						typeList.add("wcs");
						appendServiceEndpoint = true;
						
					} else {
						if (keyList.size() >= 3){
							typeList.add(keyList.get(2));
						} else {
							logger.error("Something is wrong with the property key. ['" + key$ + "']");
							continue;
						}
					}
					
					for (String type: typeList){
						
						InternalServerMapping sm = getServerMapping(pc, type);
						
						String val = props.getProperty(key$);
						if (keyList.contains("internal")){
							
							if (appendServiceEndpoint){
								val = val + "/" + type;
							}
							
							sm.setInternalUrl(val);
						} else if (keyList.contains("external")){
							
							if (appendServiceEndpoint){
								val = val + "/" + type;
							}
							
							sm.setExternalUrl(val);
						} else if (keyList.contains("username")){
							
							sm.setUsername(val);
						} else if (keyList.contains("password")){
							
							sm.setPassword(val);
						}
					}
				}
			}
			// else skip it
			
		}
		
		return proxyConfig;
	}

	private ProxyConfig getProxyConfig(String repositoryId) {

		for (ProxyConfig pc: proxyConfig){ 

			if (pc.getRepositoryId().equalsIgnoreCase(repositoryId)){
				return pc;
			}
		}

		ProxyConfig npc =  new ProxyConfig();
		npc.setRepositoryId(repositoryId);
		
		proxyConfig.add(npc);

		return npc;

	}
	
	private InternalServerMapping getServerMapping(ProxyConfig pc, String type) {
		List<ServerMapping> smList = pc.getServerMapping();
		for (ServerMapping sm: smList){
			if (sm.getType().equalsIgnoreCase(type)){
				return (InternalServerMapping) sm;
			} 
		}
		
		InternalServerMapping nsm =  new InternalServerMapping();
		nsm.setType(type);
		smList.add(nsm); 
		return nsm;

	}

	@Override
	public String getUrl(String type, String repository, String accessLevel, String locationField) throws Exception{
		if (hasProxy(type, repository, accessLevel)){
			return getInternalProxy(type, repository, accessLevel);
		} else {
			return LocationFieldUtils.getUrl(type, locationField);
		}
	}
	
	@Override
	public String getExternalProxy(String type, String repository, String accessLevel)
			throws Exception {
		ServerMapping sm = getMatchingServerMapping(type, repository, accessLevel);
		return sm.getExternalUrl();
	}
	


	@Override
	public boolean hasProxy(String type, String repository, String accessLevel){
		for (ProxyConfig pc: proxyConfig){
			if (pc.getRepositoryId().equalsIgnoreCase(repository)){
				if (pc.getAccessLevels().contains(accessLevel)){
					for (ServerMapping sm: pc.getServerMapping()){
						if (sm.getType().equalsIgnoreCase("type")){
							return true;
						}
					}
				}
			}
		}

		return false;
	}

	private ServerMapping getMatchingServerMapping(String type, String repository, String accessLevel) throws Exception{
		for (ProxyConfig pc: proxyConfig){
			if (pc.getRepositoryId().equalsIgnoreCase(repository)){
				if (pc.getAccessLevels().contains(accessLevel)){
					for (ServerMapping sm: pc.getServerMapping()){
						if (sm.getType().equalsIgnoreCase("type")){
							return sm;
						}
					}
				}
			}
		}
		
		throw new Exception("Server Mapping not found.");
	}
		
	
	@Override
	public String getInternalProxy(String type, String repository, String accessLevel) throws Exception {
		InternalServerMapping sm = (InternalServerMapping) getMatchingServerMapping(type, repository, accessLevel);
		return sm.getInternalUrl();
	}

	@Override
	public boolean hasCredentials(String type, String repository, String accessLevel) {
		InternalServerMapping sm = null;
		try {
			sm = (InternalServerMapping) getMatchingServerMapping(type, repository, accessLevel);
		} catch (Exception e){
			return false;
		}
		
		if ( StringUtils.isNotEmpty(sm.getUsername()) && StringUtils.isNotEmpty(sm.getPassword()) ){
			return true;
		} else {
			return false;
		}
	}
	
	@Override
	public List<ProxyConfig> getPublicConfig() {
		//must only serve a reduced version...we don't want to hand out internal addresses, credentials to the client
		
		//copy the object
		List<ProxyConfig> pcList = getConfig();
		List<ProxyConfig> publicPcList = new ArrayList<ProxyConfig>();
		
		for (ProxyConfig pc: pcList){
			ProxyConfig publicPc = new ProxyConfig();
			publicPcList.add(publicPc);
			
			publicPc.setAccessLevels(pc.getAccessLevels());
			publicPc.setRepositoryId(pc.repositoryId);
			
			List<ServerMapping> smList = pc.getServerMapping();
			List<ServerMapping> psmList = new ArrayList<ServerMapping>();
			for (ServerMapping sm: smList){
				PublicServerMapping psm = new PublicServerMapping();
				psm.setType(sm.getType());
				psm.setExternalUrl(sm.getExternalUrl());
				psmList.add(psm);
			}
			
			publicPc.setServerMapping(psmList);
		}
		
		return publicPcList;
	}

}
