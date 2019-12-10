

let app;

function init() {

    app = new Vue({
        el: "#app",
        data: {
            mapLatitude: 44.94317442551431,
            mapLongitude: -93.10775756835939,
            incidents: [],
            showTable: true
        },
        methods: {
            changeLatLng: function() {
                leafletMap.panTo([this.mapLatitude, this.mapLongitude]);
            },
            getCrimeData: function() {
                // By default, include crimes from 10/01/2019 to 10/31/2019
                let incidents = [];
                $.getJSON('http://localhost:8000/incidents?limit=10&start_date=2019-10-01&end_date=2019-10-31')
                    .then(data => {
                        for(let i in data){
                            let incident = data[i];
                            let neighborhood_name, incident_type;
                            $.when(
                                $.getJSON('http://localhost:8000/neighborhoods?id='+incident.neighborhood_number, (data) => {
                                    neighborhood_name = data['N'+incident.neighborhood_number];
                                    incident.neighborhood_name = neighborhood_name;
                                }),
                                $.getJSON('http://localhost:8000/codes?code='+incident.code, (data) => {
                                    incident_type = data['C'+incident.code];
                                    incident.incident_type = incident_type;
                                })
                            ).then(() => {
                                incidents.push(incident);
                                this.incidents = incidents;
                                console.log(incidents);
                            })
                        }
                    })
            }
        }
    });

    leafletMapInit();
}

let leafletMap;
function leafletMapInit(){
    // console.log(app);
    let stPaulLatLng = [app.mapLatitude, app.mapLongitude]; // Latitude and longitude of St. Paul
    leafletMap = L.map('map', {minZoom: 13, maxZoom: 17, maxBounds: [[44.875822, -92.984848],[44.99564, -93.229122]], center: stPaulLatLng, zoom: 13}); // mouse click-and-drag and scroll wheel interaction available by default

    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 17,
        id: 'mapbox/streets-v11',
        accessToken: 'pk.eyJ1IjoiYWpwMCIsImEiOiJjazN4cGd4MGQxNW1hM3F0NnU5M3Jiem80In0.71DleDv1Fm-ArumkU37BjA'
    }).addTo(leafletMap);

    leafletMap.on('click', onMapClick);
    leafletMap.on('move', onMapChange);
    leafletMap.on('zoom', onMapChange);

    addPolygon();
}

function onMapChange(){
    let latLng = leafletMap.getCenter();
    app.mapLatitude = latLng.lat;
    app.mapLongitude = latLng.lng;
}

let popup = L.popup();
function onMapClick(e) {
    popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + e.latlng.toString())
        .openOn(leafletMap);
}

function addPolygon(){
    // Polygon for St. Paul
    let polygon = L.polygon([
        [44.987922, -93.207506],
        [44.991685, -93.005289],
        [44.891321, -93.004774],
        [44.919406, -93.050779],
        [44.919649, -93.128541],
        [44.887429, -93.173517],
        [44.909195, -93.202013]
    ]).addTo(leafletMap);
}