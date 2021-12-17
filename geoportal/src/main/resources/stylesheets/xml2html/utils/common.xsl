<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet
        xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
        version="2.0">


    <!-- NAMED TEMPLATES: *****************************************************-->


    <xsl:template name="elementHeader">
        <xsl:param name="level"/>
        <xsl:param name="heading"/>
        <xsl:choose>
            <xsl:when test="$level = 1">
                <h1>
                    <xsl:attribute name="title">
                        <xsl:call-template name="fullpath"/>
                    </xsl:attribute>
                    <xsl:value-of select="$heading"/>
                </h1>
            </xsl:when>
            <xsl:when test="$level = 2">
                <h2>
                    <xsl:attribute name="title">
                        <xsl:call-template name="fullpath"/>
                    </xsl:attribute>
                    <xsl:value-of select="$heading"/>
                </h2>
            </xsl:when>
            <xsl:when test="$level = 3">
                <h3>
                    <xsl:attribute name="title">
                        <xsl:call-template name="fullpath"/>
                    </xsl:attribute>
                    <xsl:value-of select="$heading"/>
                </h3>
            </xsl:when>
            <xsl:when test="$level = 4">
                <h4>
                    <xsl:attribute name="title">
                        <xsl:call-template name="fullpath"/>
                    </xsl:attribute>
                    <xsl:value-of select="$heading"/>
                </h4>
            </xsl:when>
            <xsl:when test="$level = 5">
                <h5>
                    <xsl:attribute name="title">
                        <xsl:call-template name="fullpath"/>
                    </xsl:attribute>
                    <xsl:value-of select="$heading"/>
                </h5>
            </xsl:when>
            <xsl:otherwise>
                <h6>
                    <xsl:attribute name="title">
                        <xsl:call-template name="fullpath"/>
                    </xsl:attribute>
                    <xsl:value-of select="$heading"/>
                </h6>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>

    <xsl:template name="ciElement">
        <xsl:param name="level"/>
        <xsl:param name="heading"/>
        <xsl:param name="content"/>
        <xsl:param name="isText" select="true()"/>
        <xsl:if test="string-length($content) &gt; 0">
            <div>
                <xsl:call-template name="elementHeader">
                    <xsl:with-param name="level">
                        <xsl:value-of select="$level"/>
                    </xsl:with-param>
                    <xsl:with-param name="heading">
                        <xsl:value-of select="concat($heading, ':')"/>
                    </xsl:with-param>
                </xsl:call-template>
                <div>
                    <xsl:if test="string-length($content) &lt; 60">
                        <xsl:attribute name="class">
                            <xsl:value-of select="'inline'"/>
                        </xsl:attribute>
                    </xsl:if>
                    <xsl:choose>
                        <xsl:when test="$isText">
                            <xsl:value-of select="$content"/>
                        </xsl:when>
                        <xsl:otherwise>
                            <xsl:copy-of select="$content"/>
                        </xsl:otherwise>
                    </xsl:choose>
                </div>
            </div>
        </xsl:if>
    </xsl:template>

    <xsl:template name="fullpath">
        <xsl:for-each select="ancestor-or-self::*">
            <xsl:value-of select="name()"/><xsl:text>/</xsl:text>
        </xsl:for-each>
    </xsl:template>
</xsl:stylesheet>