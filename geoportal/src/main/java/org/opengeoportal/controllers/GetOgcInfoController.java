package org.opengeoportal.controllers;


import org.opengeoportal.ogc.AugmentedSolrRecord;
import org.opengeoportal.ogc.AugmentedSolrRecordRetriever;
import org.opengeoportal.ogc.OwsInfo;
import org.opengeoportal.search.OGPRecord;
import org.opengeoportal.service.SearchService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@RequestMapping("/info")
public class GetOgcInfoController {

	final Logger logger = LoggerFactory.getLogger(this.getClass());

	final
	AugmentedSolrRecordRetriever augmentedSolrRecordRetriever;

	final
	SearchService searchService;

	@Autowired
	public GetOgcInfoController(AugmentedSolrRecordRetriever augmentedSolrRecordRetriever, SearchService searchService) {
		this.augmentedSolrRecordRetriever = augmentedSolrRecordRetriever;
		this.searchService = searchService;
	}

	@RequestMapping(method=RequestMethod.GET, produces="application/json")
	public @ResponseBody AugmentedSolrRecord getLayerInfo(@RequestParam("ogpid") String layerId) throws Exception {
		return augmentedSolrRecordRetriever.getOgcAugmentedSolrRecord(layerId);

	}
	
	@RequestMapping(value="wmsInfo", method=RequestMethod.GET, produces="application/json")
	public @ResponseBody OwsInfo wmsInfo(@RequestParam("ogpid") String layerId) throws Exception {
		return augmentedSolrRecordRetriever.getWmsInfo(layerId);
	}
	
	@RequestMapping(value="ogcData", method=RequestMethod.GET, produces="application/json")
	public @ResponseBody OwsInfo ogcDataInfo(@RequestParam("ogpid") String layerId) throws Exception {
		return augmentedSolrRecordRetriever.getOgcDataInfo(layerId);
	}
	
	@RequestMapping(value="ogp", method=RequestMethod.GET, produces="application/json")
	public @ResponseBody OGPRecord ogcSolrInfo(@RequestParam("ogpid") String layerId, @RequestParam(value="full", defaultValue="false") Boolean includeMetadata) throws Exception {
		OGPRecord record = searchService.findRecordById(layerId);
		if (includeMetadata){
			return record;
		} else {
			//record.setFgdcText(null);
			//TODO: does the javascript client use this functionality? CSB 10/2021
			return record;
		}
	}

}
