package org.opengeoportal.ogc;

import java.io.IOException;
import java.io.OutputStream;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import javax.xml.transform.Result;
import javax.xml.transform.stream.StreamResult;

import org.opengeoportal.metadata.LayerInfoRetriever;
import org.opengeoportal.ogc.OwsInfo.OwsType;
import org.opengeoportal.ogc.wmc.jaxb.BoundingBoxType;
import org.opengeoportal.ogc.wmc.jaxb.GeneralType;
import org.opengeoportal.ogc.wmc.jaxb.LayerListType;
import org.opengeoportal.ogc.wmc.jaxb.LayerType;
import org.opengeoportal.ogc.wmc.jaxb.OnlineResourceType;
import org.opengeoportal.ogc.wmc.jaxb.ServerType;
import org.opengeoportal.ogc.wmc.jaxb.ServiceType;
import org.opengeoportal.ogc.wmc.jaxb.TypeType;
import org.opengeoportal.ogc.wmc.jaxb.ViewContextType;
import org.opengeoportal.solr.SolrRecord;
import org.opengeoportal.utilities.LocationFieldUtils;
import org.opengeoportal.utilities.OgpUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.oxm.Marshaller;
import org.springframework.oxm.XmlMappingException;

/*
 * Given a list of OGP ids, this returns a WMC XML document that can be used by Desktop or web-mapping tools
 * 
 */
/*
 * 
 * <?xml version="1.0" encoding="utf-8" standalone="no" ?>
<ViewContext version="1.1.0"
			    id="eos_data_gateways"
			    xmlns="http://www.opengis.net/context"
			    xmlns:xlink="http://www.w3.org/1999/xlink"
			    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
			    xmlns:sld="http://www.opengis.net/sld"
			    xsi:schemaLocation="http://www.opengis.net/context context.xsd">
	<General>
		<Window width="500" height="300" />
		<BoundingBox SRS="EPSG:4326" minx="-180.000000" miny="-90.000000" maxx="180.000000" maxy="90.000000"/>
		<Title>EOS Data Gateways</Title>
		<KeywordList>
			<Keyword>EOS</Keyword>
			<Keyword>EOSDIS</Keyword>
			<Keyword>NASA</Keyword>
			<Keyword>CCRS</Keyword>
			<Keyword>CEOS</Keyword>
			<Keyword>OGC</Keyword>
		</KeywordList>
		<Abstract>Map View of EOSDIS partners locations</Abstract>
		<LogoURL width="130" height="74" format="image/gif">
			<OnlineResource xlink:type="simple" xlink:href="http://redhook.gsfc.nasa.gov/~imswww/pub/icons/logo.gif"/>
		</LogoURL>
		<DescriptionURL format="text/html">
			<OnlineResource xlink:type="simple" xlink:href="http://eos.nasa.gov/imswelcome"/>
		</DescriptionURL>
		<ContactInformation>
			<ContactPersonPrimary>
				<ContactPerson>Tom Kralidis</ContactPerson>
				<ContactOrganization>Environment Canada</ContactOrganization>
			</ContactPersonPrimary>
			<ContactPosition>Systems Scientist</ContactPosition>
			<ContactAddress>
				<AddressType>postal</AddressType>
				<Address>867 Lakeshore Road</Address>
				<City>Burlington</City>
				<StateOrProvince>Ontario</StateOrProvince>
				<PostCode>L7R 4A6</PostCode>
				<Country>Canada</Country>
			</ContactAddress>
			<ContactVoiceTelephone>+01-905-336-4409</ContactVoiceTelephone>
			<ContactFacsimileTelephone>+01-905-336-4499</ContactFacsimileTelephone>
			<ContactElectronicMailAddress>tom.kralidis@ec.gc.ca</ContactElectronicMailAddress>
		</ContactInformation>
	</General>
	<LayerList>
		<Layer queryable="1" hidden="0">
			<Server service="OGC:WMS" version="1.1.1" title="ESA CubeSERV">
				<OnlineResource xlink:type="simple" xlink:href="http://mapserv2.esrin.esa.it/cubestor/cubeserv/cubeserv.cgi"/>
			</Server>
			<Name>WORLD_MODIS_1KM:MapAdmin</Name>
			<Title>WORLD_MODIS_1KM</Title>
			<Abstract>Global maps derived from various Earth Observation sensors / WORLD_MODIS_1KM:MapAdmin</Abstract>
			<SRS>EPSG:4326</SRS>
			<FormatList>
				<Format current="1">image/png</Format>
				<Format>image/gif</Format>
				<Format>image/jpeg</Format>
			</FormatList>
			<StyleList>
				<Style current="1">
					<Name>default</Name>
					<Title>default</Title>
					<LegendURL width="16" height="16" format="image/gif">
						<OnlineResource xlink:type="simple" xlink:href="http://mapserv2.esrin.esa.it/cubestor/cubeserv/cubeserv.cgi?version=1.1.1&amp;request=GetLegendGraphic&amp;layer=WORLD_MODIS_1KM:MapAdmin&amp;style=default&amp;format=image/gif"/>
					</LegendURL>
				</Style>
			</StyleList>
		</Layer>
		<Layer queryable="0" hidden="0">
			<Server service="OGC:WMS" version="1.1.1" title="The GLOBE Program Visualization Server">
				<OnlineResource xlink:type="simple" xlink:href="http://globe.digitalearth.gov/viz-bin/wmt.cgi"/>
			</Server>
			<Name>COASTLINES</Name>
			<Title>Coastlines</Title>
			<Abstract>Context layer: Coastlines</Abstract>
			<SRS>EPSG:4326</SRS>
			<FormatList>
				<Format current="1">image/gif</Format>
				<Format>image/png</Format>
			</FormatList>
			<StyleList>
				<Style current="1">
					<Name>default</Name>
					<Title>Default</Title>
					<LegendURL width="180" format="image/gif" height="50">
						<OnlineResource xlink:type="simple" xlink:href="http://globe.digitalearth.gov/globe/en/icons/colorbars/COASTLINES.gif"/>
					</LegendURL>
				</Style>
			</StyleList>
		</Layer>
		<Layer queryable="1" hidden="0">
			<Server service="OGC:WMS" version="1.1.1" title="The GLOBE Program Visualization Server">
				<OnlineResource xlink:type="simple" xlink:href="http://globe.digitalearth.gov/viz-bin/wmt.cgi"/>
			</Server>
			<Name>NATIONAL</Name>
			<Title>National Boundaries</Title>
			<Abstract>Context layer: National Boundaries</Abstract>
			<SRS>EPSG:4326</SRS>
			<FormatList>
				<Format current="1">image/gif</Format>
				<Format>image/png</Format>
			</FormatList>
			<StyleList>
				<Style current="1">
					<Name>default</Name>
					<Title>Default</Title>
					<LegendURL width="180" format="image/gif" height="50">
						<OnlineResource xlink:type="simple" xlink:href="http://globe.digitalearth.gov/globe/en/icons/colorbars/NATIONAL.gif"/>
					</LegendURL>
				</Style>
			</StyleList>
		</Layer>
		<Layer queryable="1" hidden="0">
			<Server service="OGC:WMS" version="1.1.1" title="Canada Centre for Remote Sensing Web Map Service">
				<OnlineResource xlink:type="simple" xlink:href="http://ceoware2.ccrs.nrcan.gc.ca/cubewerx/cubeserv/cubeserv.cgi"/>
			</Server>
			<Name>EOS_DATA_GATEWAYS:CEOWARE2</Name> 
			<Title>EOS Data Gateways</Title>
			<Abstract>Locations of EOS Data Gateway Locations. The same services and data are available through each gateway location.</Abstract>
			<sld:MinScaleDenominator>1000</sld:MinScaleDenominator>
			<sld:MaxScaleDenominator>500000</sld:MaxScaleDenominator>
			<SRS>EPSG:4326</SRS>
			<FormatList>
				<Format current="1">image/gif</Format>
				<Format>image/png</Format>
				<Format>image/jpeg</Format>
			</FormatList>
			<StyleList>
				<Style current="1">
					<Name>default</Name>
					<Title>default</Title>
					<LegendURL width="16" height="16" format="image/gif">
						<OnlineResource xlink:type="simple" xlink:href="http://ceoware2.ccrs.nrcan.gc.ca/cubewerx/cubeserv/cubeserv.cgi?version=1.1.1&amp;request=GetLegendGraphic&amp;layer=EOS_DATA_GATEWAYS:CEOWARE2&amp;style=default&amp;format=image/gif"/>
					</LegendURL>
				</Style>
			</StyleList>
		</Layer>
	</LayerList>
</ViewContext>  

 * 
 */
