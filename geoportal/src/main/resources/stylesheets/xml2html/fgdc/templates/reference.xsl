<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet
        xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
        version="2.0">
    <xsl:import href="../utils/replace-newlines.xsl"/>
    <xsl:import href="./templates/common.xsl"/>


    <!-- METADATA_REFERENCE_INFORMATION: **************************************-->

    <xsl:template match="metainfo">

        <xsl:apply-templates select="metd"/>
        <xsl:apply-templates select="metrd"/>
        <xsl:apply-templates select="metfrd"/>
        <xsl:apply-templates select="metc"/>
        <xsl:apply-templates select="metstdn"/>
        <xsl:apply-templates select="metstdv"/>
        <xsl:apply-templates select="mettc"/>
        <xsl:apply-templates select="metac"/>
        <xsl:apply-templates select="metuc"/>
        <xsl:apply-templates select="metsi"/>
        <xsl:apply-templates select="metextns"/>
    </xsl:template>

    <xsl:template match="metd">
        <h4 style="display: inline;">Metadata Date:</h4>
        <p style="display: inline;">
            <xsl:call-template name="date">
                <xsl:with-param name="element" select="."/>
            </xsl:call-template>
        </p>
        <p></p>
    </xsl:template>

    <xsl:template match="metrd">
        <h4>Metadata Review Date:</h4>
        <p>
            <xsl:call-template name="date">
                <xsl:with-param name="element" select="."/>
            </xsl:call-template>
        </p>
    </xsl:template>

    <xsl:template match="metfrd">
        <h4>Metadata Future Review Date:</h4>
        <p>
            <xsl:call-template name="date">
                <xsl:with-param name="element" select="."/>
            </xsl:call-template>
        </p>
    </xsl:template>

    <xsl:template match="metc">
        <h4>Metadata Contact:</h4>
        <xsl:apply-templates select="cntinfo">
            <xsl:with-param name="level">
                <xsl:text>5</xsl:text>
            </xsl:with-param>
        </xsl:apply-templates>
    </xsl:template>

    <xsl:template match="metstdn">
        <h4>Metadata Standard Name:</h4>
        <p>
            <xsl:value-of select="."/>
        </p>
    </xsl:template>

    <xsl:template match="metstdv">
        <h4>Metadata Standard Version:</h4>
        <p>
            <xsl:value-of select="."/>
        </p>
    </xsl:template>

    <xsl:template match="mettc">
        <h4 style="display: inline;">Metadata Time Convention:</h4>
        <p style="display: inline;">
            <xsl:value-of select="."/>
        </p>
    </xsl:template>

    <xsl:template match="metac">
        <h4>Metadata Access Constraints:</h4>
        <p>
            <xsl:call-template name="replace-newlines">
                <xsl:with-param name="element" select="."/>
            </xsl:call-template>
        </p>
    </xsl:template>

    <xsl:template match="metuc">
        <h4>Metadata Use Constraints:</h4>
        <p>
            <xsl:call-template name="replace-newlines">
                <xsl:with-param name="element" select="."/>
            </xsl:call-template>
        </p>
    </xsl:template>

    <xsl:template match="metsi">
        <h4>Metadata Security Information:</h4>
        <blockquote>
            <xsl:for-each select="metscs">
                <p>
                    <b>
                        <i>Metadata Security Classification System:</i>
                    </b>
                    <xsl:value-of select="."/>
                </p>
            </xsl:for-each>
            <xsl:for-each select="metsc">
                <p>
                    <b>
                        <i>Metadata Security Classification:</i>
                    </b>
                    <xsl:value-of select="."/>
                </p>
            </xsl:for-each>
            <xsl:for-each select="metshd">
                <p>
                    <b>
                        <i>Metadata Security Handling Description:</i>
                    </b>
                </p>
                <p>
                    <xsl:call-template name="replace-newlines">
                        <xsl:with-param name="element" select="."/>
                    </xsl:call-template>
                </p>
            </xsl:for-each>
        </blockquote>
    </xsl:template>

    <xsl:template match="metextns">
        <h4>Metadata Extensions:</h4>
        <blockquote>
            <xsl:for-each select="onlink">
                <p>
                    <b>
                        <i>Online Linkage:</i>
                    </b>
                    <a href="{.}">
                        <xsl:value-of select="."/>
                    </a>
                </p>
            </xsl:for-each>
            <xsl:for-each select="metprof">
                <p>
                    <b>
                        <i>Profile Name:</i>
                    </b>
                    <xsl:value-of select="."/>
                </p>
            </xsl:for-each>
        </blockquote>
    </xsl:template>
</xsl:stylesheet>