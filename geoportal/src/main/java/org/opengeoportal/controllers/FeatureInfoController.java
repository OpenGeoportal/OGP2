package org.opengeoportal.controllers;

import org.opengeoportal.featureinfo.FeatureInfo;
import org.opengeoportal.featureinfo.FeatureInfoFactory;
import org.springframework.stereotype.Controller;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Controller
public class FeatureInfoController {
    private final FeatureInfoFactory featureInfoFactory;

    public FeatureInfoController(FeatureInfoFactory featureInfoFactory) {
        this.featureInfoFactory = featureInfoFactory;
    }

    @GetMapping(value= {"/featureinfo", "/featureInfo"})
    @ResponseBody public ModelMap getFeatureInfo(@RequestParam("ogpid") String layerId,
                                   @RequestParam("coord") Double[] coord,
                                   @RequestParam("bbox") Double[] bbox,
                                   @RequestParam("srs") String srs,
                                   @RequestParam("pixel") Integer[] pixel,
                                   @RequestParam("size") Integer[] size) throws Exception {

        FeatureInfo gfi = featureInfoFactory.getObject(layerId);
        int maxFeatures = 50;

        return gfi.getFeatureInformation(coord, bbox, srs, pixel,
                size, maxFeatures);

    }

    @ExceptionHandler(Exception.class)
    public
    @ResponseBody
    Map<String, String> handleException(Exception e) {
        Map<String, String> errorMap = new HashMap<String, String>();
        errorMap.put("error", e.getMessage());
        return errorMap;
    }
}