public class WmcCreatorImpl implements WmcCreator {
	@Autowired
	private LayerInfoRetriever layerInfoRetriever;
	
	@Autowired
    private Marshaller marshaller;
	
	public LayerListType getLayerList(Map<String, OwsType> idsAndFormats) throws Exception{
		
		List<SolrRecord> records = layerInfoRetriever.fetchAllLayerInfo(idsAndFormats.keySet());
		LayerListType layerList = new LayerListType();
		for (SolrRecord record: records){
			layerList.getLayer().add(populateLayer(record, idsAndFormats.get(record.getLayerId())));
		}
		return layerList;
	}
	
	public LayerType populateLayer(SolrRecord record, OwsType format) throws Exception{
		/*
		 * 	<xs:complexType name="LayerType">
		<xs:sequence>
			<xs:element name="Server" type="context:ServerType"/>
			<xs:element name="Name" type="xs:string"/>
			<xs:element name="Title" type="xs:string"/>
			<xs:element name="Abstract" type="xs:string" minOccurs="0"/>
			<xs:element name="DataURL" type="context:URLType" minOccurs="0"/>
			<xs:element name="MetadataURL" type="context:URLType" minOccurs="0"/>
			<xs:element ref="sld:MinScaleDenominator" minOccurs="0"/>
			<xs:element ref="sld:MaxScaleDenominator" minOccurs="0"/>
			<xs:element name="SRS" type="xs:string" minOccurs="0" maxOccurs="unbounded"/>
			<xs:element name="FormatList" type="context:FormatListType" minOccurs="0"/>
			<xs:element name="StyleList" type="context:StyleListType" minOccurs="0"/>
			<xs:element name="DimensionList" type="context:DimensionListType" minOccurs="0"/>
			<xs:element name="Extension" type="context:ExtensionType" minOccurs="0"/>
		</xs:sequence>
		<xs:attribute name="queryable" type="xs:boolean" use="required"/>
		<xs:attribute name="hidden" type="xs:boolean" use="required"/>
	</xs:complexType>
		 */
		LayerType layer = new LayerType();
		layer.setHidden(false);
		layer.setQueryable(true);
		

		
		/*
		 * 	<Server service="OGC:WMS" version="1.1.1" title="Canada Centre for Remote Sensing Web Map Service">
				<OnlineResource xlink:type="simple" xlink:href="http://ceoware2.ccrs.nrcan.gc.ca/cubewerx/cubeserv/cubeserv.cgi"/>
			</Server>
		 */
		ServerType server = new ServerType();
		OnlineResourceType olresource = new OnlineResourceType();

		if (format == OwsType.DISPLAY){
			server.setService(ServiceType.OGC_WMS);
			server.setVersion("1.1.1");
			olresource.setType(TypeType.SIMPLE);
			olresource.setHref(LocationFieldUtils.getWmsUrl(record.getLocation()));
			server.setOnlineResource(olresource);
		} else {
			String location = record.getLocation();
			String url = "";
			try {
				url = LocationFieldUtils.getWfsUrl(location);
				server.setService(ServiceType.OGC_WFS);
				server.setVersion("1.1.1");
				olresource.setType(TypeType.SIMPLE);
				olresource.setHref(url);
			} catch (Exception e){
				url = LocationFieldUtils.getWmsUrl(location);
				server.setService(ServiceType.OGC_WMS);
				server.setVersion("1.1.1");
				olresource.setType(TypeType.SIMPLE);
				olresource.setHref(url);
			}

			server.setOnlineResource(olresource);
		}
		
		layer.setServer(server);
		
		server.setTitle(record.getLayerDisplayName());
		String name = OgpUtils.getLayerNameNS(record.getWorkspaceName(), record.getName());
		layer.setName(name);
		layer.setTitle(record.getLayerDisplayName());
		layer.setAbstract(record.getDescription());
				
		return layer;
	}
	
