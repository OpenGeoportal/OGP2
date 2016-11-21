<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                version="2.0">

    <xsl:import href="../../utils/replace-newlines.xsl"/>
    <xsl:import href="../../utils/replace-string.xsl"/>
    <xsl:import href="common.xsl"/>

    <!-- DISTRIBUTION_INFORMATION: ******************************************** -->

    <xsl:template match="distinfo">
        <xsl:apply-templates select="distrib"/>
        <xsl:apply-templates select="resdesc"/>
        <xsl:apply-templates select="distliab"/>
        <xsl:apply-templates select="stdorder"/>

    </xsl:template>

    <xsl:template match="distrib">
        <h4>Distributor:</h4>
        <xsl:apply-templates select="cntinfo">
            <xsl:with-param name="level">
                <xsl:text>5</xsl:text>
            </xsl:with-param>
        </xsl:apply-templates>
    </xsl:template>

    <xsl:template match="resdesc">
        <xsl:if test="string-length( . )">
            <h4>Resource Description:</h4>
            <p>
                <xsl:value-of select="."/>
            </p>
        </xsl:if>
    </xsl:template>

    <xsl:template match="distliab">
        <xsl:if test="string-length( . ) and not( contains( ., 'Unknown' ) )">
            <h4>Distribution Liability:</h4>
            <p>
                <xsl:call-template name="replace-newlines">
                    <xsl:with-param name="element" select="."/>
                </xsl:call-template>
            </p>
        </xsl:if>
    </xsl:template>

    <xsl:template match="stdorder">
        <xsl:if test="string-length( fees )">
            <h4>Standard Order Process:</h4>
            <xsl:apply-templates select="digform"/>
            <p>
                <b>
                    <i>Fees:</i>
                </b>
                <xsl:value-of select="fees"/>
            </p>
            <xsl:if test="string-length( ordering )">
                <p>
                    <b>
                        <i>Ordering Instructions:</i>
                    </b>
                    <xsl:value-of select="ordering"/>
                </p>
            </xsl:if>
        </xsl:if>
    </xsl:template>

    <xsl:template match="digform">
        <p>
            <b>
                <i>Digital Form:</i>
            </b>
        </p>
        <blockquote>
            <xsl:apply-templates select="digtinfo"/>
            <xsl:apply-templates select="digtopt"/>
        </blockquote>
    </xsl:template>

    <xsl:template match="digtinfo">
        <p>
            <b>Digital Transfer Information:</b>
        </p>
        <blockquote>
            <p>
                <b>Format Name:</b>
                <xsl:value-of select="formname"/>
            </p>
            <xsl:for-each select="formvern">
                <p>
                    <b>Format Version Number:</b>
                    <xsl:value-of select="."/>
                </p>
            </xsl:for-each>
            <xsl:for-each select="formverd">
                <p>
                    <b>Format Version Date:</b>
                    <xsl:call-template name="date">
                        <xsl:with-param name="element" select="."/>
                    </xsl:call-template>
                </p>
            </xsl:for-each>
            <xsl:for-each select="formspec">
                <p>
                    <b>Format Specification:</b>
                </p>
                <p>
                    <xsl:call-template name="replace-newlines">
                        <xsl:with-param name="element" select="."/>
                    </xsl:call-template>
                </p>
            </xsl:for-each>
            <xsl:for-each select="asciistr">
                <p>
                    <b>ASCII File Structure:</b>
                </p>
                <blockquote>
                    <xsl:for-each select="recdel">
                        <p>
                            <b>Record Delimiter:</b>
                            <xsl:value-of select="."/>
                        </p>
                    </xsl:for-each>
                    <xsl:for-each select="numheadl">
                        <p>
                            <b>Number Header Lines:</b>
                            <xsl:value-of select="."/>
                        </p>
                    </xsl:for-each>
                    <xsl:for-each select="deschead">
                        <p>
                            <b>Description of Header Content:</b>
                        </p>
                        <p>
                            <xsl:call-template name="replace-newlines">
                                <xsl:with-param name="element" select="."/>
                            </xsl:call-template>
                        </p>
                    </xsl:for-each>
                    <xsl:for-each select="orienta">
                        <p>
                            <b>Orientation:</b>
                            <xsl:value-of select="."/>
                        </p>
                    </xsl:for-each>
                    <xsl:for-each select="casesens">
                        <p>
                            <b>Case Sensitive:</b>
                            <xsl:value-of select="."/>
                        </p>
                    </xsl:for-each>
                    <xsl:for-each select="authent">
                        <p>
                            <b>Authentication:</b>
                        </p>
                        <p>
                            <xsl:call-template name="replace-newlines">
                                <xsl:with-param name="element" select="."/>
                            </xsl:call-template>
                        </p>
                    </xsl:for-each>
                    <xsl:for-each select="quotech">
                        <p>
                            <b>Quote Character:</b>
                            <xsl:value-of select="."/>
                        </p>
                    </xsl:for-each>
                    <xsl:for-each select="datafiel">
                        <p>
                            <b>Data Field:</b>
                        </p>
                        <blockquote>
                            <p>
                                <b>Data Field Name:</b>
                                <xsl:value-of select="dfieldnm"/>
                            </p>
                            <xsl:for-each select="missingv">
                                <p>
                                    <b>Missing Value Code:</b>
                                    <xsl:value-of select="."/>
                                </p>
                            </xsl:for-each>
                            <xsl:for-each select="dfwidthd">
                                <p>
                                    <b>Data Field Width Delimiter:</b>
                                    <xsl:value-of select="."/>
                                </p>
                            </xsl:for-each>
                            <xsl:for-each select="dfwidth">
                                <p>
                                    <b>Data Field Width:</b>
                                    <xsl:value-of select="."/>
                                </p>
                            </xsl:for-each>
                        </blockquote>
                    </xsl:for-each>
                </blockquote>
            </xsl:for-each>
            <xsl:for-each select="formcont">
                <p>
                    <b>Format Information Content:</b>
                </p>
                <p>
                    <xsl:call-template name="replace-newlines">
                        <xsl:with-param name="element" select="."/>
                    </xsl:call-template>
                </p>
            </xsl:for-each>
            <xsl:for-each select="filedec">
                <p>
                    <b>File Decompression Technique:</b>
                    <xsl:value-of select="."/>
                </p>
            </xsl:for-each>
            <xsl:for-each select="transize">
                <p>
                    <b>Transfer Size:</b>
                    <xsl:value-of select="."/>
                    MB
                </p>
            </xsl:for-each>
        </blockquote>
    </xsl:template>

    <xsl:template match="digtopt">
        <font color="#6e6e6e">
            <p>
                <b>Digital Transfer Option:</b>
            </p>
            <blockquote>
                <p>
                    <b>Online Option:</b>
                </p>
                <blockquote>
                    <p>
                        <b>Computer Contact Information:</b>
                    </p>
                    <blockquote>
                        <p>
                            <b>Network Address:</b>
                        </p>
                        <blockquote>
                            <xsl:variable name="url">
                                <!-- Replace PacIOOS internal URL with external proxy: -->
                                <xsl:call-template name="replace-string">
                                    <xsl:with-param name="element"
                                                    select="onlinopt/computer/networka/networkr"/>
                                    <xsl:with-param name="old-string">
                                        lawelawe.soest.hawaii.edu:8080
                                    </xsl:with-param>
                                    <xsl:with-param name="new-string">
                                        oos.soest.hawaii.edu
                                    </xsl:with-param>
                                </xsl:call-template>
                            </xsl:variable>
                            <span style="float: left; margin-right: 4px;">
                                <b>Network Resource Name:</b>
                            </span>
                            <a href="{$url}">
                                <div class="wrapline">
                                    <xsl:value-of select="$url"/>
                                </div>
                            </a>
                            <!--<div class="wrapline"><b>Network Resource Name: </b><a href="{$url}"><xsl:value-of
                                select="$url"/></a></p> -->
                        </blockquote>
                    </blockquote>
                </blockquote>
            </blockquote>
        </font>
    </xsl:template>
</xsl:stylesheet>