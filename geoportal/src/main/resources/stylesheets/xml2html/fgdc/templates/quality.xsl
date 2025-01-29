<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet
        xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
        version="2.0">

    <xsl:import href="../utils/replace-newlines.xsl"/>
    <xsl:import href="./templates/common.xsl"/>


    <!-- DATA_QUALITY_INFORMATION *********************************************-->

    <xsl:template match="dataqual">

        <xsl:apply-templates select="attracc"/>
        <xsl:apply-templates select="logic"/>
        <xsl:apply-templates select="complete"/>
        <xsl:apply-templates select="posacc"/>
        <xsl:apply-templates select="lineage"/>
        <xsl:apply-templates select="cloud"/>
    </xsl:template>

    <xsl:template match="attracc">
        <h4>Attribute Accuracy:</h4>
        <xsl:for-each select="attraccr">
            <p>
                <b>
                    <i>Attribute Accuracy Report:</i>
                </b>
            </p>
            <p>
                <xsl:call-template name="replace-newlines">
                    <xsl:with-param name="element" select="."/>
                </xsl:call-template>
            </p>
        </xsl:for-each>
        <xsl:for-each select="qattracc">
            <p>
                <b>
                    <i>Quantitative Attribute Accuracy Assessment:</i>
                </b>
            </p>
            <blockquote>
                <xsl:for-each select="attraccv">
                    <p>
                        <b>Attribute Accuracy Value:</b>
                        <xsl:value-of select="."/>
                    </p>
                </xsl:for-each>
                <xsl:for-each select="attracce">
                    <p>
                        <b>Attribute Accuracy Explanation:</b>
                    </p>
                    <p>
                        <xsl:call-template name="replace-newlines">
                            <xsl:with-param name="element" select="."/>
                        </xsl:call-template>
                    </p>
                </xsl:for-each>
            </blockquote>
        </xsl:for-each>
    </xsl:template>

    <xsl:template match="logic">
        <h4>Logical Consistency Report:</h4>
        <p>
            <xsl:call-template name="replace-newlines">
                <xsl:with-param name="element" select="."/>
            </xsl:call-template>
        </p>
    </xsl:template>

    <xsl:template match="complete">
        <h4>Completeness Report:</h4>
        <p>
            <xsl:call-template name="replace-newlines">
                <xsl:with-param name="element" select="."/>
            </xsl:call-template>
        </p>
    </xsl:template>

    <xsl:template match="posacc">
        <h4>Positional Accuracy:</h4>
        <xsl:for-each select="horizpa">
            <p>
                <b>
                    <i>Horizontal Positional Accuracy:</i>
                </b>
            </p>
            <blockquote>
                <xsl:for-each select="horizpar">
                    <p>
                        <b>Horizontal Positional Accuracy Report:</b>
                    </p>
                    <p>
                        <xsl:call-template name="replace-newlines">
                            <xsl:with-param name="element" select="."/>
                        </xsl:call-template>
                    </p>
                </xsl:for-each>
                <xsl:for-each select="qhorizpa">
                    <p>
                        <b>Quantitative Horizontal Positional Accuracy Assessment:</b>
                    </p>
                    <blockquote>
                        <xsl:for-each select="horizpav">
                            <p>
                                <b>Horizontal Positional Accuracy Value:</b>
                                <xsl:value-of select="."/>
                            </p>
                        </xsl:for-each>
                        <xsl:for-each select="horizpae">
                            <p>
                                <b>Horizontal Positional Accuracy Explanation:</b>
                            </p>
                            <p>
                                <xsl:call-template name="replace-newlines">
                                    <xsl:with-param name="element" select="."/>
                                </xsl:call-template>
                            </p>
                        </xsl:for-each>
                    </blockquote>
                </xsl:for-each>
            </blockquote>
        </xsl:for-each>
        <xsl:for-each select="vertacc">
            <p>
                <b>
                    <i>Vertical Positional Accuracy:</i>
                </b>
            </p>
            <blockquote>
                <xsl:for-each select="vertaccr">
                    <p>
                        <b>Vertical Positional Accuracy Report:</b>
                    </p>
                    <p>
                        <xsl:call-template name="replace-newlines">
                            <xsl:with-param name="element" select="."/>
                        </xsl:call-template>
                    </p>
                </xsl:for-each>
                <xsl:for-each select="qvertpa">
                    <p>
                        <b>Quantitative Vertical Positional Accuracy Assessment:</b>
                    </p>
                    <blockquote>
                        <xsl:for-each select="vertaccv">
                            <p>
                                <b>Vertical Positional Accuracy Value:</b>
                                <xsl:value-of select="."/>
                            </p>
                        </xsl:for-each>
                        <xsl:for-each select="vertacce">
                            <p>
                                <b>Vertical Positional Accuracy Explanation:</b>
                            </p>
                            <p>
                                <xsl:call-template name="replace-newlines">
                                    <xsl:with-param name="element" select="."/>
                                </xsl:call-template>
                            </p>
                        </xsl:for-each>
                    </blockquote>
                </xsl:for-each>
            </blockquote>
        </xsl:for-each>
    </xsl:template>

    <xsl:template match="lineage">
        <h4>Lineage:</h4>
        <xsl:for-each select="method">
            <p>
                <b>
                    <i>Methodology:</i>
                </b>
            </p>
            <blockquote>
                <p>
                    <b>Methodology Type:</b>
                    <xsl:value-of select="methtype"/>
                </p>
                <xsl:for-each select="methodid">
                    <p>
                        <b>Methodolgy Identifier:</b>
                    </p>
                    <blockquote>
                        <p>
                            <b>Methodolgy Keyword Thesaurus:</b>
                            <xsl:value-of select="methkt"/>
                        </p>
                        <xsl:for-each select="methkey">
                            <p>
                                <b>Methodology Keyword:</b>
                                <xsl:value-of select="."/>
                            </p>
                        </xsl:for-each>
                    </blockquote>
                </xsl:for-each>
                <p>
                    <b>Methodology Description:</b>
                </p>
                <p>
                    <xsl:call-template name="replace-newlines">
                        <xsl:with-param name="element" select="methdesc"/>
                    </xsl:call-template>
                </p>
                <xsl:for-each select="methcite">
                    <p>
                        <b>Methodology Citation:</b>
                    </p>
                    <blockquote>
                        <xsl:apply-templates select="citeinfo">
                            <xsl:with-param name="level">
                                <xsl:text>5</xsl:text>
                            </xsl:with-param>
                        </xsl:apply-templates>
                    </blockquote>
                </xsl:for-each>
            </blockquote>
        </xsl:for-each>
        <xsl:for-each select="srcinfo">
            <p>
                <b>
                    <i>Source Information:</i>
                </b>
            </p>
            <blockquote>
                <xsl:for-each select="srccite">
                    <p>
                        <b>Source Citation:</b>
                    </p>
                    <blockquote>
                        <xsl:apply-templates select="citeinfo">
                            <xsl:with-param name="level">
                                <xsl:text>5</xsl:text>
                            </xsl:with-param>
                        </xsl:apply-templates>
                    </blockquote>
                </xsl:for-each>
                <xsl:for-each select="srcscale">
                    <p>
                        <b>Source Scale Denominator:</b>
                        <xsl:value-of select="."/>
                    </p>
                </xsl:for-each>
                <xsl:for-each select="typesrc">
                    <p>
                        <b>Type of Source Media:</b>
                        <xsl:value-of select="."/>
                    </p>
                </xsl:for-each>
                <xsl:for-each select="srctime">
                    <p>
                        <b>Source Time Period of Content:</b>
                    </p>
                    <blockquote>
                        <xsl:call-template name="timeinfo">
                            <xsl:with-param name="element" select="timeinfo"/>
                            <xsl:with-param name="italicize-heading" select="false()"/>
                        </xsl:call-template>
                        <xsl:for-each select="srccurr">
                            <p>
                                <b>Source Currentness Reference:</b>
                                <xsl:value-of select="."/>
                            </p>
                        </xsl:for-each>
                    </blockquote>
                </xsl:for-each>
                <xsl:for-each select="srccitea">
                    <p>
                        <b>Source Citation Abbreviation:</b>
                        <xsl:value-of select="."/>
                    </p>
                </xsl:for-each>
                <xsl:for-each select="srccontr">
                    <p>
                        <b>Source Contribution:</b>
                    </p>
                    <p>
                        <xsl:call-template name="replace-newlines">
                            <xsl:with-param name="element" select="."/>
                        </xsl:call-template>
                    </p>
                </xsl:for-each>
            </blockquote>
        </xsl:for-each>
        <xsl:for-each select="procstep">
            <p>
                <b>
                    <i>Process Step:</i>
                </b>
            </p>
            <blockquote>
                <p>
                    <b>Process Description:</b>
                </p>
                <p>
                    <xsl:call-template name="replace-newlines">
                        <xsl:with-param name="element" select="procdesc"/>
                    </xsl:call-template>
                </p>
                <xsl:for-each select="srcused">
                    <p>
                        <b>Source Used Citation Abbreviation:</b>
                    </p>
                    <p>
                        <xsl:call-template name="replace-newlines">
                            <xsl:with-param name="element" select="."/>
                        </xsl:call-template>
                    </p>
                </xsl:for-each>
                <p>
                    <b>Process Date:</b>
                    <xsl:call-template name="date">
                        <xsl:with-param name="element" select="procdate"/>
                    </xsl:call-template>
                </p>
                <xsl:for-each select="proctime">
                    <p>
                        <b>Process Time:</b>
                        <xsl:value-of select="."/>
                    </p>
                </xsl:for-each>
                <xsl:for-each select="srcprod">
                    <p>
                        <b>Source Produced Citation Abbreviation:</b>
                    </p>
                    <p>
                        <xsl:call-template name="replace-newlines">
                            <xsl:with-param name="element" select="."/>
                        </xsl:call-template>
                    </p>
                </xsl:for-each>
                <xsl:for-each select="proccont">
                    <p>
                        <b>Process Contact:</b>
                    </p>
                    <blockquote>
                        <xsl:apply-templates select="cntinfo">
                            <xsl:with-param name="level">
                                <xsl:text>5</xsl:text>
                            </xsl:with-param>
                        </xsl:apply-templates>
                    </blockquote>
                </xsl:for-each>
            </blockquote>
        </xsl:for-each>
    </xsl:template>

    <xsl:template match="cloud">
        <h4 style="display: inline;">Cloud Cover:</h4>
        <p style="display: inline;">
            <xsl:value-of select="."/>
        </p>
    </xsl:template>
</xsl:stylesheet>
