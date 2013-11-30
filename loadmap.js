var map = null;
var info = null;
var legend = null;
var geojsonLayer;
var startZoom = 12;

var currStat = "l_pp_day_2009";
var themeGrades = [0, 50, 100, 150, 200, 250, 300, 350];

function init() {
    //Initialize the map on the "map" div
    map = new L.Map('map');
    
    //Control that shows state info on hover
    info = L.control();

    info.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'info');
        this.update();
        return this._div;
    };

    info.update = function (props) {
        this._div.innerHTML = (props ? '<h4>' + props.suburbs + ' VIC ' + props.id.replace("POA", "") +
            '</h4>Water/person/day <b>' + parseInt(props.l_pp_day_2009).toString() + ' L</b><br/>' +
            '</h4>Water/household/day <b>' + parseInt(props.l_hh_day_2009).toString() + ' L</b><br/>' +
            '</h4>Avg people per HH <b>' + props.hh_avg_size.toString() + '</b><br/>' +
            '</h4>HH Median income <b>$' + props.hh_med_income.toString() + '</b><br/>' +
            '</h4>Household count <b>' + props.hh_count.toString() + '</b><br/>' +
            '</h4>Households/sq km <b>' + parseInt(props.hh_density.toString()).toString() + '</b><br/>'
            : 'Select a postcode');
    };

    info.addTo(map);
    
    //Create a legend control
    legend = L.control({ position: 'bottomright' });

    legend.onAdd = function (map) {

        var div = L.DomUtil.create('div', 'info legend'),
            grades = themeGrades,
            labels = [],
            from, to;

        for (var i = 0; i < grades.length; i++) {
            from = grades[i];
            to = grades[i + 1];

            labels.push(
                '<i style="background:' + getColor(from + 1) + '"></i> ' +
                from + (to ? '&ndash;' + to : '+'));
        }

        div.innerHTML = "<h4>Daily water use</h4>" +
                        "<h4><select id='selectStat' class='dropdown'>" +
                           "<option value='person'>per person</option>" +
                           "<option value='household'>per household</option>" +
                        "</select></h4>" +
                        "<div id='mapLegend'>" + labels.join('<br/>') + '</div>';
        return div;
    };

    legend.addTo(map);

    //Change map theme when legend dropdown changes
    $('#selectStat').change(function () {
        var selection = this.value;

        switch(selection)
        {
            case "person":
                currStat = "l_pp_day_2009";
                themeGrades = [0, 50, 100, 150, 200, 250, 300, 350];
                break;
            case "household":
                currStat = "l_hh_day_2009";
                themeGrades = [0, 100, 200, 300, 400, 500, 600, 700];
                break;
            default:
                currStat = "l_pp_day_2009";
                themeGrades = [0, 50, 100, 150, 200, 250, 300, 350];
        }

        //Refresh the boundaries
        loadGeoJson(json);

        //Update the legend
        labels = []

        for (var i = 0; i < themeGrades.length; i++) {
            from = themeGrades[i];
            to = themeGrades[i + 1];

            labels.push(
                '<i style="background:' + getColor(from + 1) + '"></i> ' +
                from + (to ? '&ndash;' + to : '+'));
        }

        var data = labels.join('<br/>');

        $("#mapLegend").hide().html(data).fadeIn('fast');

    });

    //Add funky new Mozilla themed MapBox tiles
    var tiles = new L.TileLayer('http://d.tiles.mapbox.com/v3/mozilla-webprod.e91ef8b3/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
        maxZoom: 14,
        opacity: 0.65
    });

    //Add the tiled map layer to the map
    map.addLayer(tiles);
    
    //Change the start zoom and font size based on window size
    var windowWidth = $(window).width();
    var windowHeight = $(window).height();
    var width = 0

    if (windowWidth > windowHeight) width = windowWidth;
    else width = windowHeight;

    console.log($('.info').css('font'));

    console.log(width);

    if (width > 2000) {
        startZoom += 1;
        $('.info').css({ 'font': 'normal normal normal 16px/22px Arial, Helvetica, sans-serif', 'line-height': '22px' });
        $('.legend').css({ 'font': 'normal normal normal 16px/22px Arial, Helvetica, sans-serif', 'line-height': '22px' });
        $('.dropdown').css({ 'line-height': '22px' });
    }
    else if (width < 1200) {
        $('.info').css({ 'font': 'normal normal normal 12px/16px Arial, Helvetica, sans-serif', 'line-height': '18px' });
        $('.legend').css({ 'font': 'normal normal normal 12px/16px Arial, Helvetica, sans-serif', 'line-height': '18px' });
        $('.dropdown').css({ 'line-height': '18px' });
    }

    console.log($('.info').css('font'));

    //Set the view to a given center and zoom
    map.setView(new L.LatLng(-37.814666, 144.964256), startZoom);

    //Acknowledge the data providers
    map.attributionControl.addAttribution('Census data © <a href="http://www.abs.gov.au/websitedbs/D3310114.nsf/Home/%C2%A9+Copyright">ABS</a>');
    map.attributionControl.addAttribution('Water data © <a href="http://www.dse.vic.gov.au/">Victorian Department of Sustainability and Environment</a>');

    //Display the boundaries
    loadGeoJson(json);

}

function loadGeoJson(json) {
    if (json != null) {
        try {
            geojsonLayer.clearLayers();
        }
        catch (err) {
            //dummy
        }

        geojsonLayer = L.geoJson(json, {
            style: style,
            onEachFeature: onEachFeature
        }).addTo(map);
    }
}


//Sets style on each GeoJSON object
function style(feature) {
    colVal = parseFloat(feature.properties[currStat]);

    return {
        weight: 1,
        opacity: 0.6,
        color: getColor(colVal),
        fillOpacity: 0.4,
        fillColor: getColor(colVal)
    };
}

//Get color depending on value
function getColor(d) {
    return d > themeGrades[7] ? '#800026' :
           d > themeGrades[6] ? '#BD0026' :
           d > themeGrades[5] ? '#E31A1C' :
           d > themeGrades[4] ? '#FC4E2A' :
           d > themeGrades[3] ? '#FD8D3C' :
           d > themeGrades[2] ? '#FEB24C' :
           d > themeGrades[1] ? '#FED976' :
                                '#FFEDA0';
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: highlightFeature
    });
}

function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#666',
        fillOpacity: 0.65
    });

    if (!L.Browser.ie && !L.Browser.opera) {
        layer.bringToFront();
    }

    info.update(layer.feature.properties);

}

function resetHighlight(e) {
    geojsonLayer.resetStyle(e.target);
    info.update();
}
