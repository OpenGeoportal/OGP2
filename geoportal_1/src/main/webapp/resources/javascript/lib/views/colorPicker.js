/**
 * Created by cbarne02 on 6/4/15.
 */

if (typeof OpenGeoportal === 'undefined') {
    OpenGeoportal = {};
} else if (typeof OpenGeoportal !== "object") {
    throw new Error("OpenGeoportal already exists and is not an object");
}

if (typeof OpenGeoportal.Views === 'undefined') {
    OpenGeoportal.Views = {};
} else if (typeof OpenGeoportal.Views !== "object") {
    throw new Error("OpenGeoportal.Views already exists and is not an object");
}

OpenGeoportal.Views.ColorPicker = Backbone.View.extend({
    tagName: "div",
    events: {
        "click .colorCell": "selectColorCell",
        "keydown .colorCell": "checkKeypress",
        "mouseover .colorCell": "setFocus",
        "focusout": "closeOnLoseFocus"
    },
    initialize: function () {
        this.render();
    },

    render: function () {

        var colors = [
            ["#828282", "#aaaaaa", "#b2b2b2", "#cccccc", "#e1e1e1",
                "#ffffff"],
            ["#730000", "#a80000", "#e80000", "#ff0000", "#ff7f7f",
                "#ffbebe"],
            ["#732600", "#a83800", "#e64c00", "#ff5500", "#ffa77f",
                "#ffebbe"],
            ["#734c00", "#a87000", "#e69800", "#ffaa00", "#ffd37f",
                "#ffebaf"],
            ["#737300", "#a8a800", "#e6e600", "#ffff00", "#ffff73",
                "#ffffbe"],
            ["#426e00", "#6da800", "#98e600", "#aaff00", "#d1ff73",
                "#e9ffbe"],
            ["#267300", "#38a800", "#4ce600", "#55ff00", "#a3ff73",
                "#d3ffbe"],
            ["#00734c", "#00a884", "#00e6a9", "#00ffc5", "#73ffdf",
                "#beffe8"],
            ["#004c73", "#0084a8", "#00a9e6", "#00c5ff", "#73dfff",
                "#bee8ff"],
            ["#002673", "#0049a9", "#005ce6", "#0070ff", "#73b2ff",
                "#bed2ff"],
            ["#4c0073", "#8400a8", "#a900e6", "#c500ff", "#df73ff",
                "#e8beff"],
            ["#780f52", "#a80084", "#e00fa7", "#ff00c5", "#ff73df",
                "#ffbee8"]

        ];

        var currentColorSelection = this.model.get("color");

        var colorRow = function (row) {
            var colorRow = ['<tr>'];
            _.each(row, function (color) {

                var selectionClass;
                if (color == currentColorSelection) {
                    selectionClass = " colorCellSelected";
                } else {
                    selectionClass = "";
                }

                var colorCell = ['<td class="colorCellParent">',
                    '<div class="colorCell' + selectionClass + '" tabindex="0" style="background-color:' + color + '"></div>',
                    '</td>'].join('\n');
                colorRow.push(colorCell);
            });

            colorRow.push('</tr>');
            return colorRow.join('\n');
        };

        var colorTable = function (colors) {

            var colorTable = ['<table><tbody>'];

            _.each(colors, function (row) {
                colorTable.push(colorRow(row));
            });

            colorTable.push('</tbody></table>');

            return colorTable.join('\n');
        };

        this.$el.html(colorTable(colors));

        return this;
    },

    checkKeypress: function (event) {
        var code = event.keyCode || event.which;
        if (code === 13) {
            this.doSelection($(event.target));
        } else if (code === 27) {
            this.close();
        }
    },

    setFocus: function (event) {
        $(event.target).focus();
    },

    closeOnLoseFocus: function (event) {
        var that = this;
        var closeIfNotChild = function () {
            if (!$.contains(that.el, document.activeElement)) {
                that.close();
            }
        };
        setTimeout(closeIfNotChild, 1);

    },

    close: function () {
        this.model.set({colorPickerOn: false});
    },

    selectColorCell: function (event) {
        this.doSelection($(event.target));
    },

    doSelection: function ($cell) {
        var selectedColor = $cell.css("background-color");
        if (selectedColor.indexOf("rgb") > -1) {
            selectedColor = OpenGeoportal.Utility.rgb2hex(selectedColor);
        }
        this.model.set({
            color: selectedColor
        }); // here's where things happen
        this.$el.find('.colorCell').removeClass('colorCellSelected');
        $cell.addClass('colorCellSelected');
    }
});
