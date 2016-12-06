(function () {
    if (!mstrmojo.plugins.D3Mekko) {
        mstrmojo.plugins.D3Mekko = {};
    }

    mstrmojo.requiresCls(
        "mstrmojo.CustomVisBase",
        "mstrmojo.models.template.DataInterface"
    );
    var colors = []; //to store colors of rect
    var colorby = {}; //to store color by attribute elements
    var properties; //global var to store custom properties to be used in plot and call back functions
    var myStoryBoard; //to store the animation object from library - used in plot and call back functions
    var mySeries; //to store the series attribute object from library - used in plot and call back functions
    var animateSpeed = 3000; //Default transition speed in milliSec for animation
    var incOrDecSpeed = 100; //Increase or Decrease speed by this constant
    var transitionInMilliSec = animateSpeed;
    mstrmojo.plugins.D3Mekko.D3Mekko = mstrmojo.declare(
        mstrmojo.CustomVisBase,
        null,
        {
            scriptClass: "mstrmojo.plugins.D3Mekko.D3Mekko",
            cssClass: "d3mekko",
            errorMessage: "Either there is not enough data to display the visualization or the visualization configuration is incomplete.",
            errorDetails: "This visualization requires one or more attributes and one metric.",
            externalLibraries: [{url: "//d3js.org/d3.v3.min.js"}, {url: "//dimplejs.org/dist/dimple.v2.1.6.min.js"}],
            useRichTooltip: false,
            reuseDOMNode: false,
            setFillColors: function setFillColors(attElementID) {
                if (this.getProperty("colorBy")) {
                    properties["fillColor"] = {
                        fillColor: colors[+attElementID].fill,
                        fillAlpha: colors[+attElementID].opacity * 100
                    };
                }
            },
            setColorsVar: function setColorsVar(fillColorObj) {
                if (colors) {
                    colors[+properties["colorBy"]].fill = fillColorObj.fillColor;
                    if (fillColorObj.fillAlpha) {
                        colors[+properties["colorBy"]].opacity = +fillColorObj.fillAlpha / 100;
                    }
                }
            },
            play: function play(animateObj) {
                if (this.getProperty("animate").stop === "true") {
                    myStoryBoard.stopAnimation();
                }
            },
            setSpeed: function setSpeed(isInc) {
                if (isInc) {
                    if (transitionInMilliSec) {
                        transitionInMilliSec += incOrDecSpeed;
                    }
                    else {
                        transitionInMilliSec -= incOrDecSpeed;
                    }
                }
                properties["speed"] = {inc: 'false', dec: 'false'};
                properties["defaultspeed"] = "false";
            },
            setDefaultSpeed: function setDefaultSpeed() {
                transitionInMilliSec = animateSpeed;
            },
            goToFrame: function goToFrame(frame) {
                if (myStoryBoard) {
                    myStoryBoard.goToFrame(frame);
                    if (properties["animate"]) {
                        properties["animate"] = {start: "false", stop: "true"};
                    }
                    else {
                        this.setDefaultPropertyValues({
                            animate: {start: "false", stop: "true"}
                        });
                    }
                    myStoryBoard.stopAnimation();
                }
            },
            plot: function () {
                /*
                 Originally created by Radha Krishnan Vinayagam on 8/2/2016.
                 Wiki for Dimple library is available at: https://github.com/PMSI-AlignAlytics/dimple/wiki
                 */

                var me = this;
                var is10point3 = typeof this.addThresholdMenuItem === 'function'; //true if it's MSTR 10.3 or above
                var isDocument = typeof me.zonesModel === "undefined";  //true if it's a document
                var total_width = parseInt(me.width, 10);
                var total_height = parseInt(me.height, 10);
                var margin = {top: 50, right: 40, bottom: 40, left: 60};
                var legendPos = {
                    x: 240,
                    y: 10,
                    width: (total_width - margin.right - margin.left),
                    height: 20,
                    align: "left"
                }; //Increase the width to see more elements in legend
                var selectedRect; //to store the current rect selected by the user
                var selectedStrokeWidth = "4"; //if a rect is selected, inc its stroke width
                var dataConfig = {hasSelection: true}; //parameter to be passed to dataInterface API while importing data

                if (is10point3) {
                    me.setDefaultPropertyValues({
                        animate: {start: "true", stop: "false"},
                        defaultspeed: "true"
                    });
                    me.addThresholdMenuItem(); // to enable thresholding option for metric
                    dataConfig.hasThreshold = true;
                    properties = me.getProperties(); //reference to custom properties
                }
                me.addUseAsFilterMenuItem(); //to use this visualization as a filter or selector
                //with rawDRows - get the rows in almost a flat JSON format, some modifications will be necessary before passing to library
                var rawDRows = me.dataInterface.getRawData(mstrmojo.models.template.DataInterface.ENUM_RAW_DATA_FORMAT.ROWS);
                var model; //var to store data model created from zonesModel (drop zones)
                if (is10point3 && !isDocument) {
                    model = new mstrmojo.models.template.DataInterface(me.model.data);
                }
                var rawD = me.dataInterface.getRawData(mstrmojo.models.template.DataInterface.ENUM_RAW_DATA_FORMAT.ADV, dataConfig); //to get the data along with attribute selector and threshold info
                var dateIndexMap = {}; //map of animate attribute element and its original index in dataInterface
                for (var i = 0; i < rawD.children.length; i++) {
                    dateIndexMap[rawD.children[i].name] = i;
                }
                var seriesIndexMap = {}; //map of series attribute element and its original index in dataInterface
                for (var i = 0; i < rawD.children[0].children.length; i++) {
                    seriesIndexMap[rawD.children[0].children[i].name] = i;
                }


                var dataS = []; //data to be passed to the Dimple library

                //to populate dataS var - flattening the data to make it usable with the library
                for (var i = 0; i < rawDRows.length; i++) {
                    var object = rawDRows[i];
                    for (var name in object) {
                        if (typeof object[name] === "object")
                            object[name] = object[name].v;
                    }
                    dataS.push(object);
                }


                var rowTitles = me.dataInterface.getRowTitles();
                var colTitles = me.dataInterface.getColTitles();
                //If we are using in document, since drop zones are not available, get the attribute names from dataInterface API..
                // In case of dashboard, use the zonesModel to get the correct attribute names from each drop zone.
                var date;
                if (me.zonesModel && me.zonesModel.getDropZones().zones[0].items[0]) {
                    date = me.zonesModel.getDropZones().zones[0].items[0].n;
                }


                var series = me.zonesModel ? me.zonesModel.getDropZones().zones[1].items[0].n : rowTitles.titles[1].n;

                var groupby = [];
                if (!isDocument) {
                    for (var i = 0; i < me.zonesModel.getDropZones().zones[2].items.length; i++) {
                        groupby.push(me.zonesModel.getDropZones().zones[2].items[i].n);
                    }
                }
                else { //In case of document, drop zones are not available so directly get names from raw data
                    for (var i = 2; i < rowTitles.titles.length; i++) {
                        groupby.push(rowTitles.titles[i].n);
                    }
                }

                var addseriesparam = [];
                addseriesparam.push(series); //add series attribute

                var xpercentage;
                if (me.zonesModel && me.zonesModel.getDropZones().zones[3].items[0]) {
                    //if dropzone is available, get attribute labels from it otherwise get from rawData. In case of documents, drop zones are not available
                    //but still it will work by getting the labels directly from raw data.
                    xpercentage = me.zonesModel.getDropZones().zones[3].items[0].n;
                }
                else {
                    if (colTitles.titles[0].es[0]) {
                        xpercentage = colTitles.titles[0].es[0].n;
                    }
                }

                var ypercentage;
                if (me.zonesModel && me.zonesModel.getDropZones().zones[4].items[0]) {
                    ypercentage = me.zonesModel.getDropZones().zones[4].items[0].n;
                }
                else {
                    if (colTitles.titles[0].es[1]) {
                        ypercentage = colTitles.titles[0].es[1].n;
                    }
                }
                var colorAxisPercentage;
                if (me.zonesModel && me.zonesModel.getDropZones().zones[5].items[0]) {
                    colorAxisPercentage = me.zonesModel.getDropZones().zones[5].items[0].n;
                }
                else {
                    if (colTitles.titles[0].es[2]) {
                        colorAxisPercentage = colTitles.titles[0].es[2].n;
                    }
                }

                if (colorAxisPercentage) {
                    //In case color Axis drop zone is used, add gradient colors to the rectangle by color axis metric
                    addseriesparam.push(groupby[0]);
                }

                var chart = d3.select(me.domNode).select("svg");

                //to clear the domNode before redrawing
                if (!chart.empty()) {
                    var e = me.domNode.querySelector(".mekko");
                    me.domNode.removeChild(e);
                }
                var svg = dimple.newSvg(me.domNode, total_width, total_height);


                // Create and position the chart
                var myChart = new dimple.chart(svg, dataS);
                d3.select(me.domNode).select("svg")
                    .attr("class", "mekko")
                    .on("click", function (d) {
                        //In case of IE,Safari and Firefox, clicking on whitespace in SVG doesn't perform deselect operation. To perform deselection, you have to re-click the selected object.
                        //In IE, selection of an object invokes this listener and gets errored out. Hence, allowing this listener for deselection only in case of chrome.
                        if (!detectIE() && event.target.classList.contains('mekko')) {
                            //to reset the width of the previously selected rect
                            if (selectedRect) {
                                var rect = document.querySelector("." + selectedRect);
                                rect.style["strokeWidth"] = "";
                                selectedRect = undefined;
                            }
                            me.clearSelections();
                            me.endSelections();
                        } else {
                            return true;
                        }
                    });


                myChart.setMargins(margin.left, margin.right, margin.top, margin.bottom);
                // Add a Grouped Mekko Axis.  For eg: This will show Brands grouped by owners
                // sized by unit sales.
                var xaxis = myChart.addAxis("x", groupby, xpercentage);
                xaxis.showPercent = true;
                // xaxis.title = addseriesparam[0] + "  grouped by  "+ groupby[0] + "  Sized by  " + xpercentage;
                xaxis.title = xpercentage;

                // Add the vertical measure For eg:, to show unit sales
                var yaxis = myChart.addPctAxis("y", ypercentage);


                // Color by Unit Sales.  By defining this without specifying the color
                // range in the second parameter, dimple will assign colors as usual
                // and adjust saturation based on the Unit Sales value.
                var thsize; //to identify whether thresholding is enabled
                var colorAxisID;
                for (var i = 0; i < colTitles.titles[0].es.length; i++) {
                    if (colTitles.titles[0].es[i].n === colorAxisPercentage)
                        colorAxisID = i;
                }
                if (is10point3 && !isDocument && colorAxisID) {
                    thsize = me.dataInterface.data.th[colorAxisID].length;
                }
                if (!thsize) {
                    var colorAxis = myChart.addColorAxis(colorAxisPercentage); //to provide graded coloring for the series based on measure value
                }
                else {
                    //using colors from threshold
                    var colorscale = [];
                    colorscale.push(me.dataInterface.data.th[colorAxisID][0].fillclr);
                    colorscale.push(me.dataInterface.data.th[colorAxisID][thsize - 1].fillclr);
                    var colorAxis = myChart.addColorAxis(colorAxisPercentage, colorscale);
                }

                // Override the minimum axis value to a lower number.  By default the
                // range of values is used with the minimum being 0 saturation and the
                // maximum being 100% this causes the bars to be too washed out in this
                // particular case.
                colorAxis.overrideMin = -10000;

                // For eg: Draw SKU's for the series, by specifying owner second here, it
                // ensures dimple will color by owner rather than SKU.  This suits the
                // grouping to give blocks of color for each owner faded by the SKU
                // unit sales value.
                mySeries = myChart.addSeries(addseriesparam, dimple.plot.bar);
                mySeries.addOrderRule(addseriesparam); //to order the elements in yAxis

                //to add labels to bars
                mySeries.afterDraw = function (shape, data) {
                    // Get the shape as a d3 selection
                    var s = d3.select(shape),
                        rect = {
                            x: parseFloat(s.attr("x")),
                            y: parseFloat(s.attr("y")),
                            width: parseFloat(s.attr("width")),
                            height: parseFloat(s.attr("height"))
                        };
                    // Only label bars where the text can fit
                    if (rect.height >= 30 && rect.width >= 150) {
                        // Add a text label for the value
                        var label = svg.append("text")
                            .attr("class", "label")
                            // Position in the centre of the shape (vertical position is
                            // manually set due to cross-browser problems with baseline)
                            .attr("x", rect.x + rect.width / 2)
                            .attr("y", rect.y + rect.height / 2 + 3.5)
                            // Centre align

                            .style("text-anchor", "middle")
                            .style("font-size", "10px")
                            .style("font-family", "sans-serif")
                            // Make it a little transparent to tone down the black
                            .style("opacity", 0.6)
                            .text(groupby[0] + ": " + data.xField[0]);
                        label.append("tspan")
                            .text(addseriesparam[0] + ": " + data.aggField[0])
                            .attr("x", rect.x + rect.width / 2)
                            .attr("y", rect.y + rect.height / 2 + 4.5)
                            .attr("dy", "1.4em");

                        //   .html(groupby[0] + ": "+ data.aggField[1] + " <br/> " + addseriesparam[0] +": "+  data.aggField[0]);

                    }
                };

                // Add a legend
                myChart.addLegend(legendPos.x, legendPos.y, legendPos.width - legendPos.x, legendPos.height, legendPos.align);

                //if date or animate by attribute is available, then use animation feature
                if (date) {
                    // Animate the chart by animate attribute (date)
                    myStoryBoard = myChart.setStoryboard(date);
                    myStoryBoard.frameDuration = transitionInMilliSec; //to set the transition speed of frames

                    //to clear the label from previous frame
                    myStoryBoard.onTick = function (e) {
                        myChart.svg.selectAll(".label").remove();
                    };
                }


                //if metric threshold is not used, set the colors from custom properties once it's available
                if (!thsize) {
                    if (is10point3 && me.zonesModel && colorAxisPercentage && colorby.colorbyattr !== groupby[0]) {
                        delete properties["fillColor"];
                        properties["colorBy"] = "All";
                        delete colorby["colorByElements"];
                        colorby["colorByElements"] = model.getRowHeaders(2).getHeader(2).t.es;
                    }
                    if (colorAxisPercentage && colorby.colorbyattr === groupby[0]) {
                        for (var i = 0; i < colors.length; i++) {
                            myChart.assignColor(colorby.colorByElements[i].n, colors[i].fill, colors[i].stroke, colors[i].opacity);
                        }
                    }
                    if (is10point3 && me.zonesModel && !colorAxisPercentage && colorby.colorbyattr !== addseriesparam[0]) {
                        delete properties["fillColor"];
                        properties["colorBy"] = "All";
                        delete colorby["colorByElements"];
                        colorby["colorByElements"] = model.getRowHeaders(2).getHeader(1).t.es;
                    }
                    if (!colorAxisPercentage && colorby.colorbyattr === addseriesparam[0]) {
                        for (var i = 0; i < colors.length; i++) {
                            myChart.assignColor(colorby.colorByElements[i].n, colors[i].fill, colors[i].stroke, colors[i].opacity);
                        }
                    }
                }

                // Draw the chart
                myChart.draw();


                //to enable filter functionality in the chart
                mySeries.addEventHandler("click", function (e) {
                    //to reset the width of the previously selected rect
                    var className = e.selectedShape[0][0].className.baseVal;
                    className = className.split(' ').join('.'); //make the class names to be . separated
                    if (selectedRect) {
                        var rect = document.querySelector("." + selectedRect);
                        rect.style["strokeWidth"] = "";
                    }
                    if (selectedRect === className) {
                        selectedRect = undefined;
                        me.clearSelections();
                        me.endSelections();
                    }
                    else {
                        me.applySelection(rawD.children[dateIndexMap[e.frameValue]].children[seriesIndexMap[e.seriesValue[0]]].children[0].attributeSelector);
                        selectedRect = className;
                        e.selectedShape[0][0].style["strokeWidth"] = selectedStrokeWidth; //if a rect is selected, inc its stroke width
                    }

                });
                //for the first time while loading, when colors[] var is empty, populate colors[] with the default colors assigned by library
                if (colorby.colorByElements) {
                    colorby["colorbyattr"] = colorAxisPercentage ? groupby[0] : addseriesparam[0];
                    colors = [];
                    for (var i = 0; i < colorby.colorByElements.length; i++) {
                        colors[i] = myChart.getColor(colorby.colorByElements[i].n);
                    }
                }
                function detectIE() {
                    var ua = window.navigator.userAgent;
                    // IE 10
                    // ua = 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)';

                    // IE 11
                    // ua = 'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko';

                    // Edge 12 (Spartan)
                    // ua = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36 Edge/12.0';

                    // Edge 13
                    // ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2486.0 Safari/537.36 Edge/13.10586';

                    var msie = ua.indexOf('MSIE ');
                    var trident = ua.indexOf('Trident/');
                    var edge = ua.indexOf('Edge/');

                    return msie > 0 || trident > 0 || edge > 0;
                }

            }
        })
}());
//@ sourceURL=D3Mekko.js