<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet
        xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
        version="2.0">

    <xsl:import href="../../utils/replace-newlines.xsl"/>
    <xsl:import href="../../utils/replace-string.xsl"/>
    <xsl:import href="../../utils/strip-digits.xsl"/>

    <!-- SPATIAL_DATA_ORGANIZATION_INFORMATION: *******************************-->

    <xsl:template match="spdoinfo">

        <xsl:apply-templates select="indspref"/>
        <xsl:apply-templates select="direct"/>
        <xsl:apply-templates select="ptvctinf"/>
        <xsl:apply-templates select="rastinfo"/>
    </xsl:template>

    <xsl:template match="indspref">
        <h4>Indirect Spatial Reference Method:</h4>
        <p>
            <xsl:call-template name="replace-newlines">
                <xsl:with-param name="element" select="."/>
            </xsl:call-template>
        </p>
    </xsl:template>

    <xsl:template match="direct">
        <h4 style="display: inline;">Direct Spatial Reference Method:</h4>
        <p style="display: inline;">
            <xsl:value-of select="."/>
        </p>
    </xsl:template>

    <xsl:template match="ptvctinf">
        <h4>Point and Vector Object Information:</h4>
        <xsl:for-each select="sdtsterm">
            <p>
                <b>
                    <i>Spatial Data Transfer Standard (<a
                            href="http://en.wikipedia.org/wiki/Spatial_Data_Transfer_Standard" target="_blank">SDTS</a>)
                        Terms Description:
                    </i>
                </b>
            </p>
            <blockquote>
                <xsl:for-each select="sdtstype">
                    <p>
                        <b>SDTS Point and Vector Object Type:</b>
                        <xsl:value-of select="."/>
                    </p>
                </xsl:for-each>
                <xsl:for-each select="ptvctcnt">
                    <p>
                        <b>Point and Vector Object Count:</b>
                        <xsl:value-of select="."/>
                    </p>
                </xsl:for-each>
            </blockquote>
        </xsl:for-each>
        <xsl:for-each select="vpfterm">
            <p>
                <b>
                    <i>Vector Product Format (<a href="http://en.wikipedia.org/wiki/Vector_Product_Format"
                                                 target="_blank">VPF</a>) Terms Description:
                    </i>
                </b>
            </p>
            <blockquote>
                <xsl:for-each select="vpflevel">
                    <p>
                        <b>VPF Topology Level:</b>
                        <xsl:value-of select="."/>
                    </p>
                </xsl:for-each>
                <xsl:for-each select="vpfinfo">
                    <p>
                        <b>VPF Point and Vector Object Information:</b>
                    </p>
                    <blockquote>
                        <xsl:for-each select="vpftype">
                            <p>
                                <b>VPF Point and Vector Object Type:</b>
                                <xsl:value-of select="."/>
                            </p>
                        </xsl:for-each>
                        <xsl:for-each select="ptvctcnt">
                            <p>
                                <b>Point and Vector Object Count:</b>
                                <xsl:value-of select="."/>
                            </p>
                        </xsl:for-each>
                    </blockquote>
                </xsl:for-each>
            </blockquote>
        </xsl:for-each>
    </xsl:template>

    <xsl:template match="rastinfo">
        <h4>Raster Object Information:</h4>
        <xsl:for-each select="rasttype">
            <p>
                <b>
                    <i>Raster Object Type:</i>
                </b>
                <xsl:value-of select="."/>
            </p>
        </xsl:for-each>
        <xsl:for-each select="rowcount">
            <p>
                <b>
                    <i>Row Count:</i>
                </b>
                <xsl:value-of select="."/>
            </p>
        </xsl:for-each>
        <xsl:for-each select="colcount">
            <p>
                <b>
                    <i>Column Count:</i>
                </b>
                <xsl:value-of select="."/>
            </p>
        </xsl:for-each>
        <xsl:for-each select="vrtcount">
            <p>
                <b>
                    <i>Vertical Count:</i>
                </b>
                <xsl:value-of select="."/>
            </p>
        </xsl:for-each>
    </xsl:template>

    <!-- SPATIAL_REFERENCE_INFORMATION: ***************************************-->

    <xsl:template match="spref">

        <xsl:apply-templates select="horizsys"/>
        <xsl:apply-templates select="vertdef"/>
    </xsl:template>

    <xsl:template match="horizsys">
        <h4>Horizontal Coordinate System Definition:</h4>
        <xsl:for-each select="geograph">
            <p>
                <b>
                    <i>Geographic:</i>
                </b>
            </p>
            <blockquote>
                <xsl:for-each select="latres">
                    <p>
                        <b>Latitude Resolution:</b>
                        <xsl:value-of select="."/>
                    </p>
                </xsl:for-each>
                <xsl:for-each select="longres">
                    <p>
                        <b>Longitude Resolution:</b>
                        <xsl:value-of select="."/>
                    </p>
                </xsl:for-each>
                <xsl:for-each select="geogunit">
                    <p>
                        <b>Geographic Coordinate Units:</b>
                        <xsl:value-of select="."/>
                    </p>
                </xsl:for-each>
            </blockquote>
        </xsl:for-each>
        <xsl:for-each select="planar">
            <p>
                <b>
                    <i>Planar:</i>
                </b>
            </p>
            <blockquote>
                <xsl:for-each select="mapproj">
                    <p>
                        <b>Map Projection:</b>
                    </p>
                    <blockquote>
                        <xsl:for-each select="mapprojn">
                            <p>
                                <b>Map Projection Name:</b>
                                <xsl:value-of select="."/>
                            </p>
                        </xsl:for-each>
                        <xsl:for-each select="albers">
                            <p>
                                <b>Albers Conical Equal Area:</b>
                            </p>
                            <xsl:apply-templates select="."/>
                        </xsl:for-each>
                        <xsl:for-each select="azimequi">
                            <p>
                                <b>Azimuthal Equidistant:</b>
                            </p>
                            <xsl:apply-templates select="."/>
                        </xsl:for-each>
                        <xsl:for-each select="equicon">
                            <p>
                                <b>Equidistant Conic:</b>
                            </p>
                            <xsl:apply-templates select="."/>
                        </xsl:for-each>
                        <xsl:for-each select="equirect">
                            <p>
                                <b>Equirectangular:</b>
                            </p>
                            <xsl:apply-templates select="."/>
                        </xsl:for-each>
                        <xsl:for-each select="gvnsp">
                            <p>
                                <b>General Vertical Near-sided Perspective:</b>
                            </p>
                            <xsl:apply-templates select="."/>
                        </xsl:for-each>
                        <xsl:for-each select="gnomonic">
                            <p>
                                <b>Gnomonic:</b>
                            </p>
                            <xsl:apply-templates select="."/>
                        </xsl:for-each>
                        <xsl:for-each select="lamberta">
                            <p>
                                <b>Lambert Azimuthal Equal Area:</b>
                            </p>
                            <xsl:apply-templates select="."/>
                        </xsl:for-each>
                        <xsl:for-each select="lambertc">
                            <p>
                                <b>Lambert Conformal Conic:</b>
                            </p>
                            <xsl:apply-templates select="."/>
                        </xsl:for-each>
                        <xsl:for-each select="mercator">
                            <p>
                                <b>Mercator:</b>
                            </p>
                            <xsl:apply-templates select="."/>
                        </xsl:for-each>
                        <xsl:for-each select="modsak">
                            <p>
                                <b>Modified Stereographic for Alaska:</b>
                            </p>
                            <blockquote>
                                <xsl:apply-templates select="feast"/>
                                <xsl:apply-templates select="fnorth"/>
                            </blockquote>
                        </xsl:for-each>
                        <xsl:for-each select="miller">
                            <p>
                                <b>Miller Cylindrical:</b>
                            </p>
                            <xsl:apply-templates select="."/>
                        </xsl:for-each>
                        <xsl:for-each select="obqmerc">
                            <p>
                                <b>Oblique Mercator:</b>
                            </p>
                            <xsl:apply-templates select="."/>
                        </xsl:for-each>
                        <xsl:for-each select="orthogr">
                            <p>
                                <b>Orthographic:</b>
                            </p>
                            <xsl:apply-templates select="."/>
                        </xsl:for-each>
                        <xsl:for-each select="polarst">
                            <p>
                                <b>Polar Stereographic:</b>
                            </p>
                            <xsl:apply-templates select="."/>
                        </xsl:for-each>
                        <xsl:for-each select="polycon">
                            <p>
                                <b>Polyconic:</b>
                            </p>
                            <xsl:apply-templates select="."/>
                        </xsl:for-each>
                        <xsl:for-each select="robinson">
                            <p>
                                <b>Robinson:</b>
                            </p>
                            <blockquote>
                                <xsl:apply-templates select="longpc"/>
                                <xsl:apply-templates select="feast"/>
                                <xsl:apply-templates select="fnorth"/>
                            </blockquote>
                        </xsl:for-each>
                        <xsl:for-each select="sinusoid">
                            <p>
                                <b>Sinusoidal:</b>
                            </p>
                            <xsl:apply-templates select="."/>
                        </xsl:for-each>
                        <xsl:for-each select="spaceobq">
                            <p>
                                <b>Space Oblique Mercator (Landsat):</b>
                            </p>
                            <blockquote>
                                <xsl:apply-templates select="landsat"/>
                                <xsl:apply-templates select="pathnum"/>
                                <xsl:apply-templates select="feast"/>
                                <xsl:apply-templates select="fnorth"/>
                            </blockquote>
                        </xsl:for-each>
                        <xsl:for-each select="stereo">
                            <p>
                                <b>Stereographic:</b>
                            </p>
                            <xsl:apply-templates select="."/>
                        </xsl:for-each>
                        <xsl:for-each select="transmer">
                            <p>
                                <b>Transverse Mercator:</b>
                            </p>
                            <xsl:apply-templates select="."/>
                        </xsl:for-each>
                        <xsl:for-each select="vdgrin">
                            <p>
                                <b>van der Grinten:</b>
                            </p>
                            <xsl:apply-templates select="."/>
                        </xsl:for-each>
                        <xsl:for-each select="otherprj">
                            <p>
                                <b>Other Projection's Definition:</b>
                            </p>
                            <p>
                                <xsl:call-template name="replace-newlines">
                                    <xsl:with-param name="element" select="."/>
                                </xsl:call-template>
                            </p>
                        </xsl:for-each>
                    </blockquote>
                </xsl:for-each>
                <xsl:for-each select="gridsys">
                    <p>
                        <b>Grid Coordinate System:</b>
                    </p>
                    <blockquote>
                        <xsl:for-each select="gridsysn">
                            <p>
                                <b>Grid Coordinate System Name:</b>
                                <xsl:value-of select="."/>
                            </p>
                        </xsl:for-each>
                        <xsl:for-each select="utm">
                            <p>
                                <b>Universal Transverse Mercator:</b>
                            </p>
                            <blockquote>
                                <xsl:for-each select="utmzone">
                                    <p>
                                        <b>UTM Zone Number:</b>
                                        <xsl:value-of select="."/>
                                    </p>
                                </xsl:for-each>
                                <xsl:for-each select="transmer">
                                    <p>
                                        <b>Transverse Mercator:</b>
                                    </p>
                                </xsl:for-each>
                                <xsl:apply-templates select="transmer"/>
                            </blockquote>
                        </xsl:for-each>
                        <xsl:for-each select="ups">
                            <p>
                                <b>Universal Polar Stereographic:</b>
                            </p>
                            <blockquote>
                                <xsl:for-each select="upszone">
                                    <p>
                                        <b>UPS Zone Identifier:</b>
                                        <xsl:value-of select="."/>
                                    </p>
                                </xsl:for-each>
                                <xsl:for-each select="polarst">
                                    <p>
                                        <b>Polar Stereographic:</b>
                                    </p>
                                </xsl:for-each>
                                <xsl:apply-templates select="polarst"/>
                            </blockquote>
                        </xsl:for-each>
                        <xsl:for-each select="spcs">
                            <p>
                                <b>State Plane Coordinate System:</b>
                            </p>
                            <blockquote>
                                <xsl:for-each select="spcszone">
                                    <p>
                                        <b>SPCS Zone Identifier:</b>
                                        <xsl:value-of select="."/>
                                    </p>
                                </xsl:for-each>
                                <xsl:for-each select="lambertc">
                                    <p>
                                        <b>Lambert Conformal Conic:</b>
                                    </p>
                                </xsl:for-each>
                                <xsl:apply-templates select="lambertc"/>
                                <xsl:for-each select="transmer">
                                    <p>
                                        <b>Transverse Mercator:</b>
                                    </p>
                                </xsl:for-each>
                                <xsl:apply-templates select="transmer"/>
                                <xsl:for-each select="obqmerc">
                                    <p>
                                        <b>Oblique Mercator:</b>
                                    </p>
                                </xsl:for-each>
                                <xsl:apply-templates select="obqmerc"/>
                                <xsl:for-each select="polycon">
                                    <p>
                                        <b>Polyconic:</b>
                                    </p>
                                </xsl:for-each>
                                <xsl:apply-templates select="polycon"/>
                            </blockquote>
                        </xsl:for-each>
                        <xsl:for-each select="arcsys">
                            <p>
                                <b>ARC Coordinate System:</b>
                            </p>
                            <blockquote>
                                <xsl:for-each select="arczone">
                                    <p>
                                        <b>ARC System Zone Identifier:</b>
                                        <xsl:value-of select="."/>
                                    </p>
                                </xsl:for-each>
                                <xsl:for-each select="equirect">
                                    <p>
                                        <b>Equirectangular:</b>
                                    </p>
                                </xsl:for-each>
                                <xsl:apply-templates select="equirect"/>
                                <xsl:for-each select="azimequi">
                                    <p>
                                        <b>Azimuthal Equidistant:</b>
                                    </p>
                                </xsl:for-each>
                                <xsl:apply-templates select="azimequi"/>
                            </blockquote>
                        </xsl:for-each>
                        <xsl:for-each select="othergrd">
                            <p>
                                <b>Other Grid System's Definition:</b>
                            </p>
                            <p>
                                <xsl:call-template name="replace-newlines">
                                    <xsl:with-param name="element" select="."/>
                                </xsl:call-template>
                            </p>
                        </xsl:for-each>
                    </blockquote>
                </xsl:for-each>
                <xsl:for-each select="localp">
                    <p>
                        <b>Local Planar:</b>
                    </p>
                    <blockquote>
                        <xsl:for-each select="localpd">
                            <p>
                                <b>Local Planar Description:</b>
                            </p>
                            <p>
                                <xsl:call-template name="replace-newlines">
                                    <xsl:with-param name="element" select="."/>
                                </xsl:call-template>
                            </p>
                        </xsl:for-each>
                        <xsl:for-each select="localpgi">
                            <p>
                                <b>Local Planar Georeference Information:</b>
                            </p>
                            <p>
                                <xsl:call-template name="replace-newlines">
                                    <xsl:with-param name="element" select="."/>
                                </xsl:call-template>
                            </p>
                        </xsl:for-each>
                    </blockquote>
                </xsl:for-each>
                <xsl:for-each select="planci">
                    <p>
                        <b>Planar Coordinate Information:</b>
                    </p>
                    <blockquote>
                        <xsl:for-each select="plance">
                            <p>
                                <b>Planar Coordinate Encoding Method:</b>
                                <xsl:value-of select="."/>
                            </p>
                        </xsl:for-each>
                        <xsl:for-each select="coordrep">
                            <p>
                                <b>Coordinate Representation:</b>
                            </p>
                            <blockquote>
                                <xsl:for-each select="absres">
                                    <p>
                                        <b>Abscissa Resolution:</b>
                                        <xsl:value-of select="."/>
                                    </p>
                                </xsl:for-each>
                                <xsl:for-each select="ordres">
                                    <p>
                                        <b>Ordinate Resolution:</b>
                                        <xsl:value-of select="."/>
                                    </p>
                                </xsl:for-each>
                            </blockquote>
                        </xsl:for-each>
                        <xsl:for-each select="distbrep">
                            <p>
                                <b>Distance and Bearing Representation:</b>
                            </p>
                            <blockquote>
                                <xsl:for-each select="distres">
                                    <p>
                                        <b>Distance Resolution:</b>
                                        <xsl:value-of select="."/>
                                    </p>
                                </xsl:for-each>
                                <xsl:for-each select="bearres">
                                    <p>
                                        <b>Bearing Resolution:</b>
                                        <xsl:value-of select="."/>
                                    </p>
                                </xsl:for-each>
                                <xsl:for-each select="bearunit">
                                    <p>
                                        <b>Bearing Units:</b>
                                        <xsl:value-of select="."/>
                                    </p>
                                </xsl:for-each>
                                <xsl:for-each select="bearrefd">
                                    <p>
                                        <b>Bearing Reference Direction:</b>
                                        <xsl:value-of select="."/>
                                    </p>
                                </xsl:for-each>
                                <xsl:for-each select="bearrefm">
                                    <p>
                                        <b>Bearing Reference Meridian:</b>
                                        <xsl:value-of select="."/>
                                    </p>
                                </xsl:for-each>
                            </blockquote>
                        </xsl:for-each>
                        <xsl:for-each select="plandu">
                            <p>
                                <b>Planar Distance Units:</b>
                                <xsl:value-of select="."/>
                            </p>
                        </xsl:for-each>
                    </blockquote>
                </xsl:for-each>
            </blockquote>
        </xsl:for-each>
        <xsl:for-each select="local">
            <p>
                <b>
                    <i>Local:</i>
                </b>
            </p>
            <blockquote>
                <xsl:for-each select="localdes">
                    <p>
                        <b>Local Description:</b>
                    </p>
                    <p>
                        <xsl:call-template name="replace-newlines">
                            <xsl:with-param name="element" select="."/>
                        </xsl:call-template>
                    </p>
                </xsl:for-each>
                <xsl:for-each select="localgeo">
                    <p>
                        <b>Local Georeference Information:</b>
                    </p>
                    <p>
                        <xsl:call-template name="replace-newlines">
                            <xsl:with-param name="element" select="."/>
                        </xsl:call-template>
                    </p>
                </xsl:for-each>
            </blockquote>
        </xsl:for-each>
        <xsl:for-each select="geodetic">
            <p>
                <b>
                    <i>Geodetic Model:</i>
                </b>
            </p>
            <blockquote>
                <xsl:for-each select="horizdn">
                    <p>
                        <b>Horizontal Datum Name:</b>
                        <xsl:value-of select="."/>
                    </p>
                </xsl:for-each>
                <xsl:for-each select="ellips">
                    <p>
                        <b>Ellipsoid Name:</b>
                        <xsl:value-of select="."/>
                    </p>
                </xsl:for-each>
                <xsl:for-each select="semiaxis">
                    <p>
                        <b>Semi-major Axis:</b>
                        <xsl:value-of select="."/>
                    </p>
                </xsl:for-each>
                <xsl:for-each select="denflat">
                    <p>
                        <b>Denominator of Flattening Ratio:</b>
                        <xsl:value-of select="."/>
                    </p>
                </xsl:for-each>
            </blockquote>
        </xsl:for-each>
    </xsl:template>

    <xsl:template match="vertdef">
        <h4>Vertical Coordinate System Definition:</h4>
        <xsl:for-each select="altsys">
            <p>
                <b>
                    <i>Altitude System Definition:</i>
                </b>
            </p>
            <blockquote>
                <xsl:for-each select="altdatum">
                    <p>
                        <b>Altitude Datum Name:</b>
                        <xsl:value-of select="."/>
                    </p>
                </xsl:for-each>
                <xsl:for-each select="altres">
                    <p>
                        <b>Altitude Resolution:</b>
                        <xsl:value-of select="."/>
                    </p>
                </xsl:for-each>
                <xsl:for-each select="altunits">
                    <p>
                        <b>Altitude Distance Units:</b>
                        <xsl:value-of select="."/>
                    </p>
                </xsl:for-each>
                <xsl:for-each select="altenc">
                    <p>
                        <b>Altitude Encoding Method:</b>
                        <xsl:value-of select="."/>
                    </p>
                </xsl:for-each>
            </blockquote>
        </xsl:for-each>
        <xsl:for-each select="depthsys">
            <p>
                <b>
                    <i>Depth System Definition:</i>
                </b>
            </p>
            <blockquote>
                <xsl:for-each select="depthdn">
                    <p>
                        <b>Depth Datum Name:</b>
                        <xsl:value-of select="."/>
                    </p>
                </xsl:for-each>
                <xsl:for-each select="depthres">
                    <p>
                        <b>Depth Resolution:</b>
                        <xsl:value-of select="."/>
                    </p>
                </xsl:for-each>
                <xsl:for-each select="depthdu">
                    <p>
                        <b>Depth Distance Units:</b>
                        <xsl:value-of select="."/>
                    </p>
                </xsl:for-each>
                <xsl:for-each select="depthem">
                    <p>
                        <b>Depth Encoding Method:</b>
                        <xsl:value-of select="."/>
                    </p>
                </xsl:for-each>
            </blockquote>
        </xsl:for-each>
    </xsl:template>

    <xsl:template match="grngpoin">
        <p>
            <b>G-Ring Point:</b>
        </p>
        <blockquote>
            <xsl:for-each select="gringlat">
                <p>
                    <b>G-Ring Latitude:</b>
                    <xsl:value-of select="."/>&#176;
                </p>
            </xsl:for-each>
            <xsl:for-each select="gringlon">
                <p>
                    <b>G-Ring Longitude:</b>
                    <xsl:value-of select="."/>&#176;
                </p>
            </xsl:for-each>
        </blockquote>
    </xsl:template>

    <xsl:template match="gring">
        <p>
            <b>G-Ring:</b>
        </p>
        <p>
            <xsl:call-template name="replace-newlines">
                <xsl:with-param name="element" select="."/>
            </xsl:call-template>
        </p>
    </xsl:template>

    <!-- Map Projections: -->

    <xsl:template match="albers | equicon | lambertc">
        <blockquote>
            <xsl:apply-templates select="stdparll"/>
            <xsl:apply-templates select="longcm"/>
            <xsl:apply-templates select="latprjo"/>
            <xsl:apply-templates select="feast"/>
            <xsl:apply-templates select="fnorth"/>
        </blockquote>
    </xsl:template>

    <xsl:template match="gnomonic | lamberta | orthogr | stereo | gvnsp">
        <blockquote>
            <xsl:for-each select="../gvnsp">
                <xsl:apply-templates select="heightpt"/>
            </xsl:for-each>
            <xsl:apply-templates select="longpc"/>
            <xsl:apply-templates select="latprjc"/>
            <xsl:apply-templates select="feast"/>
            <xsl:apply-templates select="fnorth"/>
        </blockquote>
    </xsl:template>

    <xsl:template match="miller | sinusoid | vdgrin | equirect | mercator">
        <blockquote>
            <xsl:for-each select="../equirect">
                <xsl:apply-templates select="stdparll"/>
            </xsl:for-each>
            <xsl:for-each select="../mercator">
                <xsl:apply-templates select="stdparll"/>
                <xsl:apply-templates select="sfequat"/>
            </xsl:for-each>
            <xsl:apply-templates select="longcm"/>
            <xsl:apply-templates select="feast"/>
            <xsl:apply-templates select="fnorth"/>
        </blockquote>
    </xsl:template>

    <xsl:template match="azimequi | polycon">
        <blockquote>
            <xsl:apply-templates select="longcm"/>
            <xsl:apply-templates select="latprjo"/>
            <xsl:apply-templates select="feast"/>
            <xsl:apply-templates select="fnorth"/>
        </blockquote>
    </xsl:template>

    <xsl:template match="transmer">
        <blockquote>
            <xsl:apply-templates select="sfctrmer"/>
            <xsl:apply-templates select="longcm"/>
            <xsl:apply-templates select="latprjo"/>
            <xsl:apply-templates select="feast"/>
            <xsl:apply-templates select="fnorth"/>
        </blockquote>
    </xsl:template>


    <xsl:template match="polarst">
        <blockquote>
            <xsl:apply-templates select="svlong"/>
            <xsl:apply-templates select="stdparll"/>
            <xsl:apply-templates select="sfprjorg"/>
            <xsl:apply-templates select="feast"/>
            <xsl:apply-templates select="fnorth"/>
        </blockquote>
    </xsl:template>

    <xsl:template match="obqmerc">
        <blockquote>
            <xsl:apply-templates select="sfctrlin"/>
            <xsl:apply-templates select="obqlazim"/>
            <xsl:apply-templates select="obqlpt"/>
            <xsl:apply-templates select="latprjo"/>
            <xsl:apply-templates select="feast"/>
            <xsl:apply-templates select="fnorth"/>
        </blockquote>
    </xsl:template>

    <!-- Map Projection Parameters: -->

    <xsl:template match="stdparll">
        <p>
            <b>Standard Parallel:</b>
            <xsl:value-of select="."/>&#176;
        </p>
    </xsl:template>

    <xsl:template match="longcm">
        <p>
            <b>Longitude of Central Meridian:</b>
            <xsl:value-of select="."/>&#176;
        </p>
    </xsl:template>

    <xsl:template match="latprjo">
        <p>
            <b>Latitude of Projection Origin:</b>
            <xsl:value-of select="."/>&#176;
        </p>
    </xsl:template>

    <xsl:template match="feast">
        <p>
            <b>False Easting:</b>
            <xsl:value-of select="."/>
        </p>
    </xsl:template>

    <xsl:template match="fnorth">
        <p>
            <b>False Northing:</b>
            <xsl:value-of select="."/>
        </p>
    </xsl:template>

    <xsl:template match="sfequat">
        <p>
            <b>Scale Factor at Equator:</b>
            <xsl:value-of select="."/>
        </p>
    </xsl:template>

    <xsl:template match="heightpt">
        <p>
            <b>Height of Perspective Point Above Surface:</b>
            <xsl:value-of select="."/>
        </p>
    </xsl:template>

    <xsl:template match="longpc">
        <p>
            <b>Longitude of Projection Center:</b>
            <xsl:value-of select="."/>&#176;
        </p>
    </xsl:template>

    <xsl:template match="latprjc">
        <p>
            <b>Latitude of Projection Center:</b>
            <xsl:value-of select="."/>&#176;
        </p>
    </xsl:template>

    <xsl:template match="sfctrlin">
        <p>
            <b>Scale Factor at Center Line:</b>
            <xsl:value-of select="."/>
        </p>
    </xsl:template>

    <xsl:template match="obqlazim">
        <p>
            <b>Oblique Line Azimuth:</b>
        </p>
        <blockquote>
            <xsl:for-each select="azimangl">
                <p>
                    <b>Azimuthal Angle:</b>
                    <xsl:value-of select="."/>&#176;
                </p>
            </xsl:for-each>
            <xsl:for-each select="azimptl">
                <p>
                    <b>Azimuthal Measure Point Longitude:</b>
                    <xsl:value-of select="."/>&#176;
                </p>
            </xsl:for-each>
        </blockquote>
    </xsl:template>

    <xsl:template match="obqlpt">
        <p>
            <b>Oblique Line Point:</b>
        </p>
        <blockquote>
            <p>
                <b>Oblique Line Latitude:</b>
                <xsl:value-of select="obqllat[1]"/>&#176;
            </p>
            <p>
                <b>Oblique Line Longitude:</b>
                <xsl:value-of select="obqllong[1]"/>&#176;
            </p>
            <p>
                <b>Oblique Line Latitude:</b>
                <xsl:value-of select="obqllat[2]"/>&#176;
            </p>
            <p>
                <b>Oblique Line Longitude:</b>
                <xsl:value-of select="obqllong[2]"/>&#176;
            </p>
        </blockquote>
    </xsl:template>

    <xsl:template match="svlong">
        <p>
            <b>Straight Vertical Longitude from Pole:</b>
            <xsl:value-of select="."/>&#176;
        </p>
    </xsl:template>

    <xsl:template match="sfprjorg">
        <p>
            <b>Scale Factor at Projection Origin:</b>
            <xsl:value-of select="."/>
        </p>
    </xsl:template>

    <xsl:template match="landsat">
        <p>
            <b>Landsat Number:</b>
            <xsl:value-of select="."/>
        </p>
    </xsl:template>

    <xsl:template match="pathnum">
        <p>
            <b>Path Number:</b>
            <xsl:value-of select="."/>
        </p>
    </xsl:template>

    <xsl:template match="sfctrmer">
        <p>
            <b>Scale Factor at Central Meridian:</b>
            <xsl:value-of select="."/>
        </p>
    </xsl:template>
</xsl:stylesheet>
