<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="2.0">

    <xsl:import href="../utils/replace-newlines.xsl"/>
    <xsl:import href="../utils/replace-string.xsl"/>
    <xsl:import href="../utils/strip-digits.xsl"/>
    <xsl:import href="../utils/common.xsl"/>

    <xsl:import href="./templates/common.xsl"/>


    <!-- IDENTIFICATION_INFORMATION: ****************************************** -->
    <xsl:template match="idinfo">

        <xsl:if test="datasetid">
            <h3 class="subSectionHeader datasetid">Dataset Identification</h3>
            <div class="subSectionContent datasetid">
                <xsl:apply-templates select="datasetid"/>
            </div>
        </xsl:if>

        <xsl:if test="citation">
            <h3 class="subSectionHeader citation">Citation</h3>
            <div class="subSectionContent citation">
                <xsl:apply-templates select="citation"/>
            </div>
        </xsl:if>

        <xsl:if test="descript">
            <h3 class="subSectionHeader abstract">Description</h3>
            <div class="subSectionContent abstract">
                <xsl:apply-templates select="descript"/>
            </div>
        </xsl:if>

        <xsl:if test="timeperd">
            <h3 class="subSectionHeader timeperd">Time Period</h3>
            <div class="subSectionContent timeperd">
                <xsl:apply-templates select="timeperd"/>
            </div>
        </xsl:if>

        <xsl:if test="status">
            <h3 class="subSectionHeader status">Status</h3>
            <div class="subSectionContent status">
                <xsl:apply-templates select="status"/>
            </div>
        </xsl:if>

        <xsl:if test="spdom">
            <h3 class="subSectionHeader spdom">Spatial Domain</h3>
            <div class="subSectionContent spdom">
                <xsl:apply-templates select="spdom"/>
            </div>
        </xsl:if>

        <xsl:if test="keywords">
            <h3 class="subSectionHeader descriptiveKeywords">Descriptive Keywords</h3>
            <div class="subSectionContent descriptiveKeywords">
                <xsl:apply-templates select="keywords"/>
            </div>
        </xsl:if>

        <xsl:if test="taxonomy">
            <h3 class="subSectionHeader taxonomy">Taxonomy</h3>
            <div class="subSectionContent taxonomy">
                <xsl:apply-templates select="taxonomy"/>
            </div>
        </xsl:if>

        <xsl:apply-templates select="plainsid"/>


        <xsl:if test="accconst">
            <h3 class="subSectionHeader accessConstraints">Access Constraints</h3>
            <div class="subSectionContent accessConstraints">
                <xsl:apply-templates select="accconst"/>
            </div>
        </xsl:if>

        <xsl:if test="useconst">
            <h3 class="subSectionHeader useConstraints">Use Constraints</h3>
            <div class="subSectionContent useConstraints">
                <xsl:apply-templates select="useconst"/>
            </div>
        </xsl:if>

        <xsl:if test="ptcontac">
            <h3 class="subSectionHeader pointOfContact">Point of Contact</h3>
            <div class="subSectionContent pointOfContact">
                <xsl:apply-templates select="ptcontac"/>
            </div>
        </xsl:if>

        <xsl:if test="browse">
            <h3 class="subSectionHeader graphicOverview">Browse</h3>
            <div class="subSectionContent graphicOverview">
                <xsl:apply-templates select="browse"/>
            </div>
        </xsl:if>

        <xsl:apply-templates select="datacred"/>
        <xsl:apply-templates select="secinfo"/>
        <xsl:apply-templates select="native"/>
        <xsl:apply-templates select="crossref"/>
        <xsl:apply-templates select="tool"/>


        <xsl:if test="agginfo">
            <h3 class="subSectionHeader aggregationInfo">Aggregation Information</h3>
            <div class="subSectionContent aggregationInfo">
                <xsl:apply-templates select="agginfo"/>
            </div>
        </xsl:if>


    </xsl:template>


    <xsl:template match="datsetid">
        <xsl:if test="string-length( . )">
            <xsl:call-template name="ciElement">
                <xsl:with-param name="level">
                    <xsl:value-of select="4"/>
                </xsl:with-param>
                <xsl:with-param name="heading">
                    Dataset Identifier
                </xsl:with-param>
                <xsl:with-param name="content" select="."/>
            </xsl:call-template>
        </xsl:if>
    </xsl:template>

    <xsl:template match="citation">
        <xsl:apply-templates select="citeinfo">
            <xsl:with-param name="level">
                <xsl:text>5</xsl:text>
            </xsl:with-param>
        </xsl:apply-templates>
    </xsl:template>

    <xsl:template match="descript">

        <xsl:call-template name="ciElement">
            <xsl:with-param name="level">
                <xsl:value-of select="4"/>
            </xsl:with-param>
            <xsl:with-param name="heading">
                Abstract
            </xsl:with-param>
            <xsl:with-param name="content">
                <xsl:call-template name="replace-newlines">
                    <xsl:with-param name="element" select="abstract"/>
                </xsl:call-template>
            </xsl:with-param>
        </xsl:call-template>

        <xsl:call-template name="ciElement">
            <xsl:with-param name="level">
                <xsl:value-of select="4"/>
            </xsl:with-param>
            <xsl:with-param name="heading">
                Purpose
            </xsl:with-param>

            <xsl:with-param name="content">
                <xsl:call-template name="replace-newlines">
                    <xsl:with-param name="element" select="purpose"/>
                </xsl:call-template>
            </xsl:with-param>
        </xsl:call-template>

        <xsl:call-template name="ciElement">
            <xsl:with-param name="level">
                <xsl:value-of select="4"/>
            </xsl:with-param>
            <xsl:with-param name="heading">
                Documentation
            </xsl:with-param>
            <xsl:with-param name="isText" select="false()"/>

            <xsl:with-param name="content">
                <xsl:apply-templates select="documnts"/>
            </xsl:with-param>
        </xsl:call-template>

    </xsl:template>


    <xsl:template match="documnts">
        <h5>User's Guide:</h5>
        <div>
            <xsl:apply-templates select="citeinfo">
                <xsl:with-param name="level">
                    <xsl:text>5</xsl:text>
                </xsl:with-param>
            </xsl:apply-templates>
        </div>
    </xsl:template>

    <xsl:template match="timeperd">

        <xsl:call-template name="ciElement">
            <xsl:with-param name="level">
                <xsl:value-of select="4"/>
            </xsl:with-param>
            <xsl:with-param name="heading">
                Time Period of Content
            </xsl:with-param>
            <xsl:with-param name="isText" select="false()"/>
            <xsl:with-param name="content">
                <xsl:call-template name="timeinfo">
                    <xsl:with-param name="element" select="timeinfo"/>
                    <xsl:with-param name="italicize-heading" select="true()"/>
                </xsl:call-template>
            </xsl:with-param>
        </xsl:call-template>

        <xsl:call-template name="ciElement">
            <xsl:with-param name="level">
                <xsl:value-of select="4"/>
            </xsl:with-param>
            <xsl:with-param name="heading">
                Currentness Reference
            </xsl:with-param>
            <xsl:with-param name="content" select="current"/>

        </xsl:call-template>

    </xsl:template>


    <xsl:template match="status">
        <xsl:if test="string-length( . )">

            <xsl:call-template name="ciElement">
                <xsl:with-param name="level">
                    <xsl:value-of select="4"/>
                </xsl:with-param>
                <xsl:with-param name="heading">
                    Progress
                </xsl:with-param>
                <xsl:with-param name="content" select="progress"/>
            </xsl:call-template>

            <xsl:call-template name="ciElement">
                <xsl:with-param name="level">
                    <xsl:value-of select="4"/>
                </xsl:with-param>
                <xsl:with-param name="heading">
                    Maintenance and Update Frequency
                </xsl:with-param>
                <xsl:with-param name="content" select="update"/>
            </xsl:call-template>
        </xsl:if>
    </xsl:template>

    <xsl:template match="spdom">

        <xsl:call-template name="ciElement">
            <xsl:with-param name="level">
                <xsl:value-of select="5"/>
            </xsl:with-param>
            <xsl:with-param name="heading">
                Description of Geographic Extent
            </xsl:with-param>
            <xsl:with-param name="isText" select="false()"/>
            <xsl:with-param name="content">
                <xsl:call-template name="replace-newlines">
                    <xsl:with-param name="element" select="descgeog"/>
                </xsl:call-template>
            </xsl:with-param>
        </xsl:call-template>
        <xsl:for-each select="bounding">
            <h5>
                <xsl:attribute name="title">
                    <xsl:call-template name="fullpath"/>
                    <xsl:text>(West, South, East, North)</xsl:text>
                </xsl:attribute>
                Bounding Coordinates:
            </h5>
            <div>
                <xsl:comment>
                    Add Map here:
                </xsl:comment>
                <div class="metadataMap"></div>
                <xsl:comment>
                    Area to display current cursor lat/lon location:
                </xsl:comment>

                <div id="message" class="SmallTextGray">&#160;</div>

                <div class="bounds">

                    <div>
                        <xsl:call-template name="strip-digits">
                            <xsl:with-param name="element" select="westbc"/>
                            <xsl:with-param name="num-digits" select="5"/>
                        </xsl:call-template>
                        &#176;
                    </div>
                    <div>
                        <xsl:call-template name="strip-digits">
                            <xsl:with-param name="element" select="southbc"/>
                            <xsl:with-param name="num-digits" select="5"/>
                        </xsl:call-template>
                        &#176;
                    </div>
                    <div>
                        <xsl:call-template name="strip-digits">
                            <xsl:with-param name="element" select="eastbc"/>
                            <xsl:with-param name="num-digits" select="5"/>
                        </xsl:call-template>
                        &#176;
                    </div>
                    <div>
                        <xsl:call-template name="strip-digits">
                            <xsl:with-param name="element" select="northbc"/>
                            <xsl:with-param name="num-digits" select="5"/>
                        </xsl:call-template>
                        &#176;
                    </div>
                </div>
            </div>
        </xsl:for-each>


        <xsl:for-each select="boundalt">

            <xsl:call-template name="ciElement">
                <xsl:with-param name="level">
                    <xsl:value-of select="5"/>
                </xsl:with-param>
                <xsl:with-param name="heading">
                    Bounding Altitudes
                </xsl:with-param>
                <xsl:with-param name="isText" select="false()"/>
                <xsl:with-param name="content">

                    <xsl:call-template name="ciElement">
                        <xsl:with-param name="level">
                            <xsl:value-of select="6"/>
                        </xsl:with-param>
                        <xsl:with-param name="heading">
                            Minimum
                        </xsl:with-param>
                        <xsl:with-param name="isText" select="false()"/>
                        <xsl:with-param name="content">
                            <xsl:call-template name="strip-digits">
                                <xsl:with-param name="element" select="altmin"/>
                                <xsl:with-param name="num-digits" select="5"/>
                            </xsl:call-template>

                        </xsl:with-param>
                    </xsl:call-template>

                    <xsl:call-template name="ciElement">
                        <xsl:with-param name="level">
                            <xsl:value-of select="6"/>
                        </xsl:with-param>
                        <xsl:with-param name="heading">
                            Maximum
                        </xsl:with-param>
                        <xsl:with-param name="isText" select="false()"/>
                        <xsl:with-param name="content">
                            <xsl:call-template name="strip-digits">
                                <xsl:with-param name="element" select="altmax"/>
                                <xsl:with-param name="num-digits" select="5"/>
                            </xsl:call-template>

                        </xsl:with-param>
                    </xsl:call-template>


                    <xsl:call-template name="ciElement">
                        <xsl:with-param name="level">
                            <xsl:value-of select="6"/>
                        </xsl:with-param>
                        <xsl:with-param name="heading">
                            Units
                        </xsl:with-param>
                        <xsl:with-param name="isText" select="false()"/>
                        <xsl:with-param name="content" select="altunits"/>

                    </xsl:call-template>

                </xsl:with-param>
            </xsl:call-template>


            <xsl:for-each select="dsgpoly">
                <xsl:call-template name="ciElement">
                    <xsl:with-param name="level">
                        <xsl:value-of select="5"/>
                    </xsl:with-param>
                    <xsl:with-param name="heading">
                        Data Set G-Polygon
                    </xsl:with-param>
                    <xsl:with-param name="isText" select="false()"/>
                    <xsl:with-param name="content">

                        <xsl:for-each select="dsgpolyo">
                            <xsl:call-template name="ciElement">
                                <xsl:with-param name="level">
                                    <xsl:value-of select="6"/>
                                </xsl:with-param>
                                <xsl:with-param name="heading">
                                    Outer G-Ring
                                </xsl:with-param>
                                <xsl:with-param name="isText" select="false()"/>
                                <xsl:with-param name="content">
                                    <xsl:apply-templates select="grngpoin"/>
                                    <xsl:apply-templates select="gring"/>

                                </xsl:with-param>
                            </xsl:call-template>

                        </xsl:for-each>
                        <xsl:for-each select="dsgpolyx">
                            <xsl:call-template name="ciElement">
                                <xsl:with-param name="level">
                                    <xsl:value-of select="6"/>
                                </xsl:with-param>
                                <xsl:with-param name="heading">
                                    Exclusion G-Ring
                                </xsl:with-param>
                                <xsl:with-param name="isText" select="false()"/>
                                <xsl:with-param name="content">
                                    <xsl:apply-templates select="grngpoin"/>
                                    <xsl:apply-templates select="gring"/>

                                </xsl:with-param>
                            </xsl:call-template>
                        </xsl:for-each>


                    </xsl:with-param>
                </xsl:call-template>

            </xsl:for-each>

        </xsl:for-each>

    </xsl:template>


    <xsl:template match="keywords">

        <div>
            <xsl:call-template name="themekeywords"/>
            <xsl:call-template name="placekeywords"/>
            <xsl:call-template name="stratumkeywords"/>

            <xsl:call-template name="temporalkeywords"/>
        </div>

    </xsl:template>

    <!--Create keywords indices (keys) so that we can do a unique sort below: -->

    <xsl:key name="theme_by_id" match="themekey" use="."/>

    <xsl:template name="themekeywords">

        <xsl:for-each select="theme">
            <xsl:call-template name="ciElement">
                <xsl:with-param name="level">
                    <xsl:value-of select="3"/>
                </xsl:with-param>
                <xsl:with-param name="heading">
                    Theme Keywords
                </xsl:with-param>
                <xsl:with-param name="isText" select="false()"/>
                <xsl:with-param name="content">

                    <div>
                        <xsl:for-each
                                select="themekey[ count( . | key( 'theme_by_id', translate( normalize-space( . ), ',', '' ) )[ 1 ]) = 1 ]">
                            <xsl:sort select="."/>
                            <xsl:if test=". != '&gt;'">
                                <xsl:variable name="keyword">
                                    <xsl:call-template name="replace-string">
                                        <xsl:with-param name="element" select="."/>
                                        <xsl:with-param name="old-string">
                                            &gt;
                                        </xsl:with-param>
                                        <xsl:with-param name="new-string">
                                            <xsl:value-of select="$separator"/>
                                        </xsl:with-param>
                                    </xsl:call-template>
                                </xsl:variable>
                                <xsl:variable name="keyword2">
                                    <xsl:call-template name="replace-string">
                                        <xsl:with-param name="element" select="$keyword"/>
                                        <xsl:with-param name="old-string">
                                            &amp;gt;
                                        </xsl:with-param>
                                        <xsl:with-param name="new-string">
                                            <xsl:value-of select="$separator"/>
                                        </xsl:with-param>
                                    </xsl:call-template>
                                </xsl:variable>
                                <p>
                                    <xsl:value-of select="$keyword2"
                                                  disable-output-escaping="yes"/>
                                </p>
                            </xsl:if>

                        </xsl:for-each>
                    </div>

                    <xsl:call-template name="ciElement">
                        <xsl:with-param name="level">
                            <xsl:value-of select="4"/>
                        </xsl:with-param>
                        <xsl:with-param name="heading">
                            Thesaurus
                        </xsl:with-param>
                        <xsl:with-param name="content" select="themekt"/>
                    </xsl:call-template>
                </xsl:with-param>
            </xsl:call-template>
        </xsl:for-each>

    </xsl:template>

    <xsl:key name="place_by_id" match="placekey" use="."/>

    <xsl:template name="placekeywords">
        <xsl:for-each select="place">
            <xsl:call-template name="ciElement">
                <xsl:with-param name="level">
                    <xsl:value-of select="3"/>
                </xsl:with-param>
                <xsl:with-param name="heading">
                    Place Keywords
                </xsl:with-param>
                <xsl:with-param name="isText" select="false()"/>
                <xsl:with-param name="content">

                    <div>
                        <xsl:for-each
                                select="placekey[ count( . | key( 'place_by_id', translate( normalize-space( . ), ',', '' ) )[ 1 ]) = 1 ]">
                            <xsl:sort select="."/>
                            <xsl:if test=". != '&gt;'">
                                <xsl:variable name="keyword">
                                    <xsl:call-template name="replace-string">
                                        <xsl:with-param name="element" select="."/>
                                        <xsl:with-param name="old-string">
                                            &gt;
                                        </xsl:with-param>
                                        <xsl:with-param name="new-string">
                                            <xsl:value-of select="$separator"/>
                                        </xsl:with-param>
                                    </xsl:call-template>
                                </xsl:variable>
                                <xsl:variable name="keyword2">
                                    <xsl:call-template name="replace-string">
                                        <xsl:with-param name="element" select="$keyword"/>
                                        <xsl:with-param name="old-string">
                                            &amp;gt;
                                        </xsl:with-param>
                                        <xsl:with-param name="new-string">
                                            <xsl:value-of select="$separator"/>
                                        </xsl:with-param>
                                    </xsl:call-template>
                                </xsl:variable>
                                <p>
                                    <xsl:value-of select="$keyword2"
                                                  disable-output-escaping="yes"/>
                                </p>
                            </xsl:if>

                        </xsl:for-each>
                    </div>

                    <xsl:call-template name="ciElement">
                        <xsl:with-param name="level">
                            <xsl:value-of select="4"/>
                        </xsl:with-param>
                        <xsl:with-param name="heading">
                            Thesaurus
                        </xsl:with-param>
                        <xsl:with-param name="content" select="placekt"/>
                    </xsl:call-template>
                </xsl:with-param>
            </xsl:call-template>
        </xsl:for-each>

    </xsl:template>

    <xsl:key name="strat_by_id" match="stratkey" use="."/>


    <xsl:template name="stratumkeywords">
        <xsl:for-each select="stratum">
            <xsl:call-template name="ciElement">
                <xsl:with-param name="level">
                    <xsl:value-of select="3"/>
                </xsl:with-param>
                <xsl:with-param name="heading">
                    Stratum Keywords
                </xsl:with-param>
                <xsl:with-param name="isText" select="false()"/>
                <xsl:with-param name="content">

                    <div>
                        <xsl:for-each
                                select="stratkey[ count( . | key( 'strat_by_id', translate( normalize-space( . ), ',', '' ) )[ 1 ]) = 1 ]">
                            <xsl:sort select="."/>
                            <xsl:if test=". != '&gt;'">
                                <xsl:variable name="keyword">
                                    <xsl:call-template name="replace-string">
                                        <xsl:with-param name="element" select="."/>
                                        <xsl:with-param name="old-string">
                                            &gt;
                                        </xsl:with-param>
                                        <xsl:with-param name="new-string">
                                            <xsl:value-of select="$separator"/>
                                        </xsl:with-param>
                                    </xsl:call-template>
                                </xsl:variable>
                                <xsl:variable name="keyword2">
                                    <xsl:call-template name="replace-string">
                                        <xsl:with-param name="element" select="$keyword"/>
                                        <xsl:with-param name="old-string">
                                            &amp;gt;
                                        </xsl:with-param>
                                        <xsl:with-param name="new-string">
                                            <xsl:value-of select="$separator"/>
                                        </xsl:with-param>
                                    </xsl:call-template>
                                </xsl:variable>
                                <p>
                                    <xsl:value-of select="$keyword2"
                                                  disable-output-escaping="yes"/>
                                </p>
                            </xsl:if>

                        </xsl:for-each>
                    </div>

                    <xsl:call-template name="ciElement">
                        <xsl:with-param name="level">
                            <xsl:value-of select="4"/>
                        </xsl:with-param>
                        <xsl:with-param name="heading">
                            Thesaurus
                        </xsl:with-param>
                        <xsl:with-param name="content" select="stratkt"/>
                    </xsl:call-template>
                </xsl:with-param>
            </xsl:call-template>
        </xsl:for-each>
    </xsl:template>

    <xsl:key name="temp_by_id" match="tempkey" use="."/>


    <xsl:template name="temporalkeywords">
        <xsl:for-each select="temporal">
            <xsl:call-template name="ciElement">
                <xsl:with-param name="level">
                    <xsl:value-of select="3"/>
                </xsl:with-param>
                <xsl:with-param name="heading">
                    Temporal Keywords
                </xsl:with-param>
                <xsl:with-param name="isText" select="false()"/>
                <xsl:with-param name="content">

                    <div>
                        <xsl:for-each
                                select="tempkey[ count( . | key( 'temp_by_id', translate( normalize-space( . ), ',', '' ) )[ 1 ]) = 1 ]">
                            <xsl:sort select="."/>
                            <xsl:if test=". != '&gt;'">
                                <xsl:variable name="keyword">
                                    <xsl:call-template name="replace-string">
                                        <xsl:with-param name="element" select="."/>
                                        <xsl:with-param name="old-string">
                                            &gt;
                                        </xsl:with-param>
                                        <xsl:with-param name="new-string">
                                            <xsl:value-of select="$separator"/>
                                        </xsl:with-param>
                                    </xsl:call-template>
                                </xsl:variable>
                                <xsl:variable name="keyword2">
                                    <xsl:call-template name="replace-string">
                                        <xsl:with-param name="element" select="$keyword"/>
                                        <xsl:with-param name="old-string">
                                            &amp;gt;
                                        </xsl:with-param>
                                        <xsl:with-param name="new-string">
                                            <xsl:value-of select="$separator"/>
                                        </xsl:with-param>
                                    </xsl:call-template>
                                </xsl:variable>
                                <p>
                                    <xsl:value-of select="$keyword2"
                                                  disable-output-escaping="yes"/>
                                </p>
                            </xsl:if>

                        </xsl:for-each>
                    </div>

                    <xsl:call-template name="ciElement">
                        <xsl:with-param name="level">
                            <xsl:value-of select="4"/>
                        </xsl:with-param>
                        <xsl:with-param name="heading">
                            Thesaurus
                        </xsl:with-param>
                        <xsl:with-param name="content" select="tempkt"/>
                    </xsl:call-template>
                </xsl:with-param>
            </xsl:call-template>
        </xsl:for-each>
    </xsl:template>


    <xsl:template match="taxonomy">
        <h4>Taxonomy:</h4>
        <xsl:for-each select="keywtax">
            <p>
                <b>
                    <i>Keywords/Taxon:</i>
                </b>
            </p>
            <blockquote>
                <p>
                    <b>Taxonomic Keyword Thesaurus:</b>
                    <xsl:value-of select="taxonkt"/>
                    <br/>
                    <xsl:for-each select="taxonkey">
                        <xsl:sort select="."/>
                        <b>Taxonomic Keyword:</b>
                        <xsl:call-template name="replace-string">
                            <xsl:with-param name="element" select="."/>
                            <xsl:with-param name="old-string" select="'>'"/>
                            <xsl:with-param name="new-string" select="$separator"/>
                        </xsl:call-template>
                        <br/>
                    </xsl:for-each>
                </p>
            </blockquote>
        </xsl:for-each>
        <xsl:for-each select="taxonsys">
            <p>
                <b>
                    <i>Taxonomic System:</i>
                </b>
            </p>
            <blockquote>
                <xsl:for-each select="classsys">
                    <p>
                        <b>Classification System/Authority:</b>
                    </p>
                    <blockquote>
                        <xsl:for-each select="classcit">
                            <p>
                                <b>Classification System Citation:</b>
                            </p>
                            <blockquote>
                                <xsl:apply-templates select="citeinfo">
                                    <xsl:with-param name="level">
                                        <xsl:text>5</xsl:text>
                                    </xsl:with-param>
                                </xsl:apply-templates>
                            </blockquote>
                        </xsl:for-each>
                        <xsl:for-each select="classmod">
                            <p>
                                <b>Classification System Modifications:</b>
                            </p>
                            <p>
                                <xsl:call-template name="replace-newlines">
                                    <xsl:with-param name="element" select="."/>
                                </xsl:call-template>
                            </p>
                        </xsl:for-each>
                    </blockquote>
                </xsl:for-each>
                <xsl:for-each select="idref">
                    <p>
                        <b>Identification Reference:</b>
                    </p>
                    <blockquote>
                        <xsl:apply-templates select="citeinfo">
                            <xsl:with-param name="level">
                                <xsl:text>5</xsl:text>
                            </xsl:with-param>
                        </xsl:apply-templates>
                    </blockquote>
                </xsl:for-each>
                <xsl:for-each select="ider">
                    <p>
                        <b>Identifer:</b>
                    </p>
                    <blockquote>
                        <xsl:apply-templates select="cntinfo">
                            <xsl:with-param name="level">
                                <xsl:text>5</xsl:text>
                            </xsl:with-param>
                        </xsl:apply-templates>
                    </blockquote>
                </xsl:for-each>
                <xsl:for-each select="taxonpro">
                    <p>
                        <b>Taxonomic Procedures:</b>
                    </p>
                    <p>
                        <xsl:call-template name="replace-newlines">
                            <xsl:with-param name="element" select="."/>
                        </xsl:call-template>
                    </p>
                </xsl:for-each>
                <xsl:for-each select="taxoncom">
                    <p>
                        <b>Taxonomic Completeness:</b>
                    </p>
                    <p>
                        <xsl:call-template name="replace-newlines">
                            <xsl:with-param name="element" select="."/>
                        </xsl:call-template>
                    </p>
                </xsl:for-each>
                <xsl:for-each select="vouchers">
                    <p>
                        <b>Vouchers:</b>
                    </p>
                    <blockquote>
                        <p>
                            <b>Specimen:</b>
                            <xsl:value-of select="specimen"/>
                        </p>
                        <p>
                            <b>Repository:</b>
                        </p>
                        <blockquote>
                            <xsl:for-each select="reposit">
                                <xsl:apply-templates select="cntinfo">
                                    <xsl:with-param name="level">
                                        <xsl:text>5</xsl:text>
                                    </xsl:with-param>
                                </xsl:apply-templates>
                            </xsl:for-each>
                        </blockquote>
                    </blockquote>
                </xsl:for-each>
            </blockquote>
        </xsl:for-each>
        <xsl:for-each select="taxongen">
            <p>
                <b>
                    <i>General Taxonomic Coverage:</i>
                </b>
            </p>
            <p>
                <xsl:call-template name="replace-newlines">
                    <xsl:with-param name="element" select="."/>
                </xsl:call-template>
            </p>
        </xsl:for-each>
        <p>
            <b>
                <i>Taxonomic Classification:</i>
            </b>
        </p>
        <xsl:apply-templates select="taxoncl"/>
    </xsl:template>

    <!-- Taxonomic Classification (recursive): -->

    <xsl:template match="taxoncl">
        <div style="margin-left: 15px;">
            <font color="#6e6e6e">
                <b>
                    <xsl:value-of select="taxonrn"/>
                    :
                </b>
                <xsl:value-of select="taxonrv"/>
            </font>
            <xsl:for-each select="common">
                <div style="margin-left: 15px;">
                    <font color="#6e6e6e">
                        <b>Common Name:</b>
                        <xsl:value-of select="."/>
                    </font>
                </div>
            </xsl:for-each>
            <xsl:apply-templates select="taxoncl"/>
        </div>
    </xsl:template>

    <xsl:template match="plainsid">
        <xsl:if test="string-length( platflnm ) and string-length( instflnm )">
            <h4>Platform and Instrument Identification:</h4>
            <p>
                <b>
                    <i>Platform Full Name:</i>
                </b>
                <xsl:value-of select="platflnm"/>
                <br/>
                <xsl:if test="platfsnm">
                    <b>
                        <i>Platform Short Name:</i>
                    </b>
                    <xsl:value-of select="platfsnm"/>
                    <br/>
                </xsl:if>
                <b>
                    <i>Instrument Full Name:</i>
                </b>
                <xsl:value-of select="instflnm"/>
                <br/>
                <xsl:if test="instshnm">
                    <b>
                        <i>Instrument Short Name:</i>
                    </b>
                    <xsl:value-of select="instshnm"/>
                    <br/>
                </xsl:if>
            </p>
        </xsl:if>
    </xsl:template>

    <xsl:template match="accconst">
        <xsl:call-template name="replace-newlines">
            <xsl:with-param name="element" select="."/>
        </xsl:call-template>
    </xsl:template>

    <xsl:template match="useconst">
        <xsl:call-template name="replace-newlines">
            <xsl:with-param name="element" select="."/>
        </xsl:call-template>
    </xsl:template>

    <xsl:template match="ptcontac">
        <xsl:apply-templates select="cntinfo">
            <xsl:with-param name="level">
                <xsl:value-of select="5"/>
            </xsl:with-param>
        </xsl:apply-templates>
    </xsl:template>

    <xsl:template match="browse">
        <xsl:if test="string-length( browsen )">
            <div>
                <a href="{browsen}" target="_blank">
                    <img src="{browsen}" class="browse"/>
                </a>
                <br/>
                <a href="{browsen}" target="_blank">View full image</a>
            </div>

            <xsl:call-template name="ciElement">
                <xsl:with-param name="level">
                    <xsl:value-of select="5"/>
                </xsl:with-param>
                <xsl:with-param name="heading">
                    File Name
                </xsl:with-param>
                <xsl:with-param name="content" select="browsen"/>
            </xsl:call-template>

            <xsl:call-template name="ciElement">
                <xsl:with-param name="level">
                    <xsl:value-of select="5"/>
                </xsl:with-param>
                <xsl:with-param name="heading">
                    Description
                </xsl:with-param>
                <xsl:with-param name="isText" select="false()"/>
                <xsl:with-param name="content">
                    <xsl:call-template name="replace-newlines">
                        <xsl:with-param name="element" select="browsed"/>
                    </xsl:call-template>
                </xsl:with-param>
            </xsl:call-template>

            <xsl:call-template name="ciElement">
                <xsl:with-param name="level">
                    <xsl:value-of select="5"/>
                </xsl:with-param>
                <xsl:with-param name="heading">
                    Type
                </xsl:with-param>
                <xsl:with-param name="content" select="browset"/>
            </xsl:call-template>

        </xsl:if>
    </xsl:template>

    <xsl:template match="datacred">

        <xsl:call-template name="ciElement">
            <xsl:with-param name="level">
                <xsl:value-of select="4"/>
            </xsl:with-param>
            <xsl:with-param name="heading">
                Data Set Credit
            </xsl:with-param>
            <xsl:with-param name="isText" select="false()"/>
            <xsl:with-param name="content">
                <xsl:call-template name="replace-newlines">
                    <xsl:with-param name="element" select="."/>
                </xsl:call-template>
            </xsl:with-param>
        </xsl:call-template>

    </xsl:template>

    <xsl:template match="secinfo">
        <h4>Security Information:</h4>
        <xsl:for-each select="secsys">
            <p>
                <b>
                    <i>Security Classification System:</i>
                </b>
                <xsl:value-of select="."/>
            </p>
        </xsl:for-each>
        <xsl:for-each select="secclass">
            <p>
                <b>
                    <i>Security Classification:</i>
                </b>
                <xsl:value-of select="."/>
            </p>
        </xsl:for-each>
        <xsl:for-each select="sechandl">
            <p>
                <b>
                    <i>Security Handling Description:</i>
                </b>
            </p>
            <p>
                <xsl:call-template name="replace-newlines">
                    <xsl:with-param name="element" select="."/>
                </xsl:call-template>
            </p>
        </xsl:for-each>
    </xsl:template>

    <xsl:template match="native">

        <xsl:call-template name="ciElement">
            <xsl:with-param name="level">
                <xsl:value-of select="4"/>
            </xsl:with-param>
            <xsl:with-param name="heading">
                Native Data Set Environment
            </xsl:with-param>
            <xsl:with-param name="isText" select="false()"/>
            <xsl:with-param name="content">
                <xsl:call-template name="replace-newlines">
                    <xsl:with-param name="element" select="."/>
                </xsl:call-template>
            </xsl:with-param>
        </xsl:call-template>

    </xsl:template>

    <xsl:template match="crossref">
        <h4>Cross Reference:</h4>
        <xsl:apply-templates select="citeinfo">
            <xsl:with-param name="level">
                <xsl:text>5</xsl:text>
            </xsl:with-param>
        </xsl:apply-templates>
    </xsl:template>

    <xsl:template match="tool">
        <h4>Analytical Tool:</h4>
        <p>
            <b>
                <i>Analytical Tool Description:</i>
            </b>
        </p>
        <p>
            <xsl:call-template name="replace-newlines">
                <xsl:with-param name="element" select="tooldesc"/>
            </xsl:call-template>
        </p>
        <xsl:for-each select="toolacc">
            <p>
                <b>
                    <i>Tool Access Information:</i>
                </b>
            </p>
            <blockquote>
                <xsl:for-each select="onlink">
                    <p>
                        <b>Online Linkage:</b>
                        <a href="{.}">
                            <xsl:value-of select="."/>
                        </a>
                    </p>
                </xsl:for-each>
                <p>
                    <b>Tool Access Instructions:</b>
                </p>
                <p>
                    <xsl:call-template name="replace-newlines">
                        <xsl:with-param name="element" select="toolinst"/>
                    </xsl:call-template>
                </p>
                <xsl:for-each select="toolcomp">
                    <p>
                        <b>Tool Computer and Operating System:</b>
                    </p>
                    <p>
                        <xsl:call-template name="replace-newlines">
                            <xsl:with-param name="element" select="."/>
                        </xsl:call-template>
                    </p>
                </xsl:for-each>
            </blockquote>
        </xsl:for-each>
        <xsl:for-each select="toolcont">
            <p>
                <b>
                    <i>Tool Contact:</i>
                </b>
            </p>
            <xsl:apply-templates select="citeinfo">
                <xsl:with-param name="level">
                    <xsl:text>5</xsl:text>
                </xsl:with-param>
            </xsl:apply-templates>
        </xsl:for-each>
        <xsl:for-each select="toolcite">
            <p>
                <b>
                    <i>Tool Citation:</i>
                </b>
            </p>
            <xsl:apply-templates select="citeinfo">
                <xsl:with-param name="level">
                    <xsl:text>5</xsl:text>
                </xsl:with-param>
            </xsl:apply-templates>
        </xsl:for-each>
    </xsl:template>

    <xsl:template match="agginfo">
        <xsl:if test="string-length( conpckid/datsetid )">
            <h4>Aggregation Information:</h4>
            <p>
                <b>
                    <i>Container Packet ID:</i>
                </b>
            </p>
            <blockquote>
                <p>
                    <b>Dataset Identifier:</b>
                    <a
                            href="{concat( '/data/', translate( conpckid/datsetid, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz' ), '.html' )}">
                        <xsl:value-of
                                select="translate( conpckid/datsetid, 'abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' )"/>
                    </a>
                </p>
            </blockquote>
        </xsl:if>
    </xsl:template>
</xsl:stylesheet>
