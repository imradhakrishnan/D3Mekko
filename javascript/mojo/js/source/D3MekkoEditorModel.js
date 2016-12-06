(function () {
    if (!mstrmojo.plugins.D3Mekko) {
        mstrmojo.plugins.D3Mekko = {};
    }

    mstrmojo.requiresCls(
        "mstrmojo.vi.models.editors.CustomVisEditorModel",
        "mstrmojo.array"
    );

    var $WT = mstrmojo.vi.models.editors.CustomVisEditorModel.WIDGET_TYPE;

    mstrmojo.plugins.D3Mekko.D3MekkoEditorModel = mstrmojo.declare(
        mstrmojo.vi.models.editors.CustomVisEditorModel,
        null,
        {
            scriptClass: "mstrmojo.plugins.D3Mekko.D3MekkoEditorModel",
            cssClass: "d3mekkoeditormodel",
            getCustomProperty: function getCustomProperty() {
                var myViz = this.getHost();
                var model = new mstrmojo.models.template.DataInterface(myViz.model.data);
                var isThreshold = model.data.th[0] && model.data.th[0].length > 0 ? true : false;

                if (myViz.zonesModel && myViz.zonesModel.getDropZones().zones[5].items[0]) {
                    if (model.getRowHeaders(2).getHeader(2)) {
                        var colorByValues = model.getRowHeaders(2).getHeader(2).t.es;
                    }
                }
                else {
                    if (model.getRowHeaders(2).getHeader(1)) {
                        var colorByValues = model.getRowHeaders(2).getHeader(1).t.es;
                    }
                }
                if (model.getRowHeaders(2).getHeader(0)) {
                    var animateByValues = model.getRowHeaders(2).getHeader(0).t.es;
                }
                var attElementID, fillColorObj, animateObj, isInc, frame, isDefaultSpeed = true;
                return [
                    {
                        name: "Mekko Chart",
                        value: [
                            {
                                style: $WT.EDITORGROUP,
                                items: [
                                    {
                                        style: $WT.LABEL,
                                        labelText: "Color Formatting"
                                    },
                                    {
                                        style: $WT.PULLDOWN,
                                        propertyName: "colorBy",
                                        disabled: isThreshold,
                                        items: (function () {
                                            var pullDownValues = [
                                                {
                                                    name: "-Select an attribute element-",
                                                    value: "All"
                                                }
                                            ];
                                            for (var i = 0; colorByValues && i < colorByValues.length; i++) {
                                                pullDownValues.push(
                                                    {
                                                        name: colorByValues[i].n,
                                                        value: i.toString()
                                                    }
                                                );
                                            }
                                            return pullDownValues;
                                        })(),
                                        config: {
                                            suppressData: true,
                                            onPropertyChange: function (propertyName, newValue) {
                                                if (newValue) {
                                                    attElementID = newValue;
                                                }
                                                return {};
                                            },
                                            callback: function () {
                                                if (attElementID !== "All")
                                                    myViz.setFillColors(attElementID);
                                            }
                                        }
                                    },
                                    {
                                        style: $WT.TWOCOLUMN,
                                        items: [
                                            {
                                                style: $WT.LABEL,
                                                width: "20%",
                                                labelText: "Fill:"
                                            },
                                            {
                                                style: $WT.FILLGROUP,
                                                width: "80%",
                                                propertyName: "fillColor",
                                                disabled: isThreshold ? true : (myViz.getProperty("colorBy") && myViz.getProperty("colorBy") !== "All" ? false : true),
                                                config: {
                                                    suppressData: true,
                                                    onPropertyChange: function (propertyName, newValue) {
                                                        if (newValue) {
                                                            fillColorObj = newValue;
                                                        }
                                                        return {};
                                                    },
                                                    callback: function () {
                                                        if (myViz.getProperty("colorBy") !== "All") {
                                                            myViz.setColorsVar(fillColorObj);
                                                            myViz.refresh();
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                style: $WT.EDITORGROUP,
                                items: [
                                    {
                                        style: $WT.LABEL,
                                        labelText: "Animation"
                                    },
                                    {
                                        style: $WT.BUTTONBAR,
                                        propertyName: "animate",
                                        items: [
                                            {
                                                labelText: "Start",
                                                propertyName: "start"
                                            },
                                            {
                                                labelText: "Stop",
                                                propertyName: "stop"
                                            }
                                        ],
                                        config: {
                                            suppressData: true,
                                            onPropertyChange: function (propertyName, newValue) {
                                                if (newValue) {
                                                    animateObj = newValue;
                                                }
                                                return {};
                                            },
                                            callback: function () {
                                                if (animateObj.start === "true")
                                                    myViz.refresh();
                                                else
                                                    myViz.play(animateObj);
                                            }
                                        },
                                        multiSelect: false
                                    },
                                    /*  This code can be uncommented to set speed of animation through custom properties.
                                     {
                                     style: $WT.TWOCOLUMN,
                                     items: [
                                     {
                                     style: $WT.LABEL,
                                     width: "20%",
                                     labelText: "Speed:"
                                     },
                                     {
                                     style: $WT.BUTTONBAR,
                                     width: "80%",
                                     propertyName: "speed",
                                     items: [
                                     {
                                     labelText: "+",
                                     propertyName: "inc"
                                     },
                                     {
                                     labelText: "-",
                                     propertyName: "dec"
                                     }
                                     ],
                                     config: {
                                     suppressData: true,
                                     onPropertyChange: function (propertyName, newValue) {
                                     if (newValue.inc === "true") {
                                     isInc = true;
                                     }
                                     return {};
                                     },
                                     callback: function () {
                                     myViz.setSpeed(isInc);
                                     myViz.refresh();
                                     }
                                     },
                                     multiSelect: false
                                     }
                                     ]
                                     },
                                     {
                                     style: $WT.CHECKBOXANDLABEL,
                                     propertyName: "defaultspeed",
                                     labelText: "Set Default Speed",
                                     config: {
                                     suppressData: true,
                                     onPropertyChange: function (propertyName, newValue) {
                                     if (newValue === "true") {
                                     isDefaultSpeed = true;
                                     }
                                     return {};
                                     },
                                     callback: function () {
                                     if (isDefaultSpeed === true) {
                                     myViz.setDefaultSpeed();
                                     myViz.refresh();
                                     }
                                     }
                                     }
                                     },*/
                                    {
                                        style: $WT.TWOCOLUMN,
                                        items: [
                                            {
                                                style: $WT.LABEL,
                                                width: "20%",
                                                labelText: "Go To:"
                                            },
                                            {
                                                style: $WT.PULLDOWN,
                                                propertyName: "Frame",
                                                items: (function () {
                                                    var attElem = [];
                                                    for (var i = 0; animateByValues && i < animateByValues.length; i++) {
                                                        attElem.push(
                                                            {
                                                                name: animateByValues[i].n,
                                                                value: animateByValues[i].n
                                                            }
                                                        );
                                                    }
                                                    return attElem;
                                                })(),
                                                config: {
                                                    suppressData: true,
                                                    onPropertyChange: function (propertyName, newValue) {
                                                        if (newValue) {
                                                            frame = newValue;
                                                        }
                                                        return {};
                                                    },
                                                    callback: function () {
                                                        myViz.goToFrame(frame);
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]

            }
        })
}());
//@ sourceURL=D3MekkoEditorModel.js