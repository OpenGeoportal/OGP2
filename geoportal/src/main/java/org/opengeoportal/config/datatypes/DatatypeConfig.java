package org.opengeoportal.config.datatypes;

/**
 * object to contain info about datatypes needed by the client
 *
 * @author cbarne02
 */
public class DatatypeConfig {
    /*	<datatype selected="true">
        <value>
            Point
        </value>
        <displayName>
            Point
        </displayName>
        <uiClass>
            pointIcon
        </uiClass>
    </datatype>,*/
    String value;
    String displayName;
    String iconClass;
    Boolean selected;


    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getIconClass() {
        return iconClass;
    }

    public void setIconClass(String iconClass) {
        this.iconClass = iconClass;
    }

    public Boolean getSelected() {
        return selected;
    }

    public void setSelected(Boolean selected) {
        this.selected = selected;
    }


}