	public GeneralType getGeneralInfo(){
		/*
		 * 	<xs:complexType name="GeneralType">
		<xs:sequence>
			<xs:element name="Window" type="context:WindowType" minOccurs="0"/>
			<xs:element name="BoundingBox" type="context:BoundingBoxType"/>
			<xs:element name="Title" type="xs:string"/>
			<xs:element name="KeywordList" type="context:KeywordListType" minOccurs="0"/>
			<xs:element name="Abstract" type="xs:string" minOccurs="0"/>
			<xs:element name="LogoURL" type="context:URLType" minOccurs="0"/>
			<xs:element name="DescriptionURL" type="context:URLType" minOccurs="0"/>
			<xs:element name="ContactInformation" type="context:ContactInformationType" minOccurs="0"/>
			<xs:element name="Extension" type="context:ExtensionType" minOccurs="0"/>
		</xs:sequence>
	</xs:complexType>
		 */
		GeneralType generalInfo = new GeneralType();
		generalInfo.setTitle("OpenGeoportal Dynamic Web Map Context");
		//generalInfo.setContactInformation(value);
		/*
		 * 		<BoundingBox SRS="EPSG:4326" minx="-180.000000" miny="-90.000000" maxx="180.000000" maxy="90.000000"/>

		 */
		BoundingBoxType bboxType = new BoundingBoxType();
		Double minx = -180.000000;
		Double miny = -90.000000;
		Double maxx = 180.000000;
		Double maxy = 90.000000;
		String srs  = "EPSG:4326";
		
		bboxType.setMinx(new BigDecimal(minx));
		bboxType.setMiny(new BigDecimal(miny));
		bboxType.setMaxx(new BigDecimal(maxx));
		bboxType.setMaxy(new BigDecimal(maxy));
		bboxType.setSRS(srs);
		
		generalInfo.setBoundingBox(bboxType);
		
		return generalInfo;
	}
	
	public ViewContextType createViewContext(Map<String,OwsType> idsAndFormats) throws Exception{
		ViewContextType wmcResponse = new ViewContextType();
		wmcResponse.setGeneral(getGeneralInfo());
		wmcResponse.setLayerList(getLayerList(idsAndFormats));
		wmcResponse.setId(UUID.randomUUID().toString());
		wmcResponse.setVersion("1.1.0");
		return wmcResponse;
	}
	
	@Override
	public Result getWmcResponse(Map<String,OwsType> idsAndFormats, OutputStream os) throws Exception{
		ViewContextType viewContext = createViewContext(idsAndFormats);
		
		Result result = new StreamResult(os);
		try {
			marshaller.marshal(viewContext, result);
		} catch (XmlMappingException e) {
 			e.printStackTrace();
		} catch (IOException e) {
			e.printStackTrace();
		}
		
		return result;

	}
	
}
