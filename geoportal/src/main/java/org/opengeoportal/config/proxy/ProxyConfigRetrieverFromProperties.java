package org.opengeoportal.config.proxy;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.core.JsonParseException;
import org.opengeoportal.config.exception.ConfigException;
import org.opengeoportal.utilities.LocationFieldUtils;
import org.opengeoportal.utilities.OgpUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;

@Component
public class ProxyConfigRetrieverFromProperties implements ProxyConfigRetriever {

	List<ProxyConfig> proxyConfig;

	@Value("${proxy.access-level}")
	List<String> accessLevel;

	@Value("${proxy.geoserver.internal:}")
	private String geoserverInternal;

	@Value("${proxy.geoserver.external:}")
	private String geoserverExternal;

	@Value("${proxy.geoserver.username:}")
	private String geoserverUserName;

	@Value("${proxy.geoserver.password:}")
	private String geoserverPassword;

	@Value("${proxy.institution:}")
	private String proxyInstitution;

	protected final Logger logger = LoggerFactory.getLogger(this.getClass());

	@Override
	public List<ProxyConfig> getConfig(){
		return proxyConfig;
	}
	
	@Override
	@PostConstruct
	public List<ProxyConfig> load() throws IOException {
		proxyConfig = new ArrayList<ProxyConfig>();

		//populate a List of ProxyConfig objects
		//This should throw an error if LOGIN_REPOSITORY is not set properly
		String repositoryId = "";
		if (!proxyInstitution.isBlank()){
			repositoryId = proxyInstitution.trim();
		} else {
			throw new IOException("Must set a value for Login Repository!");
		}

		ProxyConfig pc = getProxyConfig(repositoryId);

		boolean valid = false;
		pc.setAccessLevels(accessLevel);

		List<String> typeList = new ArrayList<String>();
		typeList.add("wms");
		typeList.add("wfs");
		typeList.add("wcs");

		for (String type: typeList){

			InternalServerMapping sm = getServerMapping(pc, type);
			sm.setInternalUrl(geoserverInternal + "/" + type);
			sm.setExternalUrl(geoserverExternal + "/" + repositoryId + "/" + type);
			sm.setUsername(geoserverUserName);
			sm.setPassword(geoserverPassword);
		}

		// todo: decide whether to append this based on values in config. maybe if accesslevel is empty, etc.
		if (valid) {
			proxyConfig.add(pc);
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
	public String getInternalUrl(String type, String repository, String accessLevel, String locationField) throws ConfigException, JsonParseException {
		String url = null;
		if (hasProxy(type, repository, accessLevel)){
			url =  getInternalProxyUrl(type, repository, accessLevel);
		} else {
			url = LocationFieldUtils.getUrl(type, locationField);
		}

		return url;
	}
	
	@Override
	public String getExternalUrl(String type, String repository, String accessLevel, String locationField) throws Exception, ConfigException {
	    String url = null;
	    Boolean hasProxy = hasProxy(type, repository, accessLevel);
	    if (hasProxy){
		    url = getExternalProxyUrl(type, repository, accessLevel);
	    } else {
		    url = LocationFieldUtils.getUrl(type, locationField);

	    }
	    return url;
	}
	@Override
	public String getExternalProxyUrl(String type, String repository, String accessLevel)
			throws ConfigException {
		ServerMapping sm = getMatchingServerMapping(type, repository, accessLevel);
		return sm.getExternalUrl();
	}
	


	@Override
	public boolean hasProxy(String type, String repository, String accessLevel){
		for (ProxyConfig pc: proxyConfig){
			if (pc.getRepositoryId().equalsIgnoreCase(repository)){
				if (OgpUtils.containsIgnoreCase(pc.getAccessLevels(), accessLevel)){
					for (ServerMapping sm: pc.getServerMapping()){
						if (sm.getType().equalsIgnoreCase(type)){
							return true;
						}
					}
				}
			}
		}

		return false;
	}

	private ServerMapping getMatchingServerMapping(String type, String repository, String accessLevel) throws ConfigException{
		for (ProxyConfig pc: proxyConfig){
			if (pc.getRepositoryId().equalsIgnoreCase(repository)){
				if (OgpUtils.containsIgnoreCase(pc.getAccessLevels(), accessLevel)){
					for (ServerMapping sm: pc.getServerMapping()){
						if (sm.getType().equalsIgnoreCase(type)){
							return sm;
						}
					}
				}
			}
		}
		
		throw new ConfigException("Server Mapping not found.");
	}

	@Override
	public InternalServerMapping getInternalServerMapping(String type, String repository, String accessLevel) throws ConfigException {
		return (InternalServerMapping) getMatchingServerMapping(type, repository, accessLevel);
	}
		
	
	@Override
	public String getInternalProxyUrl(String type, String repository, String accessLevel) throws ConfigException {
		InternalServerMapping sm = getInternalServerMapping(type, repository, accessLevel);
		return sm.getInternalUrl();
	}

	@Override
	public boolean hasCredentials(InternalServerMapping sm) {
		
		if ( !sm.getUsername().isBlank() && !sm.getPassword().isBlank() ){
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
