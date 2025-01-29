<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                version="2.0">

    <xsl:import href="../utils/common.xsl"/>

    <!-- NAMED TEMPLATES: ***************************************************** -->

    <!-- template: citeinfo *************************************************** -->

    <xsl:template match="citeinfo">
        <xsl:param name="level"/>


        <xsl:call-template name="ciElement">
            <xsl:with-param name="level">
                <xsl:value-of select="$level"/>
            </xsl:with-param>
            <xsl:with-param name="heading">
                Originator
            </xsl:with-param>
            <xsl:with-param name="content" select="origin"/>
        </xsl:call-template>

        <xsl:call-template name="ciElement">
            <xsl:with-param name="level">
                <xsl:value-of select="$level"/>
            </xsl:with-param>
            <xsl:with-param name="heading">
                Publication Date
            </xsl:with-param>
            <xsl:with-param name="isText" select="false()"/>
            <xsl:with-param name="content">
                <xsl:call-template name="date">
                    <xsl:with-param name="element" select="pubdate"/>
                </xsl:call-template>
            </xsl:with-param>
        </xsl:call-template>

        <xsl:call-template name="ciElement">
            <xsl:with-param name="level">
                <xsl:value-of select="$level"/>
            </xsl:with-param>
            <xsl:with-param name="heading">
                Title
            </xsl:with-param>
            <xsl:with-param name="content" select="title"/>
        </xsl:call-template>

        <xsl:call-template name="ciElement">
            <xsl:with-param name="level">
                <xsl:value-of select="$level"/>
            </xsl:with-param>
            <xsl:with-param name="heading">
                Edition
            </xsl:with-param>
            <xsl:with-param name="content" select="edition"/>
        </xsl:call-template>

        <xsl:call-template name="ciElement">
            <xsl:with-param name="level">
                <xsl:value-of select="$level"/>
            </xsl:with-param>
            <xsl:with-param name="heading">
                Geospatial Data Presentation Form
            </xsl:with-param>
            <xsl:with-param name="content" select="geoform"/>
        </xsl:call-template>

        <xsl:if
                test="string-length( serinfo/sername ) or string-length( serinfo/issue )">

            <xsl:call-template name="ciElement">
                <xsl:with-param name="level">
                    <xsl:value-of select="$level"/>
                </xsl:with-param>
                <xsl:with-param name="heading">
                    Series Information
                </xsl:with-param>
                <xsl:with-param name="isText" select="false()"/>
                <xsl:with-param name="content">

                    <b>Series Name:</b>
                    <xsl:value-of select="serinfo/sername"/>
                    <br/>
                    <b>Issue Identification:</b>
                    <xsl:value-of select="serinfo/issue"/>
                    <br/>

                </xsl:with-param>
            </xsl:call-template>
        </xsl:if>


        <xsl:if
                test="string-length( pubinfo/pubplace ) or string-length( pubinfo/publish )">
            <xsl:call-template name="ciElement">
                <xsl:with-param name="level">
                    <xsl:value-of select="$level"/>
                </xsl:with-param>
                <xsl:with-param name="heading">
                    Publication Information
                </xsl:with-param>
                <xsl:with-param name="isText" select="false()"/>
                <xsl:with-param name="content">

                    <b>Publication Place:</b>
                    <xsl:value-of select="pubinfo/pubplace"/>
                    <br/>
                    <b>Publisher:</b>
                    <xsl:value-of select="pubinfo/publish"/>
                    <br/>

                </xsl:with-param>
            </xsl:call-template>

        </xsl:if>
        <xsl:if test="string-length( onlink )">
            <xsl:call-template name="ciElement">
                <xsl:with-param name="level">
                    <xsl:value-of select="$level"/>
                </xsl:with-param>
                <xsl:with-param name="heading">
                    Online Linkage
                </xsl:with-param>
                <xsl:with-param name="isText" select="false()"/>
                <xsl:with-param name="content">

                    <a href="{onlink}">
                        <xsl:value-of select="onlink"/>
                    </a>

                </xsl:with-param>
            </xsl:call-template>
        </xsl:if>

    </xsl:template>

    <!-- template: cntinfo **************************************************** -->

    <xsl:template match="cntinfo">
        <xsl:param name="level"/>

        <div class="contactInfo">
            <xsl:for-each
                    select="cntorgp/cntper | cntorgp/cntorg | cntperp/cntper | cntperp/cntorg">
                <xsl:value-of select="."/>
                <xsl:if test="position() != last()">
                    <xsl:text>, </xsl:text>
                </xsl:if>
            </xsl:for-each>

            <div class="address">
                <xsl:for-each select="cntaddr">
                    <xsl:call-template name="cntaddr">
                        <xsl:with-param name="level">
                            <xsl:value-of select="$level"/>
                        </xsl:with-param>
                    </xsl:call-template>
                </xsl:for-each>
            </div>

            <div class="phone">
                <xsl:call-template name="contactphone">
                    <xsl:with-param name="level">
                        <xsl:value-of select="$level"/>
                    </xsl:with-param>
                </xsl:call-template>
            </div>

        </div>


    </xsl:template>

    <xsl:template name="cntaddr">
        <xsl:param name="level"/>


        <xsl:call-template name="ciElement">
            <xsl:with-param name="level">
                <xsl:value-of select="$level"/>
            </xsl:with-param>
            <xsl:with-param name="heading">
                Address Type
            </xsl:with-param>
            <xsl:with-param name="content" select="addrtype"/>
        </xsl:call-template>


        <xsl:if test="string-length( address )">
            <div>
                <xsl:value-of select="address"/>
            </div>
        </xsl:if>
        <xsl:if
                test="string-length( city ) or string-length( state ) or string-length( postal )">
            <div>
                <xsl:value-of select="city"/>
                <xsl:text>, </xsl:text>
                <xsl:value-of select="state"/>
                <xsl:text disable-output-escaping="yes">&amp;nbsp;</xsl:text>
                <xsl:value-of select="postal"/>
            </div>
        </xsl:if>

        <xsl:if test="string-length( country )">
            <div>
                <xsl:value-of select="country"/>
            </div>
        </xsl:if>

    </xsl:template>

    <xsl:template name="contactphone">
        <xsl:param name="level"/>

        <xsl:if test="string-length( cntemail )">
            <div>
                <a href="mailto:{cntemail}">
                    <xsl:value-of select="cntemail"/>
                </a>
            </div>
        </xsl:if>

        <xsl:for-each select="cntvoice">
            <xsl:if test="string-length( . )">
                <xsl:value-of select="."/>
            </xsl:if>
        </xsl:for-each>
        <xsl:for-each select="cntfax">
            <xsl:if test="string-length( . )">
                <xsl:call-template name="ciElement">
                    <xsl:with-param name="level">
                        <xsl:value-of select="$level + 1"/>
                    </xsl:with-param>
                    <xsl:with-param name="heading">
                        Fax
                    </xsl:with-param>
                    <xsl:with-param name="content" select="."/>
                </xsl:call-template>
            </xsl:if>
        </xsl:for-each>

    </xsl:template>

    <!-- template: timeinfo ************************************************** -->

    <xsl:template name="timeinfo">
        <xsl:param name="element"/>
        <xsl:param name="italicize-heading"/>
        <xsl:choose>
            <xsl:when test="$italicize-heading">
                <p>
                    <b>
                        <i>Time Period Information:</i>
                    </b>
                </p>
            </xsl:when>
            <xsl:otherwise>
                <p>
                    <b>Time Period Information:</b>
                </p>
            </xsl:otherwise>
        </xsl:choose>
        <blockquote>
            <p>
                <b>Range of Dates/Times:</b>
            </p>
            <blockquote>
                <p>
                    <b>Beginning Date:</b>
                    <xsl:call-template name="date">
                        <xsl:with-param name="element" select="$element/rngdates/begdate"/>
                    </xsl:call-template>
                    <br/>
                    <b>Ending Date:</b>
                    <xsl:call-template name="date">
                        <xsl:with-param name="element" select="$element/rngdates/enddate"/>
                    </xsl:call-template>
                </p>
            </blockquote>
        </blockquote>
    </xsl:template>

    <!-- template: date ****************************************************** -->

    <xsl:template name="date">
        <xsl:param name="element"/>
        <xsl:choose>
            <xsl:when test="contains( $element, 'known' )">
                <xsl:value-of select="$element"/>
            </xsl:when>
            <xsl:otherwise>
                <xsl:variable name="year" select="substring($element, 1, 4)"/>
                <xsl:variable name="month" select="substring($element, 5, 2)"/>
                <xsl:variable name="day" select="substring($element, 7, 2)"/>
                <xsl:if test="$month = '01'">
                    <xsl:text>January </xsl:text>
                </xsl:if>
                <xsl:if test="$month = '02'">
                    <xsl:text>February </xsl:text>
                </xsl:if>
                <xsl:if test="$month = '03'">
                    <xsl:text>March </xsl:text>
                </xsl:if>
                <xsl:if test="$month = '04'">
                    <xsl:text>April </xsl:text>
                </xsl:if>
                <xsl:if test="$month = '05'">
                    <xsl:text>May </xsl:text>
                </xsl:if>
                <xsl:if test="$month = '06'">
                    <xsl:text>June </xsl:text>
                </xsl:if>
                <xsl:if test="$month = '07'">
                    <xsl:text>July </xsl:text>
                </xsl:if>
                <xsl:if test="$month = '08'">
                    <xsl:text>August </xsl:text>
                </xsl:if>
                <xsl:if test="$month = '09'">
                    <xsl:text>September </xsl:text>
                </xsl:if>
                <xsl:if test="$month = '10'">
                    <xsl:text>October </xsl:text>
                </xsl:if>
                <xsl:if test="$month = '11'">
                    <xsl:text>November </xsl:text>
                </xsl:if>
                <xsl:if test="$month = '12'">
                    <xsl:text>December </xsl:text>
                </xsl:if>
                <xsl:if test="string-length( $day )">
                    <xsl:choose>
                        <xsl:when test="$day = '01'">
                            <xsl:variable name="daydisplay" select="'1'"/>
                            <xsl:value-of select="$daydisplay"/>
                            <xsl:text>, </xsl:text>
                        </xsl:when>
                        <xsl:when test="$day = '02'">
                            <xsl:variable name="daydisplay" select="'2'"/>
                            <xsl:value-of select="$daydisplay"/>
                            <xsl:text>, </xsl:text>
                        </xsl:when>
                        <xsl:when test="$day = '03'">
                            <xsl:variable name="daydisplay" select="'3'"/>
                            <xsl:value-of select="$daydisplay"/>
                            <xsl:text>, </xsl:text>
                        </xsl:when>
                        <xsl:when test="$day = '04'">
                            <xsl:variable name="daydisplay" select="'4'"/>
                            <xsl:value-of select="$daydisplay"/>
                            <xsl:text>, </xsl:text>
                        </xsl:when>
                        <xsl:when test="$day = '05'">
                            <xsl:variable name="daydisplay" select="'5'"/>
                            <xsl:value-of select="$daydisplay"/>
                            <xsl:text>, </xsl:text>
                        </xsl:when>
                        <xsl:when test="$day = '06'">
                            <xsl:variable name="daydisplay" select="'6'"/>
                            <xsl:value-of select="$daydisplay"/>
                            <xsl:text>, </xsl:text>
                        </xsl:when>
                        <xsl:when test="$day = '07'">
                            <xsl:variable name="daydisplay" select="'7'"/>
                            <xsl:value-of select="$daydisplay"/>
                            <xsl:text>, </xsl:text>
                        </xsl:when>
                        <xsl:when test="$day = '08'">
                            <xsl:variable name="daydisplay" select="'8'"/>
                            <xsl:value-of select="$daydisplay"/>
                            <xsl:text>, </xsl:text>
                        </xsl:when>
                        <xsl:when test="$day = '09'">
                            <xsl:variable name="daydisplay" select="'9'"/>
                            <xsl:value-of select="$daydisplay"/>
                            <xsl:text>, </xsl:text>
                        </xsl:when>
                        <xsl:otherwise>
                            <xsl:value-of select="$day"/>
                            <xsl:text>, </xsl:text>
                        </xsl:otherwise>
                    </xsl:choose>
                </xsl:if>
                <xsl:value-of select="$year"/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
</xsl:stylesheet>